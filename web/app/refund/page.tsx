import type { Metadata } from "next";
import Link from "next/link";
import { PolicyShell } from "@/components/site/policy-shell";

export const metadata: Metadata = {
  title: "Refund policy · Jini",
};

export default function RefundPage() {
  return (
    <PolicyShell eyebrow="Policy" title="Refunds">
      <p>
        All sales are final. We are a small team and do not offer refunds at
        this stage.
      </p>
      <p>
        Every item is shown live, held up, turned around, and described as-is,
        so you know exactly what you are buying before you pay.
      </p>
      <p>
        If we made a mistake on our end, reach Manasa on WhatsApp at{" "}
        <Link
          href="https://wa.me/919148917755"
          className="font-medium text-violet-700 hover:underline"
        >
          +91 91489 17755
        </Link>
        . We will always be reasonable.
      </p>
      <p className="text-zinc-500">
        Refunds are on the roadmap as we grow.
      </p>
    </PolicyShell>
  );
}
