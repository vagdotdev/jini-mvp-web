"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = ["/admin", "/dev", "/host", "/companion", "/stream"];

export function SiteHeader() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 sm:px-8">
      <Link
        href="/"
        className="text-sm font-semibold tracking-tight text-zinc-900"
      >
        Jini
      </Link>
      <nav className="flex items-center gap-4 text-xs font-medium text-zinc-500 sm:gap-6 sm:text-sm">
        <Link href="/refund" className="hover:text-zinc-900">
          Refund
        </Link>
        <Link href="/shipping" className="hover:text-zinc-900">
          Shipping
        </Link>
        <Link href="/contact" className="hover:text-zinc-900">
          Contact
        </Link>
      </nav>
    </header>
  );
}
