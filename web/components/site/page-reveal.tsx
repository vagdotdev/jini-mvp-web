"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type PageRevealProps = {
  children: ReactNode;
};

const EXCLUDED_PREFIXES = ["/admin", "/dev", "/homenew"];

export function PageReveal({ children }: PageRevealProps) {
  const pathname = usePathname();
  const shouldAnimate = !EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!shouldAnimate) {
    return <>{children}</>;
  }

  return (
    <div key={pathname} className="jini-ascend">
      {children}
    </div>
  );
}
