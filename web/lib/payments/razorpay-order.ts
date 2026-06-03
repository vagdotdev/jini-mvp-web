/**
 * Server-side Razorpay Order creation (Basic auth with key id + secret).
 *
 * @see https://razorpay.com/docs/api/orders/create/
 */

export type RazorpayOrderResult = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
};

/**
 * Creates an order in INR. Razorpay amounts are in **paise** (1 INR = 100 paise).
 *
 * @param amountPaise - Total to charge; must be ≥ 100 (minimum ₹1) per Razorpay rules used here
 * @param receipt - Your reference string; truncated to 40 chars for the API
 * @param notes - Optional metadata (visible in dashboard; do not put secrets here)
 * @throws If keys missing, amount invalid, HTTP error, or response has no `id`
 */
export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResult> {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys not configured");
  }
  if (!Number.isFinite(params.amountPaise) || params.amountPaise < 100) {
    throw new Error("amount_paise must be at least 100 (₹1.00)");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(params.amountPaise),
      currency: "INR",
      receipt: params.receipt.slice(0, 40),
      notes: params.notes ?? {},
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    amount?: number;
    currency?: string;
    receipt?: string;
    error?: { description?: string };
  };
  if (!res.ok) {
    throw new Error(json.error?.description || `Razorpay order failed (${res.status})`);
  }
  if (!json.id) throw new Error("Razorpay returned no order id");
  return {
    id: json.id,
    amount: json.amount ?? params.amountPaise,
    currency: json.currency ?? "INR",
    receipt: json.receipt ?? params.receipt,
  };
}
