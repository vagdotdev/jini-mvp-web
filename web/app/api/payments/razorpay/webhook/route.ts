import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getRazorpayWebhookSecret } from "@/lib/payments/razorpay-config";
import { logger, wrapRoute } from "@/lib/logger";

/**
 * POST /api/payments/razorpay/webhook
 *
 * Razorpay server-to-server events. Register this URL in Dashboard → Webhooks.
 *
 * Security:
 * - When `RAZORPAY_WEBHOOK_SECRET` is set: require `X-Razorpay-Signature` = HMAC-SHA256(hex) of the
 *   **raw** request body with that secret (same pattern as Razorpay’s webhook docs).
 * - When unset: request is accepted for local dev only — **never** ship production without the secret.
 *
 * Current behavior: parses JSON, logs `event`, returns `{ received: true, event }`.
 * Next: handle `payment.captured` (and related) idempotently — credit wallet or mark order paid
 * using payment id as dedupe key; align with whatever `verify` persists.
 *
 * @see web/lib/payments/README.md
 */
export const POST = wrapRoute("api.payments.razorpay.webhook", async (req: Request) => {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature");
  const secret = getRazorpayWebhookSecret();

  if (secret) {
    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    const expected = createHmac("sha256", secret).update(raw).digest("hex");
    try {
      const ok = timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
      if (!ok) {
        return NextResponse.json({ error: "Bad signature" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Bad signature" }, { status: 400 });
    }
  } else {
    logger.warn(
      "api.payments.razorpay.webhook",
      "RAZORPAY_WEBHOOK_SECRET not set — accepting webhook unsigned (dev only)",
    );
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string } } } };
  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  logger.info("api.payments.razorpay.webhook", "event received", {
    event: event.event ?? "unknown",
  });

  return NextResponse.json({ received: true, event: event.event ?? null });
});
