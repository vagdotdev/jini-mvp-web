import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/site/policy-shell";

export const metadata: Metadata = {
  title: "Contact · Jini",
};

export default function ContactPage() {
  return (
    <PolicyShell eyebrow="Say hello" title="Contact">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          WhatsApp / Phone
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          +91 91489 17755
        </p>
        <p className="mt-1 text-sm text-zinc-500">Manasa · Jini team</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            href="https://wa.me/919148917755"
            className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
          >
            WhatsApp
          </Link>
          <Link
            href="tel:+919148917755"
            className="rounded-xl border border-zinc-300 px-4 py-2 font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            Call
          </Link>
        </div>
      </section>
      <p className="text-zinc-500">
        Mon – Sat, 10am – 7pm IST. Always a real person on the other end.
      </p>
    </PolicyShell>
  );
}
