import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/site/policy-shell";

export const metadata: Metadata = {
  title: "Refund policy · Jini",
  description: "Jini's refund policy — honest and straightforward.",
};

export default function RefundPage() {
  return (
    <PolicyShell eyebrow="Policy" title="Refunds">
      <p>
        We want to be completely honest with you here. Right now, as a small
        team just getting started, we do not offer refunds. Every item is sold
        as-is, live on stream, exactly as you see it — and that is kind of the
        whole magic of it.
      </p>

      <p>
        We know that is a big ask of your trust, and we genuinely do not take
        that lightly. We make sure what you see is what you get. Our host holds
        it up, shows every angle, answers your questions live — so you can feel
        confident before you buy.
      </p>

      <p>
        That said — if something goes seriously wrong on our end (wrong item
        shipped, arrived damaged), please reach out. We are humans, we make
        mistakes, and we will always try to do right by you.
      </p>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          Coming soon
        </h2>
        <p>
          A full returns and refund policy is something we are actively working
          towards as we grow. We want Jini to feel as safe as any great shopping
          experience — and we will get there.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">
          Talk to us
        </h2>
        <p>
          For any concerns, please reach Manasa on WhatsApp at{" "}
          <Link
            href="https://wa.me/919148917755"
            className="font-medium text-violet-700 hover:underline"
          >
            +91 91489 17755
          </Link>
          . We will always listen.
        </p>
      </section>
    </PolicyShell>
  );
}
