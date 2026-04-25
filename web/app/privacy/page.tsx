import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/site/policy-shell";

export const metadata: Metadata = {
  title: "Privacy · Jini",
};

export default function PrivacyPage() {
  return (
    <PolicyShell eyebrow="Policy" title="Privacy">
      <p>We collect only what is needed to run Jini and deliver your order.</p>
      <ul className="list-disc space-y-1 pl-5 text-zinc-700">
        <li>Phone number, for sign-in and order updates</li>
        <li>Shipping address, for delivery only</li>
        <li>Basic usage data, like which streams you joined</li>
      </ul>
      <p>
        We do not sell your data. Your phone number is never shown publicly or
        in chat. Payments are handled by our payment partner. Jini never stores
        card or UPI details.
      </p>
      <p>
        Questions? Message Manasa at{" "}
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
