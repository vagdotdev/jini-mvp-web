"use client";

/**
 * Archived snapshot: standalone cream/light “Sarojini market…” hero + Join form.
 *
 * This was previously composed at the bottom of `/` behind a `bg-zinc-200` divider
 * after the dark video band. Current production home is unified `bg-zinc-950`; this file
 * is kept so we can resurrect or riff on that layout without git archaeology.
 */

import { useState } from "react";

/** Light-only duplicate of the home Join field (pairs with archived layout). */
function JoinFormLight() {
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleJoin() {
    setError(null);
    const trimmed = link.trim();
    if (!trimmed) {
      setError("Please paste a stream link first.");
      return;
    }
    const withScheme =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    let parsed: URL;
    try {
      parsed = new URL(withScheme);
    } catch {
      setError("That doesn't look like a valid link.");
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setError("Only http and https links are allowed.");
      return;
    }
    window.location.assign(parsed.href);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          placeholder="Paste your stream link here"
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 sm:max-w-sm sm:text-sm"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={handleJoin}
          className="inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-violet-700 active:bg-violet-800"
        >
          Join
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export type CreamHomeSectionProps = {
  /** Add vertical padding/spacing tweaks when embedding in a wrapper. */
  className?: string;
};

/** Cream background + serif stack headline + strapline + Join. Not wired into `/`. */
export function CreamHomeSection({ className }: CreamHomeSectionProps) {
  return (
    <section
      aria-label="Archived cream home messaging"
      className={[
        "bg-[#f7f2ea] text-zinc-900",
        "min-h-0 py-16 sm:py-20",
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-10 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))]">
        <div>
          <p className="text-sm font-semibold tracking-wide text-violet-600">
            Jini Live
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Sarojini market, to your home.
          </h1>
        </div>
        <div className="max-w-xl text-lg leading-relaxed text-zinc-600">
          <p>Jini - a new wave of shopping in India.</p>
        </div>
        <JoinFormLight />
      </div>
    </section>
  );
}
