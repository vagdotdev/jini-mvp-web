"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type PageRevealProps = {
  children: ReactNode;
};

const EXCLUDED_PREFIXES = ["/admin", "/dev", "/host"] as const;

function shouldSkipAscend(pathname: string) {
  if (pathname === "/") return true;
  return EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
}

export function PageReveal({ children }: PageRevealProps) {
  const pathname = usePathname();
  const shouldAnimate = !shouldSkipAscend(pathname);

  if (!shouldAnimate) {
    return <>{children}</>;
  }

  return (
    <div key={pathname} className="jini-ascend">
      {children}
    </div>
  );
}
