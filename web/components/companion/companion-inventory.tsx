"use client";

import { useCallback, useEffect, useState } from "react";

export type CompanionItem = {
  id: string;
  name: string;
  price_inr: number;
  size_label: string | null;
  image_display_url: string | null;
  status: "active" | "locked" | "sold" | "expired" | "cancelled";
};

type CompanionInventoryProps = {
  token: string;
  refreshKey?: number;
  onChange?: (items: CompanionItem[], maxActive: number) => void;
};

export function CompanionInventory({
  token,
  refreshKey = 0,
  onChange,
}: CompanionInventoryProps) {
  const [items, setItems] = useState<CompanionItem[]>([]);
  const [maxActive, setMaxActive] = useState(4);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDemo = token.startsWith("demo-buddy-");

  const load = useCallback(async () => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/items?token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      const json = (await res.json().catch(() => ({}))) as {
        items?: CompanionItem[];
        max_active?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error || "Could not load current items.");
        return;
      }
      const list = json.items || [];
      setItems(list);
      if (json.max_active) setMaxActive(json.max_active);
      onChange?.(list, json.max_active ?? 4);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load current items.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, isDemo, onChange]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load, refreshKey]);

  async function remove(id: string) {
    if (isDemo) return;
    setRemovingId(id);
    setError(null);
    try {
      const res = await fetch(
        `/api/items/${id}?token=${encodeURIComponent(token)}`,
        { method: "DELETE" },
      );
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error || "Could not remove item.");
        return;
      }
      await load();
    } finally {
      setRemovingId(null);
      setConfirmingId(null);
    }
  }

  function handleRemoveTap(id: string) {
    if (isDemo) return;
    if (confirmingId === id) {
      void remove(id);
      return;
    }
    setConfirmingId(id);
    window.setTimeout(() => {
      setConfirmingId((curr) => (curr === id ? null : curr));
    }, 3000);
  }

  if (isDemo) {
    return (
      <section className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-xs text-zinc-500">
        Inventory list is available after Supabase is connected and you use the
        real buddy link (not the demo one).
      </section>
    );
  }

  const activeCount = items.filter(
    (item) => item.status === "active" || item.status === "locked",
  ).length;
  const remaining = Math.max(0, maxActive - activeCount);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Live items</h2>
          <p className="text-xs text-zinc-500">
            {activeCount}/{maxActive} live · {remaining} slot
            {remaining === 1 ? "" : "s"} left
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-xs text-zinc-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-zinc-500">
          No live items yet. Publish your first one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-2"
            >
              <div
                className="h-14 w-12 shrink-0 rounded-lg bg-zinc-100 bg-cover bg-center"
                style={{
                  backgroundImage: item.image_display_url
                    ? `url(${item.image_display_url})`
                    : undefined,
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {item.name}
                </p>
                <p className="text-xs text-zinc-600">
                  ₹{item.price_inr}
                  {item.size_label ? ` · ${item.size_label}` : ""}
                  {item.status === "locked" ? " · locked" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveTap(item.id)}
                disabled={removingId === item.id}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                  confirmingId === item.id
                    ? "bg-rose-600 text-white hover:bg-rose-500"
                    : "border border-rose-200 text-rose-700 hover:bg-rose-50",
                ].join(" ")}
                title={
                  item.status === "locked"
                    ? "A viewer reserved this — removing will cancel their hold"
                    : "Remove from stream"
                }
              >
                {removingId === item.id
                  ? "Removing…"
                  : confirmingId === item.id
                    ? "Tap again to confirm"
                    : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
