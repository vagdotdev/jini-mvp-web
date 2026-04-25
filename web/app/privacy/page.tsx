import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/site/policy-shell";

export const metadata: Metadata = {
  title: "Privacy · Jini",
  description: "How Jini handles your information.",
};

export default function PrivacyPage() {
  return (
    <PolicyShell eyebrow="Policy" title="Privacy">
      <p>
        Your trust matters. We collect only what we need to run live shopping
        and get your order to you.
      </p>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          What we collect
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your phone number, for sign-in and order updates</li>
          <li>Your shipping address, only to deliver your order</li>
          <li>Basic usage info, like which streams you joined</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          What we do not do
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>We do not sell your data</li>
          <li>We do not share your number publicly</li>
          <li>We never display your phone in chat</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">Payments</h2>
        <p>
          Payments are processed securely by our payment partner. Jini does not
          store your card or UPI credentials.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">Questions</h2>
        <p>
          WhatsApp Manasa at{" "}
          <Link
            href="https://wa.me/919148917755"
            className="font-medium text-violet-700 hover:underline"
          >
            +91 91489 17755
          </Link>
          .
        </p>
      </section>
    </PolicyShell>
  );
}
