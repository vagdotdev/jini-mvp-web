"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AccountPayload = {
  email: string | null;
  profile: {
    full_name: string | null;
    phone: string | null;
    default_shipping_address: { line1?: string } | null;
  } | null;
  wallet: { balance_paise: number };
};

export default function AccountPage() {
  const [data, setData] = useState<AccountPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/account", { credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as AccountPayload & {
        error?: string;
      };
      if (cancelled) return;
      if (!res.ok) {
        setErr(
          res.status === 401
            ? "Sign in first — open a stream link, use Google or Skip Google (dev), then open Account again."
            : json.error || "Could not load account.",
        );
        setLoading(false);
        return;
      }
      setData({
        email: json.email ?? null,
        profile: json.profile ?? null,
        wallet: json.wallet ?? { balance_paise: 0 },
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-zinc-600">
        Loading your Jini account…
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-red-700">{err || "Something went wrong."}</p>
        <p className="mt-4 text-sm text-zinc-600">
          <Link href="/dev" className="font-medium text-violet-700 hover:underline">
            Back home
          </Link>
        </p>
      </div>
    );
  }

  const addr = data.profile?.default_shipping_address;
  const line1 =
    addr && typeof addr === "object" && "line1" in addr
      ? String((addr as { line1?: string }).line1 ?? "")
      : "";
  const balanceInr = (data.wallet.balance_paise / 100).toFixed(2);

  return (
    <div className="min-h-full bg-zinc-50 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-lg space-y-6 py-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
            Jini
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Your account</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Name, phone, and address are saved when you complete stream onboarding.
            Edit them here anytime (saved to your profile).
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Signed in as</h2>
          <p className="mt-1 text-sm text-zinc-700">{data.email || "—"}</p>
        </section>

        <section className="rounded-2xl border border-violet-100 bg-violet-50/80 p-5">
          <h2 className="text-sm font-semibold text-violet-950">Jini credits</h2>
          <p className="mt-2 text-2xl font-bold text-violet-900">₹{balanceInr}</p>
          <p className="mt-2 text-xs leading-relaxed text-violet-900/80">
            Top-ups via Razorpay will land here once checkout is connected. This
            balance is for future use against live drops.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Delivery profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">Name</dt>
              <dd className="font-medium text-zinc-900">
                {data.profile?.full_name?.trim() || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Phone</dt>
              <dd className="font-medium text-zinc-900">
                {data.profile?.phone?.trim() || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Address</dt>
              <dd className="whitespace-pre-wrap font-medium text-zinc-900">
                {line1 || "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-zinc-500">
            To update, join any stream onboarding again with the same login, or we
            can add inline edit in a follow-up.
          </p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dev"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Back home
          </Link>
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Control panel
          </Link>
        </div>
      </div>
    </div>
  );
}
