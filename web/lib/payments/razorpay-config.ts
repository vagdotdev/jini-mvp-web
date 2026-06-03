/**
 * Central place for Razorpay-related environment reads.
 *
 * ## Variables (see `README.md` in this folder)
 * - `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` — REST API (orders) and payment-signature verification.
 * - `RAZORPAY_WEBHOOK_SECRET` — raw-body HMAC for `X-Razorpay-Signature` on webhooks.
 *
 * Dashboard: https://dashboard.razorpay.com → API Keys, Webhooks.
 */

/** True when both REST API keys are present (Checkout + Orders can run). */
export function razorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim(),
  );
}

/**
 * Webhook signing secret from Razorpay Dashboard → Webhooks → your endpoint.
 * Undefined in dev is allowed only because the webhook route logs and skips verification;
 * production must set this.
 */
export function getRazorpayWebhookSecret(): string | undefined {
  return process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || undefined;
}
