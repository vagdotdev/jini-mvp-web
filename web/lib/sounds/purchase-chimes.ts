"use client";

let audioCtx: AudioContext | null = null;
let hostPurchaseAudioEl: HTMLAudioElement | null = null;
const HOST_PURCHASE_SOUND_SRC = "/payment%20done.mp3.mpeg";

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

export async function primePurchaseAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state !== "running") {
    try {
      await ctx.resume();
    } catch {
      // Ignore autoplay failures; cues can retry on next gesture.
    }
  }
}

function beep(
  ctx: AudioContext,
  {
    frequency,
    startAt,
    durationSec,
    volume,
    type = "sine",
  }: {
    frequency: number;
    startAt: number;
    durationSec: number;
    volume: number;
    type?: OscillatorType;
  },
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + durationSec + 0.01);
}

export function playHostPurchaseChime() {
  if (typeof window === "undefined") return;
  if (!hostPurchaseAudioEl) {
    hostPurchaseAudioEl = new Audio(HOST_PURCHASE_SOUND_SRC);
    hostPurchaseAudioEl.preload = "auto";
  }
  hostPurchaseAudioEl.currentTime = 0;
  void hostPurchaseAudioEl.play().catch(() => undefined);
}

export function playViewerPurchaseChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  void primePurchaseAudio();
  const t = ctx.currentTime + 0.01;
  beep(ctx, {
    frequency: 660,
    startAt: t,
    durationSec: 0.1,
    volume: 0.03,
    type: "sine",
  });
}
