import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyRazorpayPaymentSignature } from "@/lib/payments/verify-signature";
import { razorpayConfigured } from "@/lib/payments/razorpay-config";
import { wrapRoute } from "@/lib/logger";

type Body = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

/**
 * POST /api/payments/razorpay/verify
 * Client sends IDs after Razorpay Checkout success; server verifies HMAC.
 * Next: mark `orders` paid, `stream_items` sold, clear lock (implement when you go live).
 */
export const POST = wrapRoute("api.payments.razorpay.verify", async (req: Request) => {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  if (!razorpayConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message: "Razorpay keys not set — verification skipped.",
    });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const orderId = body.razorpay_order_id?.trim();
  const paymentId = body.razorpay_payment_id?.trim();
  const signature = body.razorpay_signature?.trim();
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing razorpay_* fields" }, { status: 400 });
  }

  const valid = verifyRazorpayPaymentSignature(orderId, paymentId, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    next: "TODO: fetch payment from Razorpay API, mark order paid + item sold server-side.",
  });
});
