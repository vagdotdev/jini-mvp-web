"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HeaderAuthActions } from "@/components/site/header-auth";

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
        <HeaderAuthActions dark={darkHome} />
      </div>
    </header>
  );
}
