"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useInView,
} from "framer-motion";

const EASE = [0.32, 0.72, 0, 1] as const;
const SOFT_OUT = [0.22, 1, 0.36, 1] as const;

/** Hero = video5; marquee = 1, 2, 4. */
function demoVideoSrc(demoNumber: number) {
  return `/video-demos/video${demoNumber}.mp4`;
}

/** Hero: fade scrim only after first decoded frame; prioritise full preload. */
function VideoRevealHero({ delay = 0 }: { delay?: number }) {
  const src = demoVideoSrc(5);
  const [frameReady, setFrameReady] = useState(false);

  return (
    <motion.div
      className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 2.1, delay, ease: SOFT_OUT }}
    >
      <video
        className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out motion-reduce:transition-none ${frameReady ? "opacity-100" : "opacity-0"}`}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setFrameReady(true)}
        onCanPlay={() => setFrameReady(true)}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 z-[1] bg-black"
        initial={{ opacity: 1 }}
        animate={{ opacity: frameReady ? 0 : 1 }}
        transition={{
          duration: 2.35,
          delay: frameReady ? delay + 0.15 : 0,
          ease: [0.33, 1, 0.68, 1],
        }}
      />
    </motion.div>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
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
  );
}

/** Idle captions for marquee clips (videos 1, 2, 4 — hidden on hover/focus). */
function marqueeCaptionCopy(demoNumber: number): string {
  switch (demoNumber) {
    case 1:
      return "Naina showcases Jhumkas";
    case 2:
      return "Chat asks about the green top";
    case 4:
      return "Sellers say hi to the stream";
    default:
      return "";
  }
}

/** Marquee: load source only once near viewport to avoid six heavy MP4s at once. */
function MarqueeVideoCard({
  demoNumber,
  loadImmediately,
}: {
  demoNumber: number;
  /** Static reduced-motion layout: only three tiles — load all at once. */
  loadImmediately?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeInView = useInView(wrapRef, {
    once: true,
    amount: 0.06,
    margin: "160px",
  });

  const shouldLoad = !!loadImmediately || activeInView;

  const src = demoVideoSrc(demoNumber);
  const caption = marqueeCaptionCopy(demoNumber);

  useEffect(() => {
    if (!shouldLoad || !videoRef.current) return;
    const el = videoRef.current;
    void el.play().catch(() => {});
  }, [shouldLoad, src]);

  return (
    <div
      ref={wrapRef}
      className="jini-marquee-card group relative aspect-video w-[min(260px,85vw)] shrink-0 touch-manipulation overflow-hidden rounded-2xl bg-black ring-1 ring-white/[0.08] outline-none transition-[box-shadow] duration-[650ms] ease-[cubic-bezier(0.33,1,0.68,1)] focus-visible:ring-2 focus-visible:ring-violet-400 group-hover:z-[2] group-hover:shadow-2xl group-hover:shadow-black/55 group-focus-within:z-[2] group-focus-within:shadow-2xl group-focus-within:shadow-black/55 group-active:z-[2] group-active:shadow-2xl group-active:shadow-black/55 sm:w-[300px]"
      tabIndex={0}
      aria-label={caption || `Demo clip ${demoNumber}`}
    >
      <video
        ref={videoRef}
        className="jini-marquee-video h-full w-full object-cover brightness-[0.78] saturate-[0.62] contrast-[1.03] transition-all duration-[650ms] ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-[1.075] group-hover:brightness-100 group-hover:saturate-100 group-hover:contrast-100 group-focus-within:scale-[1.075] group-focus-within:brightness-100 group-focus-within:saturate-100 group-focus-within:contrast-100 group-active:scale-[1.075] group-active:brightness-100 group-active:saturate-100 group-active:contrast-100"
        src={shouldLoad ? src : undefined}
        autoPlay={shouldLoad}
        muted
        loop
        playsInline
        preload={shouldLoad ? "auto" : "none"}
        aria-hidden
      />
      <div className="jini-marquee-veil pointer-events-none absolute inset-0 z-[1] bg-black/52 opacity-100 transition-opacity duration-[650ms] ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:opacity-0 group-focus-within:opacity-0 group-active:opacity-0" />
      {caption ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/90 via-black/45 to-transparent px-3 pb-3 pt-10 opacity-100 transition-opacity duration-[650ms] ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:opacity-0 group-focus-within:opacity-0 group-active:opacity-0 sm:px-3.5 sm:pb-3.5">
          <p className="text-left text-[13px] font-semibold leading-snug tracking-tight text-white sm:text-sm">
            {caption}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function BlackVideoSection() {
  const prefersReducedMotion = useReducedMotion();
  const strip = [1, 2, 4] as const;

  return (
    <section className="bg-zinc-950 pb-16 pt-8 sm:pb-24 sm:pt-10">
      {/* Header */}
      <div className="mx-auto max-w-4xl pb-2 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pb-3 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <motion.p
          className="text-left text-2xl font-semibold leading-snug tracking-[-1.2px] text-zinc-100 sm:text-3xl sm:leading-[1.35] md:text-4xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.08, ease: SOFT_OUT }}
        >
          India&rsquo;s live shopping marketplace
        </motion.p>
        <motion.div
          className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.55, delay: 0.22, ease: SOFT_OUT }}
        >
          <p className="text-left text-[15px] leading-snug text-zinc-400 sm:text-base">
            First stream goes live on May 26th.
          </p>
          <Link
            href="/contact"
            className="inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/30 ring-1 ring-white/30 transition-colors duration-300 hover:bg-violet-500 hover:ring-white/45 active:scale-[0.98]"
          >
            Waitlist
            <ArrowIcon className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </div>

      {/* Hero */}
      <div className="mx-auto mt-10 max-w-4xl pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:mt-12 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <VideoRevealHero delay={0.12} />
      </div>

      {/* Marquee or static row */}
      <div className="relative mt-14 overflow-hidden border-t border-white/10 pt-10 sm:mt-16 sm:pt-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 2.4, ease: SOFT_OUT }}
        >
          {prefersReducedMotion ? (
            <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
              {strip.map((n) => (
                <MarqueeVideoCard key={n} demoNumber={n} loadImmediately />
              ))}
            </div>
          ) : (
            <div className="jini-homenew-marquee-track pl-[max(1rem,env(safe-area-inset-left))] sm:pl-[max(2rem,env(safe-area-inset-left))]">
              {[...strip, ...strip].map((n, i) => (
                <MarqueeVideoCard key={`${n}-${i}`} demoNumber={n} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 2400);
    const t3 = setTimeout(() => setPhase(3), 3100);
    const done = setTimeout(onComplete, 5400);
    return () => [t1, t2, t3, done].forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f7f2ea] px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0px,env(safe-area-inset-top))] pb-[max(0px,env(safe-area-inset-bottom))]">
      <AnimatePresence mode="wait">
        {phase === 1 && (
          <motion.h1
            key="a"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="px-6 text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl"
          >
            Shop from Sarojini Online
          </motion.h1>
        )}
        {phase === 3 && (
          <motion.h1
            key="b"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="px-6 text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl"
          >
            For the first time in 75 years.
          </motion.h1>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Stream link + Join only — Waitlist is beside the headline in the dark hero band */
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

function EndHero() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-10 py-20 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))]">
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

export default function HomePage() {
  const [introComplete, setIntroComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (introComplete) {
      const t = setTimeout(() => setShowContent(true), 80);
      return () => clearTimeout(t);
    }
  }, [introComplete]);

  return (
    <div className="overflow-x-hidden">
      <AnimatePresence>
        {!introComplete && (
          <motion.div
            key="intro"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <IntroSequence onComplete={() => setIntroComplete(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      <section className="flex min-h-[100dvh] flex-col justify-center">
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <EndHero />
          </motion.div>
        )}
      </section>

      {showContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="h-px w-full bg-zinc-200" aria-hidden />
          <BlackVideoSection />
        </motion.div>
      )}
    </div>
  );
}
