"use client";

import { useState } from "react";

function JoinForm() {
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
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 sm:max-w-sm"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={handleJoin}
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-violet-700 active:bg-violet-800"
          >
            Join
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-zinc-800 active:bg-zinc-950"
          >
            Waitlist
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/** Legacy landing (pre–May 2026 home). Primary home is `/`. */
export default function LegacyHomePage() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-10 px-6 py-20">
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
      <JoinForm />
    </div>
  );
}
