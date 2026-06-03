import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies the signature Razorpay Checkout returns to the client after a successful payment.
 *
 * Algorithm (documented by Razorpay): hex-encoded
 * `HMAC_SHA256(order_id + "|" + payment_id, key_secret)` must equal `signature`.
 *
 * @param orderId - `razorpay_order_id` from Checkout handler
 * @param paymentId - `razorpay_payment_id`
 * @param signature - `razorpay_signature`
 * @returns `false` if `RAZORPAY_KEY_SECRET` is missing, buffers length-mismatch, or MAC mismatch
 *
 * @see https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/#step-3-verify-the-signature
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
