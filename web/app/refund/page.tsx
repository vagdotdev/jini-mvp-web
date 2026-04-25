import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/site/policy-shell";

export const metadata: Metadata = {
  title: "Refund policy · Jini",
  description:
    "How refunds work at Jini Live — clear, simple, and on your side.",
};

export default function RefundPage() {
  return (
    <PolicyShell eyebrow="Policy" title="Refunds">
      <p>
        We want every Jini purchase to feel right. If something is off when your
        order arrives, just message us within <strong>48 hours of delivery</strong>{" "}
        and we will sort it out.
      </p>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          What we cover
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Wrong item delivered</li>
          <li>Damaged on arrival (please share a photo)</li>
          <li>Item significantly different from what was shown live</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          What we cannot cover
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Change of mind after delivery (live shopping is final-sale by nature)</li>
          <li>Minor colour or texture variation between screen and real life</li>
          <li>Wear and tear after use</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          How to reach us
        </h2>
        <p>
          WhatsApp Manasa at{" "}
          <Link
            href="https://wa.me/919148917755"
            className="font-medium text-violet-700 hover:underline"
          >
            +91 91489 17755
          </Link>{" "}
          with your order details and a quick photo if relevant.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          Refund processing
        </h2>
        <p>
          Approved refunds are credited back to the original payment method
          within <strong>5–7 working days</strong>.
        </p>
      </section>
    </PolicyShell>
  );
}
