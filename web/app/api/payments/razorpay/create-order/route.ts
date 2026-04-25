import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createRazorpayOrder } from "@/lib/payments/razorpay-order";
import { razorpayConfigured } from "@/lib/payments/razorpay-config";
import { logger, wrapRoute } from "@/lib/logger";

type Body = {
  item_id?: string;
  /** For dev / tests when Razorpay keys exist but item flow is skipped. Min ₹1 (100 paise). */
  amount_paise?: number;
};

/**
 * POST /api/payments/razorpay/create-order
 * Creates a Razorpay Order for checkout. Prefer item_id when the viewer holds the lock.
 * When keys are missing, returns a structured stub so the UI can show "payments not wired yet".
 */
export const POST = wrapRoute("api.payments.razorpay.create-order", async (req: Request) => {
  const supabase = await createServerSupabaseClient();
  const admin = createAdminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  let amountPaise: number | null = null;
  let notes: Record<string, string> = { user_id: user.id };

  if (typeof body.item_id === "string" && body.item_id.trim()) {
    const itemId = body.item_id.trim();
    const { data: item, error: itemErr } = await admin
      .from("stream_items")
      .select("id, price_inr, status, locked_by, lock_expires_at, stream_id, name")
      .eq("id", itemId)
      .maybeSingle();
    if (itemErr) {
      return NextResponse.json({ error: itemErr.message }, { status: 500 });
    }
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (item.status !== "locked" || item.locked_by !== user.id) {
      return NextResponse.json(
        { error: "Reserve this item first (Buy now) before paying." },
        { status: 409 },
      );
    }
    if (item.lock_expires_at && new Date(item.lock_expires_at) < new Date()) {
      return NextResponse.json({ error: "Hold expired — reserve again." }, { status: 409 });
    }
    amountPaise = item.price_inr * 100;
    notes = {
      ...notes,
      item_id: item.id,
      stream_id: item.stream_id,
      item_name: item.name.slice(0, 120),
    };
  } else if (typeof body.amount_paise === "number" && Number.isFinite(body.amount_paise)) {
    amountPaise = Math.round(body.amount_paise);
  }

  if (amountPaise == null || amountPaise < 100) {
    return NextResponse.json(
      { error: "Send item_id (locked to you) or amount_paise (min 100)." },
      { status: 400 },
    );
  }

  if (!razorpayConfigured()) {
    return NextResponse.json({
      configured: false,
      amount_paise: amountPaise,
      currency: "INR",
      message:
        "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local, then restart the dev server.",
    });
  }

  try {
    const receipt = `jini_${nanoid(10)}`;
    const order = await createRazorpayOrder({
      amountPaise,
      receipt,
      notes,
    });
    logger.info("api.payments.razorpay.create-order", "order created", {
      order_id: order.id,
      user_id: user.id,
    });
    return NextResponse.json({
      configured: true,
      key_id: process.env.RAZORPAY_KEY_ID,
      order,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Razorpay error";
    logger.error("api.payments.razorpay.create-order", msg, {});
    return NextResponse.json({ error: msg }, { status: 502 });
  }
});
