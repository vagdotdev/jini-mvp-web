"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type WalletUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  balance_paise: number;
  created_at: string;
};

type WalletUsersResponse = {
  users?: WalletUser[];
  error?: string;
};

type WalletTopupResponse = {
  ok?: boolean;
  user_id?: string;
  credited_paise?: number;
  new_balance_paise?: number;
  error?: string;
};

function rupeesFromPaise(paise: number): string {
  return (paise / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

export default function WalletTopupPage() {
  const [secret, setSecret] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<WalletUser[] | null>(null);
  const [usersErr, setUsersErr] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [topupBusy, setTopupBusy] = useState<string | null>(null);
  const [rowMessage, setRowMessage] = useState<
    Record<string, { kind: "ok" | "err"; text: string }>
  >({});
  const [toast, setToast] = useState<string | null>(null);

  const buildHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (secret.trim()) headers["x-jini-create-secret"] = secret.trim();
    return headers;
  }, [secret]);

  const loadUsers = useCallback(
    async (q?: string) => {
      setLoadingList(true);
      setUsersErr(null);
      try {
        const search = (q ?? query).trim();
        const url = search
          ? `/api/admin/users?q=${encodeURIComponent(search)}`
          : "/api/admin/users";
        const res = await fetch(url, { headers: buildHeaders() });
        const json = (await res.json().catch(() => ({}))) as WalletUsersResponse;
        if (!res.ok) {
          setUsersErr(json.error || res.statusText);
          return;
        }
        setUsers(json.users || []);
      } catch (e) {
        setUsersErr(e instanceof Error ? e.message : "Could not load users");
      } finally {
        setLoadingList(false);
      }
    },
    [buildHeaders, query],
  );

  async function topUpUser(userId: string) {
    const rawAmount = amounts[userId]?.trim() || "";
    const amountInr = Number(rawAmount);
    if (!Number.isFinite(amountInr) || amountInr === 0) {
      setRowMessage((prev) => ({
        ...prev,
        [userId]: { kind: "err", text: "Enter a non-zero amount (use minus to remove)." },
      }));
      return;
    }
    setTopupBusy(userId);
    setRowMessage((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    try {
      const res = await fetch("/api/admin/wallet/topup", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          user_id: userId,
          amount_inr: amountInr,
          ref: refs[userId]?.trim() || null,
          note: "manual UPI top-up (admin)",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as WalletTopupResponse;
      if (!res.ok || !json.ok) {
        setRowMessage((prev) => ({
          ...prev,
          [userId]: {
            kind: "err",
            text: json.error || res.statusText || "Top-up failed",
          },
        }));
        return;
      }
      const newBalance = Number(json.new_balance_paise) || 0;
      const adjusted = Number(json.credited_paise) || 0;
      setUsers((prev) =>
        prev
          ? prev.map((u) =>
              u.id === userId ? { ...u, balance_paise: newBalance } : u,
            )
          : prev,
      );
      setAmounts((prev) => ({ ...prev, [userId]: "" }));
      setRefs((prev) => ({ ...prev, [userId]: "" }));
      setRowMessage((prev) => ({
        ...prev,
        [userId]: {
          kind: "ok",
          text:
            adjusted > 0
              ? `Credited ₹${rupeesFromPaise(adjusted)} · new balance ₹${rupeesFromPaise(newBalance)}`
              : `Removed ₹${rupeesFromPaise(Math.abs(adjusted))} · new balance ₹${rupeesFromPaise(newBalance)}`,
        },
      }));
      setToast(
        adjusted > 0
          ? `Credited ₹${rupeesFromPaise(adjusted)}`
          : `Removed ₹${rupeesFromPaise(Math.abs(adjusted))}`,
      );
      window.setTimeout(() => setToast(null), 1800);
    } catch (e) {
      setRowMessage((prev) => ({
        ...prev,
        [userId]: {
          kind: "err",
          text: e instanceof Error ? e.message : "Network error",
        },
      }));
    } finally {
      setTopupBusy(null);
    }
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#f7f2ea_34%,#eee7dc_70%,#e8ddcf_100%)] px-5 py-8 text-zinc-950">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Link
          href="/admin"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-violet-700 hover:underline"
        >
          ← Back to admin
        </Link>

        <header className="overflow-hidden rounded-[2rem] bg-zinc-950 p-7 text-white shadow-2xl">
          <div className="flex items-start gap-4">
            <span
              aria-hidden
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H5a2 2 0 0 0 0 4h16v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                <circle cx="17" cy="11" r="1.2" fill="currentColor" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">
                Jini Wallets
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                Top up users
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-300">
                Pilot mode. Collect ₹ via UPI on your phone, then credit each
                buyer&apos;s Jini wallet here. Use a minus amount (example:
                <code className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white/90">-500</code>)
                to remove money if you topped up by mistake.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-xl shadow-zinc-900/5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
            <label className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Search
              </span>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-950 outline-none ring-violet-500 placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white focus:ring-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void loadUsers();
                }}
                placeholder="Name, email, or phone"
                aria-label="Search users"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Admin secret
                <span className="font-normal normal-case text-zinc-400">
                  {" "}
                  if configured
                </span>
              </span>
              <input
                type="password"
                className="mt-1 h-10 w-44 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-950 outline-none ring-violet-500 placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white focus:ring-2"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void loadUsers();
                }}
                placeholder="Leave empty if none"
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={loadingList}
              className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white shadow-md shadow-violet-600/20 hover:bg-violet-700 disabled:opacity-60"
            >
              {loadingList ? "Loading…" : users === null ? "Load users" : "Refresh"}
            </button>
          </div>

          {usersErr ? (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {usersErr}
            </p>
          ) : null}

          <div className="mt-5">
            {users === null ? (
              <p className="text-sm text-zinc-500">
                Click &ldquo;Load users&rdquo; to see who&apos;s onboarded.
                Search narrows the list. Wallets persist across streams.
              </p>
            ) : users.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No matching users yet. Ask buyers to log in once before topping
                up.
              </p>
            ) : (
              <ul className="space-y-3">
                {users.map((u) => {
                  const rowMsg = rowMessage[u.id];
                  const busy = topupBusy === u.id;
                  const label =
                    u.full_name?.trim() ||
                    u.email ||
                    u.phone ||
                    u.id.slice(0, 8);
                  return (
                    <li
                      key={u.id}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-950">
                            {label}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            {[u.email, u.phone].filter(Boolean).join(" · ") ||
                              "No contact yet"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                            Wallet
                          </p>
                          <p className="text-base font-bold text-zinc-950">
                            ₹{rupeesFromPaise(u.balance_paise)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <label className="flex flex-col">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                            Amount ₹
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            // Allows negative values for quick reversal of accidental top-ups.
                            min={-100000}
                            step={1}
                            className="mt-1 h-9 w-28 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
                            value={amounts[u.id] || ""}
                            onChange={(e) =>
                              setAmounts((prev) => ({
                                ...prev,
                                [u.id]: e.target.value,
                              }))
                            }
                            placeholder="500"
                            disabled={busy}
                          />
                        </label>
                        <label className="flex flex-1 flex-col">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                            UPI ref / note
                            <span className="font-normal normal-case text-zinc-400">
                              {" "}
                              optional
                            </span>
                          </span>
                          <input
                            className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
                            value={refs[u.id] || ""}
                            onChange={(e) =>
                              setRefs((prev) => ({
                                ...prev,
                                [u.id]: e.target.value,
                              }))
                            }
                            placeholder="Add UPI txn if needed"
                            disabled={busy}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void topUpUser(u.id)}
                          disabled={busy}
                          className="h-9 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-md shadow-violet-600/20 hover:bg-violet-700 disabled:opacity-60"
                        >
                          {busy ? "Crediting…" : "Top up"}
                        </button>
                      </div>
                      {rowMsg ? (
                        <p
                          className={`mt-3 rounded-xl px-3 py-2 text-xs leading-5 ${
                            rowMsg.kind === "ok"
                              ? "bg-emerald-50 text-emerald-900"
                              : "bg-red-50 text-red-800"
                          }`}
                        >
                          {rowMsg.text}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
      {toast ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50 rounded-xl bg-zinc-950/90 px-4 py-2 text-sm font-medium text-white shadow-2xl ring-1 ring-white/15 backdrop-blur">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
