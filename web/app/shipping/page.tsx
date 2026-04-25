import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/site/policy-shell";

export const metadata: Metadata = {
  title: "Shipping · Jini",
};

export default function ShippingPage() {
  return (
    <PolicyShell eyebrow="Policy" title="Shipping">
      <p>We ship across India. Orders go out as fast as we can pack them.</p>
      <ul className="list-disc space-y-1 pl-5 text-zinc-700">
        <li>Delivery in 4–7 working days (remote areas may take a little longer)</li>
        <li>Tracking details sent once the parcel is out</li>
        <li>Shipping charges, if any, shown at checkout — no surprises</li>
      </ul>
      <p>
        Questions about your order? WhatsApp Manasa at{" "}
        <Link
          href="https://wa.me/919148917755"
          className="font-medium text-violet-700 hover:underline"
        >
          +91 91489 17755
        </Link>
        .
      </p>
    </PolicyShell>
  );
}
