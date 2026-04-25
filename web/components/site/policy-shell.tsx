import Link from "next/link";
import { ReactNode } from "react";

type PolicyShellProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function PolicyShell({ eyebrow, title, children }: PolicyShellProps) {
  return (
    <article className="mx-auto flex min-h-full max-w-2xl flex-col gap-8 px-6 py-12 sm:py-16">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          {title}
        </h1>
      </header>
      <div className="flex flex-col gap-6 text-[15px] leading-relaxed text-zinc-700">
        {children}
      </div>
      <footer className="mt-2 flex items-center justify-between border-t border-zinc-200 pt-4 text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-900">
          ← Back to Jini
        </Link>
        <Link href="/privacy" className="hover:text-zinc-900">
          Privacy
        </Link>
      </footer>
    </article>
  );
}
