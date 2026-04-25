import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/site/policy-shell";

export const metadata: Metadata = {
  title: "Shipping · Jini",
  description: "How Jini gets your order to you.",
};

export default function ShippingPage() {
  return (
    <PolicyShell eyebrow="Policy" title="Shipping">
      <p>
        Honestly? Getting your order to you fast and safely is one of our
        favourite parts of this. You just bought something live from a market
        stall in Delhi — and now it is going to land at your doorstep. That
        feels really special to us, and we treat every order that way.
      </p>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          How we ship
        </h2>
        <p>
          We pack your order ourselves and send it through whichever courier
          gets it to you quickest. No rigid contracts, no cutting corners — just
          whatever makes the most sense for your pin code.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          Delivery time
        </h2>
        <p>
          Most orders reach you within <strong>4–7 working days</strong>. If
          you are in a more remote area it might take a little longer — we will
          keep you posted.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">Tracking</h2>
        <p>
          Once your parcel is out the door, we will send you tracking details so
          you always know where it is.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          Shipping charges
        </h2>
        <p>
          Any charges will be shown clearly at checkout — no surprises at the
          end, ever.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          Questions about your order?
        </h2>
        <p>
          Just WhatsApp Manasa at{" "}
          <Link
            href="https://wa.me/919148917755"
            className="font-medium text-violet-700 hover:underline"
          >
            +91 91489 17755
          </Link>{" "}
          — we will personally check on it for you.
        </p>
      </section>
    </PolicyShell>
  );
}
