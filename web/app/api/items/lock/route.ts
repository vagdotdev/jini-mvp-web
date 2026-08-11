import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { releaseExpiredLocks } from "@/lib/streams/release-locks";
import { logger, wrapRoute } from "@/lib/logger";

type LockBody = {
  item_id?: string;
};

export const POST = wrapRoute("api.items.lock", async (req: Request) => {
  const admin = createAdminClient();
  const supabase = await createServerSupabaseClient();
  if (!admin || !supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { item_id } = (await req.json().catch(() => ({}))) as LockBody;
  if (!item_id) {
    return NextResponse.json({ error: "Missing item_id" }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  await releaseExpiredLocks().catch(() => undefined);

  const { data: itemRow, error: itemReadError } = await admin
    .from("stream_items")
    .select("id, stream_id, name, price_inr, status")
    .eq("id", item_id)
    .maybeSingle();
  if (itemReadError) {
    return NextResponse.json({ error: itemReadError.message }, { status: 500 });
  }
  if (!itemRow) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (itemRow.status !== "active") {
    return NextResponse.json(
      { error: "This item is already locked or sold" },
      { status: 409 },
    );
  }

  const { data: streamRow, error: streamError } = await admin
    .from("live_streams")
    .select("id, commerce_enabled, status")
    .eq("id", itemRow.stream_id)
    .maybeSingle();
  if (streamError) {
    return NextResponse.json({ error: streamError.message }, { status: 500 });
  }
  if (!streamRow || streamRow.status === "ended") {
    return NextResponse.json(
      { error: "This stream is not accepting purchases." },
      { status: 410 },
    );
  }
  if (streamRow.commerce_enabled !== true) {
    return NextResponse.json(
      { error: "Buying is paused for this stream right now." },
      { status: 403 },
    );
  }

  const { data: access, error: accessError } = await admin
    .from("stream_access")
    .select("id")
    .eq("stream_id", itemRow.stream_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (accessError) {
    return NextResponse.json({ error: accessError.message }, { status: 500 });
  }
  if (!access) {
    return NextResponse.json(
      {
        error:
          "Complete onboarding for this stream before buying (so we know it is you in this room).",
      },
      { status: 403 },
    );
  }

  const lockExpiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  const { data: item, error } = await admin
    .from("stream_items")
    .update({
      status: "locked",
      locked_by: user.id,
      lock_expires_at: lockExpiresAt,
    })
    .eq("id", item_id)
    .eq("status", "active")
    .select("id, name, price_inr, locked_by, lock_expires_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!item) {
    return NextResponse.json(
      { error: "This item is already locked or sold" },
      { status: 409 },
    );
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      item_id,
      buyer_id: user.id,
      amount_inr: item.price_inr,
      status: "pending",
    })
    .select("id, amount_inr, status")
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const buyerLabel = profile?.full_name?.trim() || "A shopper";

  await admin.from("chat_messages").insert({
    stream_id: itemRow.stream_id,
    user_id: user.id,
    message: `${buyerLabel} reserved «${item.name}» for checkout (2 min hold).`,
    message_type: "purchase",
    sender_display_name: buyerLabel,
  });

  logger.info("api.items.lock", "item locked", {
    item_id: item.id,
    user_id: user.id,
    stream_id: itemRow.stream_id,
  });
  return NextResponse.json({ item, order });
});
