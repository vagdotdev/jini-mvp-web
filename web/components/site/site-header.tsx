"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HeaderAuthActions } from "@/components/site/header-auth";
import { WAITLIST_FORM_URL } from "@/lib/waitlist";

const HIDDEN_PREFIXES = ["/admin", "/dev", "/host", "/companion", "/stream"];

export function SiteHeader() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const darkHome =
    pathname === "/" || pathname === "/homenew";

  return (
    <header
      className={
        darkHome
          ? "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-white/[0.06] bg-zinc-950 px-[max(1rem,env(safe-area-inset-left))] py-3.5 pr-[max(1rem,env(safe-area-inset-right))] sm:flex-nowrap sm:gap-4 sm:px-8 sm:py-4"
          : "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-[max(1rem,env(safe-area-inset-left))] py-4 pr-[max(1rem,env(safe-area-inset-right))] sm:flex-nowrap sm:gap-4 sm:px-8"
      }
    >
      <Link
        href="/"
        className={
          darkHome
            ? "min-h-10 touch-manipulation text-lg font-bold tracking-tight text-zinc-50 sm:min-h-0 sm:text-xl"
            : "min-h-10 touch-manipulation text-lg font-bold tracking-tight text-zinc-900 sm:min-h-0 sm:text-xl"
        }
      >
        Jini
      </Link>
      <div className="flex max-w-full flex-wrap items-center justify-end gap-x-3 gap-y-2 sm:gap-x-5">
        <nav
          className={
            darkHome
              ? "flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-xs font-medium text-zinc-400 sm:gap-x-6 sm:gap-y-0 sm:text-sm"
              : "flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-xs font-medium text-zinc-500 sm:gap-x-6 sm:gap-y-0 sm:text-sm"
          }
        >
          <Link
            href="/how-it-works"
            className={
              darkHome
                ? "touch-manipulation py-1 text-zinc-400 transition-colors hover:text-zinc-50 active:text-white"
                : "touch-manipulation py-1 hover:text-zinc-900 active:text-zinc-900"
            }
          >
            How It Works
          </Link>
          <Link
            href="/refund"
            className={
              darkHome
                ? "touch-manipulation py-1 text-zinc-400 transition-colors hover:text-zinc-50 active:text-white"
                : "touch-manipulation py-1 hover:text-zinc-900 active:text-zinc-900"
            }
          >
            Refund
          </Link>
          <Link
            href="/shipping"
            className={
              darkHome
                ? "touch-manipulation py-1 text-zinc-400 transition-colors hover:text-zinc-50 active:text-white"
                : "touch-manipulation py-1 hover:text-zinc-900 active:text-zinc-900"
            }
          >
            Shipping
          </Link>
          <Link
            href="/contact"
            className={
              darkHome
                ? "touch-manipulation py-1 text-zinc-400 transition-colors hover:text-zinc-50 active:text-white"
                : "touch-manipulation py-1 hover:text-zinc-900 active:text-zinc-900"
            }
          >
            Contact
          </Link>
        </nav>
        <a
          href={WAITLIST_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join the waitlist — opens Google Form in a new tab"
          className={
            darkHome
              ? "inline-flex min-h-10 shrink-0 touch-manipulation items-center justify-center rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-black/25 ring-1 ring-white/20 transition-[background-color,box-shadow,transform] hover:bg-violet-500 hover:ring-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/95 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] sm:min-h-0 sm:px-5 sm:py-2.5 sm:text-sm"
              : "inline-flex min-h-10 shrink-0 touch-manipulation items-center justify-center rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-900/20 ring-1 ring-violet-500/30 transition-[background-color,box-shadow,transform] hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] sm:min-h-0 sm:px-5 sm:py-2.5 sm:text-sm"
          }
        >
          Waitlist
        </a>
        <HeaderAuthActions dark={darkHome} />
      </div>
    </header>
  );
}
