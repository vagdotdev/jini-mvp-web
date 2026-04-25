import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger, wrapRoute } from "@/lib/logger";

const MAX_ACTIVE_ITEMS_PER_STREAM = 4;

type CreateItemBody = {
  token?: string;
  name?: string;
  price_inr?: number;
  size_label?: string;
  image_display_url?: string;
  image_raw_url?: string;
  image_variant?: "direct" | "generated";
};

async function resolveStreamFromBuddyToken(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  token: string,
) {
  return admin
    .from("live_streams")
    .select("id, status")
    .eq("buddy_token", token)
    .maybeSingle();
}

export const GET = wrapRoute("api.items.get", async (req: Request) => {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const { data: stream, error: streamError } = await resolveStreamFromBuddyToken(
    admin,
    token,
  );
  if (streamError) {
    logger.error("api.items.get", "stream lookup failed", { error: streamError.message });
    return NextResponse.json({ error: streamError.message }, { status: 500 });
  }
  if (!stream) {
    return NextResponse.json({ error: "Invalid buddy link" }, { status: 401 });
  }
  if (stream.status === "ended") {
    return NextResponse.json(
      { error: "This stream has ended. Buddy actions are disabled." },
      { status: 410 },
    );
  }

  const { data, error } = await admin
    .from("stream_items")
    .select(
      "id, name, price_inr, size_label, image_display_url, status, created_at",
    )
    .eq("stream_id", stream.id)
    .in("status", ["active", "locked"])
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("api.items.get", "items query failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: data || [],
    max_active: MAX_ACTIVE_ITEMS_PER_STREAM,
  });
});

export const POST = wrapRoute("api.items.post", async (req: Request) => {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as CreateItemBody;
  if (!body.token || !body.name || !body.price_inr) {
    return NextResponse.json(
      { error: "Missing token, name, or price" },
      { status: 400 },
    );
  }

  const { data: stream, error: streamError } = await resolveStreamFromBuddyToken(
    admin,
    body.token,
  );
  if (streamError) {
    logger.error("api.items.post", "stream lookup failed", { error: streamError.message });
    return NextResponse.json({ error: streamError.message }, { status: 500 });
  }
  if (!stream) {
    return NextResponse.json({ error: "Invalid buddy link" }, { status: 401 });
  }
  if (stream.status === "ended") {
    return NextResponse.json(
      { error: "This stream has ended. You cannot publish new items." },
      { status: 410 },
    );
  }

  const { count, error: countError } = await admin
    .from("stream_items")
    .select("id", { count: "exact", head: true })
    .eq("stream_id", stream.id)
    .in("status", ["active", "locked"]);
  if (countError) {
    logger.error("api.items.post", "count query failed", { error: countError.message });
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }
  if ((count ?? 0) >= MAX_ACTIVE_ITEMS_PER_STREAM) {
    return NextResponse.json(
      {
        error: `You can only have ${MAX_ACTIVE_ITEMS_PER_STREAM} live items at once. Remove one before adding another.`,
        code: "MAX_ACTIVE_ITEMS",
      },
      { status: 409 },
    );
  }

  const { data, error } = await admin
    .from("stream_items")
    .insert({
      stream_id: stream.id,
      name: body.name.trim(),
      price_inr: body.price_inr,
      size_label: body.size_label?.trim() || null,
      image_display_url: body.image_display_url || null,
      image_raw_url: body.image_raw_url || body.image_display_url || null,
      image_variant: body.image_variant || "direct",
      status: "active",
    })
    .select("id, name, price_inr, status")
    .single();

  if (error) {
    logger.error("api.items.post", "insert failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("api.items.post", "item published", {
    stream_id: stream.id,
    item_id: data.id,
  });
  return NextResponse.json({ item: data });
});
