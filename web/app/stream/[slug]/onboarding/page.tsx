import Link from "next/link";
import { StreamOnboardingPanel } from "@/components/auth/stream-onboarding-panel";

type PageProps = { params: Promise<{ slug: string }> };

export default async function StreamOnboardingPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="min-h-full bg-zinc-50 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-lg flex-col gap-8 py-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
            Jini · Your details
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Log in &amp; save your delivery address
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            We ask once so checkout stays fast when a one-of-one piece drops on
            stream. Use Google, or &ldquo;Skip Google&rdquo; for local testing.
          </p>
        </div>
        <StreamOnboardingPanel slug={slug} />
        <Link
          href={`/stream/${slug}/welcome`}
          className="text-center text-sm font-medium text-violet-700 hover:underline"
        >
          ← Back to welcome
        </Link>
      </div>
    </div>
  );
}
