import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/site/policy-shell";

export const metadata: Metadata = {
  title: "Contact · Jini",
  description: "Say hello to the Jini team.",
};

export default function ContactPage() {
  return (
    <PolicyShell eyebrow="Say hello" title="We are right here">
      <p>
        We are a tiny team and we genuinely love hearing from people. Whether
        you have a question about an order, a piece of feedback, or just want to
        say hi — please reach out. You will always be talking to a real person.
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
        <p>
          Monday to Saturday, 10am – 7pm IST. We try to respond quickly but if
          we miss you, we will always get back by end of day.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          For orders
        </h2>
        <p>
          Drop us your order details when you message and we will get right on
          it — no waiting, no scripts.
        </p>
      </section>
    </PolicyShell>
  );
}
