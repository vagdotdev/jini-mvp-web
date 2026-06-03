"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StreamLiveError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[stream/live] crashed:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
        <svg
          className="h-6 w-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
          />
        </svg>
      </div>
      <h1 className="text-lg font-semibold">This live room hit a snag</h1>
      <p className="max-w-sm text-sm text-white/70">
        We couldn&apos;t load the live room just now. It&apos;s usually a flaky
        network or a stale session — try reloading. If it keeps happening, head
        back to the welcome page and rejoin.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
        >
          Reload
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/30 px-5 py-2 text-sm font-medium text-white/90"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
