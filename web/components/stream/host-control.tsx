"use client";

import "@livekit/components-styles";

import {
  ControlBar,
  isTrackReference,
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { LiveKitSetupNotice } from "@/components/stream/livekit-setup-notice";
import { HostChatTicker } from "@/components/stream/host-chat-ticker";
import {
  LIVEKIT_NOT_CONFIGURED_CODE,
  type LiveKitTokenErrorBody,
} from "@/lib/livekit/setup-messages";
import { LocalAudioTrack, Track } from "livekit-client";
import type { TrackReference } from "@livekit/components-core";
import { useCallback, useEffect, useRef, useState } from "react";

type HostControlProps = {
  token: string;
};

type LiveKitConn = {
  url: string;
  token: string;
  room: string;
  slug: string;
};

export function HostControl({ token }: HostControlProps) {
  const [conn, setConn] = useState<LiveKitConn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLiveKitSetup, setShowLiveKitSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<"music" | "chat" | null>(null);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowLiveKitSetup(false);
    try {
      const res = await fetch(
        `/api/livekit/token?role=host&token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      const json = (await res.json().catch(() => ({}))) as Partial<LiveKitConn> &
        LiveKitTokenErrorBody;
      if (!res.ok || !json.token || !json.url) {
        if (json.code === LIVEKIT_NOT_CONFIGURED_CODE) {
          setShowLiveKitSetup(true);
          setError(json.error || "LiveKit is not configured.");
        } else {
          setError(
            json.error ||
              "LiveKit not connected. Add LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET in .env.local.",
          );
        }
        return;
      }
      setConn({ url: json.url, token: json.token, room: json.room ?? "", slug: json.slug ?? "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach LiveKit token API.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!conn) return;
    document.documentElement.classList.add("host-live");
    document.body.classList.add("host-live");
    return () => {
      document.documentElement.classList.remove("host-live");
      document.body.classList.remove("host-live");
    };
  }, [conn]);

  useEffect(() => {
    if (!activePanel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePanel(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePanel]);

  if (!conn) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="aspect-video rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-800 to-violet-950 p-4 text-white">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-violet-600 px-2 py-1 text-xs font-semibold">
              HOST
            </span>
            <span className="text-xs text-white/60">camera preview</span>
          </div>
          <div className="flex h-full items-center justify-center text-center text-sm text-white/70">
            Tap the button below, accept camera + mic, and you are live.
          </div>
        </div>
        <button
          type="button"
          onClick={() => void fetchToken()}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Connecting..." : "Go live (start camera + mic)"}
        </button>
        {error ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            {error}
          </p>
        ) : null}
        {showLiveKitSetup ? <LiveKitSetupNotice variant="light" /> : null}
      </section>
    );
  }

  return (
    <div className="host-live-stage fixed inset-0 z-50 bg-black text-white">
      <LiveKitRoom
        serverUrl={conn.url}
        token={conn.token}
        connect
        video
        audio
        data-lk-theme="default"
        className="host-live-room"
        style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }}
        onDisconnected={() => setConn(null)}
        onError={(err) => setError(err.message)}
      >
        <HostStage />

        <div
          className="pointer-events-none absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur ring-1 ring-white/10"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
          Live
        </div>

        {activePanel !== "chat" ? (
          <div
            className="pointer-events-none absolute right-3 z-20 hidden flex-col sm:flex md:right-4"
            style={{
              top: "calc(env(safe-area-inset-top, 0px) + 3.5rem)",
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 8.5rem)",
              width: "min(20rem, 28vw)",
            }}
          >
            <div className="pointer-events-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] opacity-70 shadow-xl shadow-black/30 backdrop-blur-md transition-opacity duration-200 hover:opacity-100 focus-within:opacity-100">
              <HostChatTicker hostToken={token} variant="ambient" slug={conn.slug} />
            </div>
          </div>
        ) : null}

        {activePanel ? (
          <div
            className="absolute inset-0 z-30 bg-black/30"
            onClick={() => setActivePanel(null)}
          />
        ) : null}

        {activePanel === "music" ? (
          <div
            className="absolute inset-x-3 top-14 z-40 md:left-auto md:right-4 md:top-4 md:w-96"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 3.25rem)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <HostMusicControls className="w-full rounded-3xl border border-white/25 bg-gradient-to-br from-white/18 via-white/10 to-white/5 p-3.5 text-white shadow-2xl shadow-black/40 backdrop-blur-xl" />
          </div>
        ) : null}

        {activePanel === "chat" ? (
          <div
            className="absolute inset-x-3 top-14 z-40 md:left-auto md:right-4 md:w-[24rem]"
            style={{
              top: "calc(env(safe-area-inset-top, 0px) + 3.25rem)",
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/96 shadow-2xl shadow-black/50 backdrop-blur-md">
              <HostChatTicker hostToken={token} variant="panel" slug={conn.slug} />
            </div>
          </div>
        ) : null}

        <div
          className="absolute right-3 z-40 flex flex-col gap-2 md:right-4"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.25rem)" }}
        >
          <button
            type="button"
            onClick={() => setActivePanel((prev) => (prev === "music" ? null : "music"))}
            className={[
              "rounded-full px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur ring-1 transition",
              activePanel === "music"
                ? "bg-violet-500/90 text-white ring-violet-300/50"
                : "bg-black/65 text-white ring-white/20 hover:bg-black/75",
            ].join(" ")}
          >
            Music
          </button>
          <button
            type="button"
            onClick={() => setActivePanel((prev) => (prev === "chat" ? null : "chat"))}
            className={[
              "rounded-full px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur ring-1 transition",
              activePanel === "chat"
                ? "bg-sky-500/85 text-white ring-sky-300/50"
                : "bg-black/65 text-white ring-white/20 hover:bg-black/75",
            ].join(" ")}
          >
            Chat
          </button>
        </div>

        <div
          className="absolute inset-x-0 z-20 flex justify-center px-3"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <div className="rounded-2xl bg-black/60 px-3 py-1.5 backdrop-blur ring-1 ring-white/10">
            <ControlBar
              variation="minimal"
              controls={{
                microphone: true,
                camera: true,
                screenShare: false,
                leave: true,
                chat: false,
              }}
            />
          </div>
        </div>

        {error ? (
          <div className="absolute inset-x-0 top-16 z-30 mx-4 rounded-xl bg-amber-900/80 px-4 py-2 text-center text-xs text-amber-100">
            {error}
          </div>
        ) : null}

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function HostStage() {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  ).filter((track) => track.participant.isLocal);

  const track = tracks.find(
    (candidate): candidate is TrackReference => isTrackReference(candidate),
  );
  if (!track) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-sm text-white/70">
        Waiting for camera…
      </div>
    );
  }

  return (
    <div className="host-live-video-layer">
      <VideoTrack
        trackRef={track}
        className="host-live-video"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />
    </div>
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(t);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(t);
        reject(err);
      },
    );
  });
}

const MUSIC_LEVEL = 0.4;
const FADE_IN_MS = 1800;
const FADE_OUT_MS = 900;
type AudioTrack = { file: string; label: string; url: string };
const FALLBACK_TRACKS: AudioTrack[] = [
  { file: "Masakali.mp3", label: "Masakali", url: "/audio/Masakali.mp3" },
  { file: "Follow-God.mp3", label: "Follow God", url: "/audio/Follow-God.mp3" },
  { file: "Homecoming.mpeg", label: "Homecoming", url: "/audio/Homecoming.mpeg" },
];

function HostMusicControls({ className }: { className?: string }) {
  useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [tracks, setTracks] = useState<AudioTrack[]>(FALLBACK_TRACKS);
  const [trackIdx, setTrackIdx] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [busy, setBusy] = useState<null | "start" | "transition" | "stop">(null);
  const [musicError, setMusicError] = useState<string | null>(null);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const publishedTrackRef = useRef<LocalAudioTrack | null>(null);
  const mutedByMusicRef = useRef(false);
  const mountedRef = useRef(true);
  const actionSeqRef = useRef(0);
  const currentTrack = tracks[trackIdx] ?? null;

  useEffect(() => {
    if (!localParticipant) return;
    const payload = new TextEncoder().encode(
      JSON.stringify({ type: "jini-music", playing: musicPlaying }),
    );
    void localParticipant.publishData(payload, { reliable: true }).catch(() => undefined);
  }, [localParticipant, musicPlaying]);

  const beginAction = useCallback(
    (name: "start" | "transition" | "stop") => {
      actionSeqRef.current += 1;
      setBusy(name);
      setMusicError(null);
      return actionSeqRef.current;
    },
    [],
  );
  const isStaleAction = useCallback((id: number) => id !== actionSeqRef.current, []);
  const finishAction = useCallback((id: number) => {
    if (!mountedRef.current) return;
    if (id === actionSeqRef.current) setBusy(null);
  }, []);

  // Safety valve: if any async media op gets stuck unexpectedly, recover controls.
  useEffect(() => {
    if (!busy) return;
    const t = window.setTimeout(() => {
      if (!mountedRef.current) return;
      setBusy(null);
      setMusicError((prev) => prev || "Action timed out. Please tap again.");
    }, 12000);
    return () => window.clearTimeout(t);
  }, [busy]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/audio/tracks", { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as {
          tracks?: AudioTrack[];
        };
        const list = (json.tracks || []).filter((t) => t.url);
        if (!mountedRef.current) return;
        const merged = [...list];
        for (const fallback of FALLBACK_TRACKS) {
          if (!merged.some((t) => t.file.toLowerCase() === fallback.file.toLowerCase())) {
            merged.push(fallback);
          }
        }
        const masakaliIdx = merged.findIndex(
          (t) => t.file.toLowerCase() === "masakali.mp3",
        );
        setTracks(merged);
        setTrackIdx(masakaliIdx >= 0 ? masakaliIdx : 0);
      } catch {
        if (!mountedRef.current) return;
        setTracks(FALLBACK_TRACKS);
        setTrackIdx(0);
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      const audioEl = audioElRef.current;
      if (audioEl) {
        audioEl.pause();
      }
      const published = publishedTrackRef.current;
      if (published && localParticipant) {
        void localParticipant.unpublishTrack(published.mediaStreamTrack);
      }
      publishedTrackRef.current = null;
      const rawTrack = destRef.current?.stream.getAudioTracks()[0];
      rawTrack?.stop();
      ctxRef.current?.close().catch(() => undefined);
      ctxRef.current = null;
    };
  }, [localParticipant]);

  const ensurePipeline = useCallback(async (forcedTrack?: AudioTrack) => {
    const track = forcedTrack ?? currentTrack;
    if (!localParticipant) throw new Error("Host audio not ready yet.");
    if (!track) throw new Error("No songs available. Check /public/audio.");
    if (!audioElRef.current) {
      const audio = new Audio(track.url);
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audioElRef.current = audio;
    }

    const audio = audioElRef.current;
    if (!audio.src.includes(track.url)) {
      audio.pause();
      audio.src = track.url;
      audio.load();
    }
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) throw new Error("AudioContext not supported on this device.");
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      const destination = ctx.createMediaStreamDestination();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      source.connect(gain);
      gain.connect(destination);
      ctxRef.current = ctx;
      gainRef.current = gain;
      destRef.current = destination;

      const rawTrack = destination.stream.getAudioTracks()[0];
      if (!rawTrack) throw new Error("Could not create music track.");
      const localTrack = new LocalAudioTrack(rawTrack);
      await withTimeout(
        localParticipant.publishTrack(localTrack.mediaStreamTrack),
        5000,
        "Music track publish timed out. Try tapping Start again.",
      );
      publishedTrackRef.current = localTrack;
    }

    const ctx = ctxRef.current;
    if (ctx.state !== "running") {
      await ctx.resume();
    }

    if (audio.readyState < 1) {
      await withTimeout(
        new Promise<void>((resolve, reject) => {
        const onLoaded = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error(`Could not load ${track.url}`));
        };
        const cleanup = () => {
          audio.removeEventListener("loadedmetadata", onLoaded);
          audio.removeEventListener("error", onError);
        };
        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("error", onError);
        audio.load();
        }),
        5000,
        `Music file took too long to load. Check ${track.url}`,
      );
    }

    return {
      audio,
      ctx,
      gain: gainRef.current!,
    };
  }, [localParticipant, currentTrack]);

  const rampGain = useCallback((target: number, fadeMs = 320) => {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) return;
    const now = ctx.currentTime;
    const current = Math.max(gain.gain.value, 0.0001);
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(current, now);
    gain.gain.linearRampToValueAtTime(Math.max(target, 0.0001), now + fadeMs / 1000);
  }, []);

  const fadeGainTo = useCallback(
    async (target: number, fadeMs: number) => {
      rampGain(target, fadeMs);
      await wait(fadeMs + 40);
    },
    [rampGain],
  );

  const muteMicForMusic = useCallback(async () => {
    if (!localParticipant || mutedByMusicRef.current) return;
    try {
      await localParticipant.setMicrophoneEnabled(false);
      mutedByMusicRef.current = true;
    } catch {
      // Non-fatal
    }
  }, [localParticipant]);

  const restoreMicAfterMusic = useCallback(async () => {
    if (!localParticipant || !mutedByMusicRef.current) return;
    try {
      await localParticipant.setMicrophoneEnabled(true);
    } catch {
      // Non-fatal
    } finally {
      mutedByMusicRef.current = false;
    }
  }, [localParticipant]);

  const handleStart = useCallback(async () => {
    const actionId = beginAction("start");
    try {
      const { audio } = await withTimeout(
        ensurePipeline(),
        6000,
        "Music setup timed out. Try again.",
      );
      if (isStaleAction(actionId)) return;
      await muteMicForMusic();
      if (isStaleAction(actionId)) return;
      await fadeGainTo(0.0001, FADE_OUT_MS);
      if (isStaleAction(actionId)) return;
      audio.currentTime = 0;
      await withTimeout(
        audio.play(),
        4000,
        "Music could not start in time. Tap again after stream is fully live.",
      );
      if (isStaleAction(actionId)) return;
      await fadeGainTo(Math.max(MUSIC_LEVEL, 0.0001), FADE_IN_MS);
      if (!isStaleAction(actionId) && mountedRef.current) setMusicPlaying(true);
    } catch (err) {
      if (!isStaleAction(actionId) && mountedRef.current) {
        setMusicError(err instanceof Error ? err.message : "Music failed to start.");
      }
    } finally {
      finishAction(actionId);
    }
  }, [beginAction, ensurePipeline, fadeGainTo, finishAction, isStaleAction, muteMicForMusic]);

  const handleTransition = useCallback(async () => {
    const actionId = beginAction("transition");
    try {
      const { audio } = await withTimeout(
        ensurePipeline(),
        6000,
        "Music setup timed out. Try again.",
      );
      if (isStaleAction(actionId)) return;
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      if (duration <= 0) {
        throw new Error("Track duration not ready yet. Tap Transition again.");
      }
      const start = duration * 0.2;
      const end = duration * 0.8;
      const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const minJump = Math.min(12, Math.max(4, duration * 0.12));
      let randomPoint = start + Math.random() * (end - start);
      for (let i = 0; i < 6; i += 1) {
        if (Math.abs(randomPoint - current) >= minJump) break;
        randomPoint = start + Math.random() * (end - start);
      }
      await muteMicForMusic();
      if (isStaleAction(actionId)) return;
      await fadeGainTo(0.0001, FADE_OUT_MS);
      if (isStaleAction(actionId)) return;
      audio.currentTime = Math.max(0, randomPoint);
      await withTimeout(
        audio.play(),
        4000,
        "Transition could not start. Tap again.",
      );
      if (isStaleAction(actionId)) return;
      await fadeGainTo(Math.max(MUSIC_LEVEL, 0.0001), FADE_IN_MS);
      if (!isStaleAction(actionId) && mountedRef.current) setMusicPlaying(true);
    } catch (err) {
      if (!isStaleAction(actionId) && mountedRef.current) {
        setMusicError(err instanceof Error ? err.message : "Transition failed.");
      }
    } finally {
      finishAction(actionId);
    }
  }, [beginAction, ensurePipeline, fadeGainTo, finishAction, isStaleAction, muteMicForMusic]);

  const handleStop = useCallback(async () => {
    const actionId = beginAction("stop");
    try {
      const audio = audioElRef.current;
      if (audio && !audio.paused) {
        await fadeGainTo(0.0001, FADE_OUT_MS);
        if (isStaleAction(actionId)) return;
        audio.pause();
        // Keep stop deterministic so restart/transition behaves consistently.
        if (Number.isFinite(audio.currentTime)) {
          audio.currentTime = Math.max(0, audio.currentTime);
        }
      }
      await restoreMicAfterMusic();
      if (!isStaleAction(actionId) && mountedRef.current) setMusicPlaying(false);
    } catch (err) {
      if (!isStaleAction(actionId) && mountedRef.current) {
        setMusicError(err instanceof Error ? err.message : "Could not stop music.");
      }
    } finally {
      finishAction(actionId);
    }
  }, [beginAction, fadeGainTo, finishAction, isStaleAction, restoreMicAfterMusic]);

  const handleNextSong = useCallback(() => {
    if (!tracks.length || busy) return;
    const nextIdx = (trackIdx + 1) % tracks.length;
    setTrackIdx(nextIdx);
  }, [busy, trackIdx, tracks.length]);

  return (
    <div
      className={
        className ||
        "w-[min(22rem,calc(100vw-1.25rem))] rounded-3xl border border-white/25 bg-gradient-to-br from-white/18 via-white/10 to-white/5 p-3.5 text-white shadow-2xl shadow-black/40 backdrop-blur-xl"
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
        Music
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-xs font-semibold text-white/95">
          {currentTrack?.label || "No song"}
        </p>
        <button
          type="button"
          disabled={busy !== null || tracks.length <= 1}
          onClick={handleNextSong}
          className="rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25 disabled:opacity-45"
        >
          Switch song
        </button>
      </div>
      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          disabled={busy === "start"}
          onClick={() => void handleStart()}
          className="rounded-xl bg-violet-500/90 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-900/35 hover:bg-violet-400 disabled:opacity-50"
        >
          {busy === "start" ? "Starting…" : "Start song"}
        </button>
        <button
          type="button"
          disabled={busy === "transition"}
          onClick={() => void handleTransition()}
          className="rounded-xl bg-sky-500/85 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-900/35 hover:bg-sky-400 disabled:opacity-50"
        >
          {busy === "transition" ? "Shifting…" : "Transition"}
        </button>
        <button
          type="button"
          disabled={busy === "stop"}
          onClick={() => void handleStop()}
          className="rounded-xl bg-rose-500/90 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-900/35 hover:bg-rose-400 disabled:opacity-45"
        >
          {busy === "stop" ? "Stopping…" : "Stop music"}
        </button>
      </div>
      <p className="mt-2 text-[10px] text-white/70">
        {currentTrack?.label || "No song"} selected · host mic auto-mutes while music plays · fixed level 40%.
      </p>
      {musicError ? (
        <p className="mt-2 rounded-xl border border-amber-200/30 bg-amber-500/20 px-2.5 py-2 text-[11px] text-amber-50">
          {musicError}
        </p>
      ) : null}
    </div>
  );
}
