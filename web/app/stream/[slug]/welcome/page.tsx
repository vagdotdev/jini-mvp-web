import Link from "next/link";
import { headers } from "next/headers";

type PageProps = { params: Promise<{ slug: string }> };

async function getStreamTitle(slug: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;
  try {
    const res = await fetch(`${base}/api/streams/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return "Live shopping";
    const data = (await res.json()) as { title?: string };
    return data.title?.trim() || "Live shopping";
  } catch {
    return "Live shopping";
  }
}

export default async function StreamWelcomePage({ params }: PageProps) {
  const { slug } = await params;
  const title = await getStreamTitle(slug);

  return (
    <div className="min-h-full bg-[radial-gradient(120%_80%_at_50%_-10%,#ede9fe_0,#faf5ff_35%,#fafaf9_70%)] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white/90 p-8 shadow-xl shadow-violet-200/40 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
            Jini · Sarojini drop
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Welcome to the Jini shop
          </h1>
          <p className="mt-2 text-lg font-medium text-violet-900/90">{title}</p>
          <p className="mt-5 text-base leading-relaxed text-zinc-600">
            You are about to join a live sale sourced like a Sarojini run — one
            stream, real pieces, first to lock gets first dibs at checkout.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600">
            First, log in and add your phone and shipping address once. After
            that, you can chat, watch, and grab pieces as the host shows them.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/stream/${slug}/onboarding`}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-md shadow-violet-600/25 hover:bg-violet-700"
            >
              Continue — log in and address
            </Link>
            <Link
              href="/dev"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Back to home
            </Link>
          </div>
        </div>
        <p className="px-1 text-center text-xs text-zinc-500">
          Stream code{" "}
          <code className="rounded-md bg-white/80 px-2 py-0.5 text-zinc-700 shadow-sm">
            {slug}
          </code>
        </p>
      </div>
    </div>
  );
}
