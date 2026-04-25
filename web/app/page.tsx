import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-10 px-6 py-20">
      <div>
        <p className="text-sm font-semibold tracking-wide text-violet-600">
          Jini Live
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Live from the market. Buy in seconds.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-600">
          Stream once, list items from a buddy phone, lock each piece to the
          first payer, and ship from a single sales log. This site is the
          product we are building for your Sarojini pilot.
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/account"
          className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-6 py-3 text-sm font-semibold text-violet-900 hover:bg-violet-100"
        >
          My account
        </Link>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-violet-700"
        >
          Open control panel
        </Link>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Open Supabase (for setup)
        </a>
      </div>
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 text-sm text-zinc-700">
        <h2 className="font-semibold text-zinc-900">What is running today</h2>
        <ul className="mt-3 list-inside list-disc space-y-2">
          <li>
            Next.js app in the <code className="rounded bg-white px-1">web/</code>{" "}
            folder
          </li>
          <li>
            SQL migrations in{" "}
            <code className="rounded bg-white px-1">web/supabase/migrations/</code>{" "}
            — paste into Supabase SQL editor when your project exists
          </li>
          <li>
            <strong>Create stream</strong> API +{" "}
            <Link href="/admin" className="text-violet-600 hover:underline">
              /admin
            </Link>{" "}
            page (three links after you connect env vars)
          </li>
          <li>Stub routes: welcome, onboarding, live, host, companion</li>
        </ul>
      </section>
    </div>
  );
}
