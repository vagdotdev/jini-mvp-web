import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/site/policy-shell";

export const metadata: Metadata = {
  title: "Shipping · Jini",
  description: "How Jini ships your order across India.",
};

export default function ShippingPage() {
  return (
    <PolicyShell eyebrow="Policy" title="Shipping">
      <p>
        We ship across India. Once your order is paid, our team packs it
        carefully and sends it through whichever courier reaches you fastest and
        safest.
      </p>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          Typical delivery time
        </h2>
        <p>
          Most orders arrive within <strong>4–7 working days</strong>. Remote
          pin codes may take a little longer.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          Tracking
        </h2>
        <p>
          You will get an update with tracking details as soon as the parcel
          leaves us.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          Shipping charges
        </h2>
        <p>
          Charges (if any) are shown clearly at checkout before you pay. No
          surprises.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          Need help with an order?
        </h2>
        <p>
          WhatsApp Manasa at{" "}
          <Link
            href="https://wa.me/919148917755"
            className="font-medium text-violet-700 hover:underline"
          >
            +91 91489 17755
          </Link>{" "}
          and we will personally check on it.
        </p>
      </section>
    </PolicyShell>
  );
}
