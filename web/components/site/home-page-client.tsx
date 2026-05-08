"use client";

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import Link from "next/link";

import { WAITLIST_FORM_URL } from "@/lib/waitlist";
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

/** Soft radial backdrop behind the flagship clip. */
function HeroVideoGlow() {
  return (
    <div
      className="pointer-events-none absolute -inset-6 z-0 blur-3xl sm:-inset-10"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_30%,rgba(139,92,246,0.22),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,rgba(244,114,182,0.12),transparent_55%)]" />
    </div>
  );
}

/** Hero: fade scrim only after first decoded frame; prioritise full preload. */
function VideoRevealHero({
  delay = 0,
  reduceMotion,
}: {
  delay?: number;
  reduceMotion: boolean;
}) {
  const src = demoVideoSrc(5);
  const [frameReady, setFrameReady] = useState(false);

  const enterDur = reduceMotion ? 0.42 : 2.1;
  const enterY = reduceMotion ? 0 : 28;

  return (
    <div className="relative">
      <HeroVideoGlow />
      <motion.div
        className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-[0_28px_80px_-28px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.14]"
        role="figure"
        aria-label="Featured live shopping clip on Jini."
        initial={{ opacity: 0, y: enterY }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: enterDur, delay, ease: SOFT_OUT }}
      >
        <video
          className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out motion-reduce:transition-none ${frameReady ? "opacity-100" : "opacity-0"}`}
          src={src}
          poster="/video-demos/hero-poster.svg"
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
            duration: reduceMotion ? 0.45 : 2.35,
            delay: frameReady ? delay + 0.15 : 0,
            ease: [0.33, 1, 0.68, 1],
          }}
        />
      </motion.div>
    </div>
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

const linkUnderlineOnDark =
  "rounded-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/90 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

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
      className="jini-marquee-card group relative aspect-video w-[min(260px,85vw)] shrink-0 touch-manipulation overflow-hidden rounded-2xl bg-black ring-1 ring-white/[0.06] outline-none transition-[box-shadow] duration-[650ms] ease-[cubic-bezier(0.33,1,0.68,1)] focus-visible:ring-2 focus-visible:ring-violet-400/90 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 group-hover:z-[2] group-hover:shadow-xl group-hover:shadow-black/50 group-focus-within:z-[2] group-focus-within:shadow-xl group-focus-within:shadow-black/50 group-active:z-[2] group-active:shadow-xl group-active:shadow-black/50 sm:w-[300px]"
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

/** Measured translation = one segment width + track gap → seamless infinite loop */
function InfiniteDemoMarquee({
  strip,
}: {
  strip: readonly number[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const segRef = useRef<HTMLDivElement>(null);
  const [shiftPx, setShiftPx] = useState<number | null>(null);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const seg = segRef.current;
    if (!track || !seg) return;
    const g = parseFloat(getComputedStyle(track).gap || "16");
    const gap = Number.isFinite(g) ? g : 16;
    const w = seg.getBoundingClientRect().width + gap;
    if (w > 0 && Number.isFinite(w)) setShiftPx(w);
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    if (segRef.current) ro.observe(segRef.current);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("orientationchange", measure);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <div
      className="relative w-full overflow-x-hidden overflow-y-visible pl-[max(1rem,env(safe-area-inset-left))] sm:pl-[max(2rem,env(safe-area-inset-left))]"
      aria-label="Scrolling clips"
    >
      <div
        ref={trackRef}
        className={`jini-homenew-marquee-track${shiftPx != null ? " jini-homenew-marquee-track--active" : ""}`}
        style={
          shiftPx != null
            ? { ["--marquee-shift" as string]: `${shiftPx}px` }
            : undefined
        }
      >
        <div ref={segRef} className="flex shrink-0 gap-4 sm:gap-5">
          {strip.map((n) => (
            <MarqueeVideoCard key={`seg1-${n}`} demoNumber={n} />
          ))}
        </div>
        <div className="flex shrink-0 gap-4 sm:gap-5" aria-hidden>
          {strip.map((n) => (
            <MarqueeVideoCard key={`seg2-${n}`} demoNumber={n} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Paste stream link → open stream. `dark` matches the zinc-950 footer band. */
function JoinForm({ variant = "light" }: { variant?: "light" | "dark" }) {
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

  const inputClass =
    variant === "dark"
      ? "w-full rounded-xl border border-zinc-600 bg-zinc-900/85 px-4 py-3 text-base text-zinc-50 shadow-inner shadow-black/30 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-400/95 focus:ring-offset-2 focus:ring-offset-zinc-950 sm:max-w-sm sm:text-sm"
      : "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-white sm:max-w-sm sm:text-sm";

  const btnClass =
    variant === "dark"
      ? "inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center rounded-xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/40 ring-1 ring-white/15 transition-transform duration-200 hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] active:bg-violet-600"
      : "inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow transition-transform duration-200 hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] active:bg-violet-800";

  const inner = (
    <div className="flex flex-col gap-3">
      {variant === "dark" ? (
        <p className="text-sm leading-relaxed text-zinc-500">
          Have a seller or host link? Paste it to open that stream. New here?{" "}
          <a
            href={WAITLIST_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join the waitlist — opens Google Form in a new tab"
            className="font-medium text-violet-400 underline decoration-violet-400/50 underline-offset-2 transition-colors hover:text-violet-300 hover:decoration-violet-300"
          >
            Join the waitlist
          </a>
          .
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          placeholder="Paste stream link"
          className={inputClass}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="button" onClick={handleJoin} className={btnClass}>
          Join
        </button>
      </div>
      {error && (
        <p
          className={
            variant === "dark" ? "text-sm text-red-400" : "text-sm text-red-600"
          }
        >
          {error}
        </p>
      )}
    </div>
  );

  if (variant === "dark") {
    return (
      <div className="-m-px rounded-[1.125rem] p-px transition-shadow duration-300 ease-out focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.22)]">
        {inner}
      </div>
    );
  }

  return inner;
}

function BlackVideoSection() {
  const prefersReducedMotion = useReducedMotion();
  const strip = [1, 2, 4] as const;
  const reduce = prefersReducedMotion ?? false;

  const headDur = reduce ? 0.32 : 1.05;
  const headY = reduce ? 0 : 14;
  const marqueeDur = reduce ? 0.25 : 1.95;
  const marqueeY = reduce ? 0 : 10;

  const footParent = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduce ? 0 : 0.12,
        delayChildren: reduce ? 0 : 0.05,
      },
    },
  };
  const footItem = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.22 : 0.72, ease: SOFT_OUT },
    },
  };

  return (
    <section
      className="flex min-h-[100dvh] flex-col bg-zinc-950 pt-4 pb-[max(3rem,env(safe-area-inset-bottom))] sm:pt-5"
      aria-label="Jini Live home"
    >
      {/* Header */}
      <div className="mx-auto w-full max-w-4xl shrink-0 pb-2 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pb-4 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <motion.p
          className="text-left text-2xl font-semibold leading-snug tracking-[-1.2px] text-zinc-100 sm:text-3xl sm:leading-[1.35] md:text-4xl"
          initial={{ opacity: 0, y: headY }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: headDur,
            delay: reduce ? 0 : 0.06,
            ease: SOFT_OUT,
          }}
        >
          India&rsquo;s live shopping marketplace
        </motion.p>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mt-6 sm:gap-x-4">
          <motion.p
            className="max-w-md text-left text-[15px] leading-relaxed text-zinc-400 sm:text-base"
            initial={{ opacity: 0, y: headY }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: headDur,
              delay: reduce ? 0 : 0.16,
              ease: SOFT_OUT,
            }}
          >
            First stream goes live on May 26th.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: headY }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: headDur,
              delay: reduce ? 0 : 0.26,
              ease: SOFT_OUT,
            }}
          >
            <a
              href={WAITLIST_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join the waitlist — opens Google Form in a new tab"
              className="relative z-10 inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/30 ring-1 ring-white/30 transition-[background-color,box-shadow,transform] duration-200 hover:bg-violet-500 hover:ring-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/95 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98]"
            >
              Waitlist
              <ArrowIcon className="h-3.5 w-3.5" />
            </a>
          </motion.div>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-auto mt-12 w-full max-w-4xl shrink-0 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:mt-14 md:mt-16 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <VideoRevealHero delay={0.12} reduceMotion={reduce} />
      </div>

      {/* Marquee or static row */}
      <div className="relative mt-20 shrink-0 overflow-hidden border-t border-white/[0.07] pt-14 sm:mt-24 sm:pt-[4.25rem]">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: marqueeY }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-72px" }}
          transition={{ duration: marqueeDur, ease: SOFT_OUT }}
        >
          {prefersReducedMotion ? (
            <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
              {strip.map((n) => (
                <MarqueeVideoCard key={n} demoNumber={n} loadImmediately />
              ))}
            </div>
          ) : (
            <InfiniteDemoMarquee strip={strip} />
          )}
          {!prefersReducedMotion ? (
            <>
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-12 bg-gradient-to-r from-zinc-950 to-transparent sm:w-20"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-12 bg-gradient-to-l from-zinc-950 to-transparent sm:w-20"
                aria-hidden
              />
            </>
          ) : null}
        </motion.div>
        <motion.p
          className="mx-auto mt-8 max-w-md px-[max(1rem,env(safe-area-inset-left))] text-center text-[13px] font-medium leading-relaxed tracking-wide text-zinc-500 sm:mt-10 sm:max-w-lg sm:px-8 sm:text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-24px" }}
          transition={{
            duration: reduce ? 0.2 : 0.85,
            delay: reduce ? 0 : 0.12,
            ease: SOFT_OUT,
          }}
        >
          Clips that show what a live run feels like — tap or hover for a closer
          look.
        </motion.p>
      </div>

      <div className="flex flex-1 flex-col justify-center border-t border-white/[0.07] py-16 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:py-24 md:py-28 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <motion.div
          className="mx-auto w-full max-w-3xl"
          variants={footParent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-64px" }}
        >
          <motion.p
            className="text-sm font-semibold tracking-wide text-violet-400"
            variants={footItem}
          >
            Jini Live
          </motion.p>
          <motion.h2
            className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl sm:mt-4"
            variants={footItem}
          >
            Sarojini market, to your home.
          </motion.h2>
          <motion.p
            className="mt-5 max-w-[28rem] text-lg leading-[1.68] text-zinc-400/95 sm:mt-6"
            variants={footItem}
          >
            Jini - a new wave of shopping in India.
          </motion.p>
          <motion.div className="mt-10 sm:mt-12" variants={footItem}>
            <JoinForm variant="dark" />
          </motion.div>
          <motion.nav
            className="mt-12 flex flex-wrap gap-x-7 gap-y-2 border-t border-white/[0.06] pt-8 sm:mt-14 sm:gap-x-8"
            variants={footItem}
            aria-label="Site links"
          >
            <Link href="/privacy" className={linkUnderlineOnDark}>
              Privacy
            </Link>
            <Link href="/contact" className={linkUnderlineOnDark}>
              Contact
            </Link>
            <Link href="/how-it-works" className={linkUnderlineOnDark}>
              How it works
            </Link>
          </motion.nav>
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
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#f7f2ea] px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0px,env(safe-area-inset-top))] pb-[max(0px,env(safe-area-inset-bottom))]">
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
            for the first time ever.
          </motion.h1>
        )}
      </AnimatePresence>
    </div>
  );
}

const INTRO_SEEN_SESSION_KEY = "jini-home-intro-seen";

export function HomePageClient() {
  const [introComplete, setIntroComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem(INTRO_SEEN_SESSION_KEY) === "1") {
        setIntroComplete(true);
        setShowContent(true);
      }
    } catch {
      // private mode / disabled storage
    }
  }, []);

  const handleIntroComplete = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SEEN_SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setIntroComplete(true);
  }, []);

  useEffect(() => {
    if (introComplete) {
      const t = setTimeout(() => setShowContent(true), 80);
      return () => clearTimeout(t);
    }
  }, [introComplete]);

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-zinc-950">
      <AnimatePresence>
        {!introComplete && (
          <motion.div
            key="intro"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <IntroSequence onComplete={handleIntroComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {showContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.72, ease: EASE }}
        >
          <BlackVideoSection />
        </motion.div>
      )}
    </div>
  );
}
