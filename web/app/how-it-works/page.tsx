import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/site/policy-shell";

export const metadata: Metadata = {
  title: "How It Works · Jini",
};

export default function HowItWorksPage() {
  return (
    <PolicyShell eyebrow="Welcome" title="How It Works">
      <p>
        Jini brings you live shopping from Sarojini Market. Watch the stream,
        buy what you love, get it delivered.
      </p>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Get your stream link
        </h2>
        <p>
          You'll receive a unique link via WhatsApp when a session is
          scheduled. That's your ticket to join.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Sign in and save your details
        </h2>
        <p>
          First time? Sign in with Google and save your shipping address. Takes
          60 seconds. Your wallet balance will be pre-loaded and ready.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Watch the live stream
        </h2>
        <p>
          Our host is live from the market, showing items in real time. Chat
          with other shoppers and see products as they're discovered.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Buy what you love
        </h2>
        <p>
          Tap "Buy now" to reserve an item. You have 2 minutes to confirm.
          First to buy wins — items are one-of-a-kind and sell fast.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Payment from your wallet
        </h2>
        <p>
          Your purchase is paid instantly from your pre-loaded Jini wallet. No
          fumbling with UPI during the stream. Check "My Bags" to see your
          orders.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          We pack and ship to you
        </h2>
        <p>
          After the stream ends, we pack your items and ship them to your saved
          address. Delivery in 4–7 working days.
        </p>
      </div>

      <p>
        Questions? WhatsApp Manasa at{" "}
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
