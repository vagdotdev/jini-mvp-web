"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type OrderRow = {
  id: string;
  created_at: string;
  amount_inr: number;
  buyer_name: string | null;
  buyer_phone: string | null;
  item_name: string | null;
  item_image_display_url: string | null;
  stream_slug: string | null;
  stream_title: string | null;
  shipping_address: string | null;
};

type OrdersResponse = {
  demo?: boolean;
  orders?: OrderRow[];
  error?: string;
};

export default function AdminOrdersPage() {
  const [secret, setSecret] = useState("");
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const buildHeaders = useCallback(() => {
    const headers: Record<string, string> = {};
    if (secret.trim()) headers["x-jini-create-secret"] = secret.trim();
    return headers;
  }, [secret]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders?limit=200", {
        headers: buildHeaders(),
      });
      const json = (await res.json().catch(() => ({}))) as OrdersResponse;
      if (!res.ok) {
        setError(json.error || res.statusText);
        return;
      }
      setOrders(json.orders || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [buildHeaders]);

  const exportCsv = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders?format=csv&limit=500", {
        headers: buildHeaders(),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error || res.statusText);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jini-recent-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not export CSV");
    } finally {
      setExporting(false);
    }
  }, [buildHeaders]);

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#f7f2ea_34%,#eee7dc_70%,#e8ddcf_100%)] px-5 py-8 text-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-xl shadow-zinc-900/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
                Jini Control
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Recent orders</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Paid orders feed for ops review and export.
              </p>
            </div>
            <Link
              href="/admin"
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Back to streams
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              className="h-9 w-48 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-950 outline-none ring-violet-500 placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white focus:ring-2"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void loadOrders()}
              placeholder="Secret"
              autoComplete="off"
              aria-label="Admin secret for orders"
            />
            <button
              type="button"
              onClick={() => void loadOrders()}
              disabled={loading}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Load orders"}
            </button>
            <button
              type="button"
              onClick={() => void exportCsv()}
              disabled={exporting}
              className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {exporting ? "Exporting..." : "Export CSV (Excel)"}
            </button>
          </div>
        </header>

        <section className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-xl shadow-zinc-900/5">
          {error ? (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          ) : null}

          {orders === null ? (
            <p className="text-sm text-zinc-500">
              Load orders to view paid purchases. If no payments yet, this will show an empty state.
            </p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-zinc-500">No new recent orders.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2">Buyer</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Stream</th>
                    <th className="px-3 py-2">Shipping</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="rounded-xl bg-zinc-50 text-sm text-zinc-800">
                      <td className="rounded-l-xl px-3 py-3 font-mono text-xs text-zinc-600">
                        {o.id.slice(0, 8)}...
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{o.buyer_name || "Unknown buyer"}</p>
                        <p className="text-xs text-zinc-500">{o.buyer_phone || "No phone"}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-10 w-8 shrink-0 rounded bg-zinc-200 bg-cover bg-center"
                            style={{
                              backgroundImage: o.item_image_display_url
                                ? `url(${o.item_image_display_url})`
                                : undefined,
                            }}
                          />
                          <span className="max-w-52 truncate">{o.item_name || "Item"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="truncate">{o.stream_title || "Untitled stream"}</p>
                        <p className="text-xs text-zinc-500">{o.stream_slug || "-"}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="max-w-56 whitespace-pre-wrap break-words text-xs text-zinc-700">
                          {o.shipping_address || "Not captured"}
                        </p>
                      </td>
                      <td className="px-3 py-3 font-semibold">₹{o.amount_inr}</td>
                      <td className="rounded-r-xl px-3 py-3 text-xs text-zinc-500">
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
