/**
 * Create a Razorpay Order (server-side). Amount is in paise (smallest currency unit).
 * Docs: https://razorpay.com/docs/api/orders/create/
 */
export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string; receipt: string }> {
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
