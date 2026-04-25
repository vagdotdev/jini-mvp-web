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
        Your trust is everything to us. We collect only what we genuinely need
        to make Jini work — and nothing more.
      </p>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          What we collect
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your phone number, to sign you in and send order updates</li>
          <li>Your shipping address, only to deliver your order</li>
          <li>Basic usage info, like which streams you joined</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          What we will never do
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sell your data — ever</li>
          <li>Show your phone number publicly or in chat</li>
          <li>Share your information with anyone outside of delivering your order</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">Payments</h2>
        <p>
          Payments go through our payment partner securely. Jini never sees or
          stores your card or UPI details.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">Questions</h2>
        <p>
          If anything here feels unclear or you want to know more, just message
          Manasa at{" "}
          <Link
            href="https://wa.me/919148917755"
            className="font-medium text-violet-700 hover:underline"
          >
            +91 91489 17755
          </Link>
          . We are happy to talk through it.
        </p>
      </section>
    </PolicyShell>
  );
}
