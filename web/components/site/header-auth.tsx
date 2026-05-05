"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type HeaderAuthActionsProps = {
  /** Matches dark homepage header treatment. */
  dark: boolean;
};

export function HeaderAuthActions({ dark }: HeaderAuthActionsProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const sb = createBrowserSupabaseClient();
    if (!sb) {
      setUser(null);
      return;
    }
    void sb.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const nextParam =
    pathname && pathname !== "/login"
      ? `?next=${encodeURIComponent(pathname)}`
      : "";

  const ctaClasses = dark
    ? "inline-flex min-h-9 shrink-0 touch-manipulation items-center justify-center rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-zinc-50 shadow-sm transition-colors hover:bg-white/15 active:bg-white/20 sm:text-sm"
    : "inline-flex min-h-9 shrink-0 touch-manipulation items-center justify-center rounded-full border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 active:bg-zinc-100 sm:text-sm";

  const accountClasses = dark
    ? "inline-flex min-h-9 shrink-0 touch-manipulation items-center justify-center rounded-full px-3 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-50 sm:text-sm"
    : "inline-flex min-h-9 shrink-0 touch-manipulation items-center justify-center rounded-full px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 sm:text-sm";

  if (user === undefined) {
    return (
      <span
        className={`inline-block min-h-9 w-[8.75rem] shrink-0 rounded-full sm:w-36 ${dark ? "bg-white/[0.08]" : "bg-zinc-200/80"} animate-pulse`}
        aria-hidden
      />
    );
  }

  if (user) {
    return (
      <Link href="/account" className={accountClasses}>
        Account
      </Link>
    );
  }

  return (
    <Link href={`/login${nextParam}`} className={ctaClasses}>
      Log in&nbsp;/&nbsp;Sign up
    </Link>
  );
}
