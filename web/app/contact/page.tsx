import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/site/policy-shell";

export const metadata: Metadata = {
  title: "Contact · Jini",
  description: "Get in touch with the Jini team.",
};

export default function ContactPage() {
  return (
    <PolicyShell eyebrow="Talk to us" title="Get in touch">
      <p>
        We are a small team. The fastest way to reach us is on WhatsApp — you
        will usually hear back the same day.
      </p>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          WhatsApp / Phone
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          +91 91489 17755
        </p>
        <p className="mt-1 text-sm text-zinc-600">Manasa, Jini team</p>
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

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">Hours</h2>
        <p>Monday to Saturday, 10am – 7pm IST.</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          For order questions
        </h2>
        <p>
          Please share your order details when you message us — it helps us
          help you faster.
        </p>
      </section>
    </PolicyShell>
  );
}
