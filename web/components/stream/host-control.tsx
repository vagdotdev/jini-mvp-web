"use client";

import "@livekit/components-styles";

import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import { LiveKitSetupNotice } from "@/components/stream/livekit-setup-notice";
import { HostChatTicker } from "@/components/stream/host-chat-ticker";
import {
  LIVEKIT_NOT_CONFIGURED_CODE,
  type LiveKitTokenErrorBody,
} from "@/lib/livekit/setup-messages";
import { Track } from "livekit-client";
import { useCallback, useEffect, useState } from "react";

type HostControlProps = {
  token: string;
};

type LiveKitConn = {
  url: string;
  token: string;
  room: string;
};

function useIsLandscape() {
  const [landscape, setLandscape] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(
      "(orientation: landscape) and (max-height: 600px)",
    );
    const handler = (event: MediaQueryListEvent | MediaQueryList) =>
      setLandscape("matches" in event ? event.matches : false);
    handler(mq);
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    mq.addListener(handler as (e: MediaQueryListEvent) => void);
    return () =>
      mq.removeListener(handler as (e: MediaQueryListEvent) => void);
  }, []);
  return landscape;
}

export function HostControl({ token }: HostControlProps) {
  const [conn, setConn] = useState<LiveKitConn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLiveKitSetup, setShowLiveKitSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const isLandscape = useIsLandscape();

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
      setConn({ url: json.url, token: json.token, room: json.room ?? "" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reach LiveKit token API.",
      );
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
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <LiveKitRoom
        serverUrl={conn.url}
        token={conn.token}
        connect
        video
        audio
        data-lk-theme="default"
        style={{
          position: "relative",
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
        onDisconnected={() => setConn(null)}
        onError={(err) => setError(err.message)}
      >
        <header
          className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 py-3"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.65rem)" }}
        >
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur ring-1 ring-white/10">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            Live
          </div>
          <span className="pointer-events-auto rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur">
            Host viewfinder
          </span>
        </header>

        <div className="relative flex-1 min-h-0">
          <HostStage />
          <div
            className={
              isLandscape
                ? "pointer-events-none absolute inset-y-0 right-0 w-[280px] max-w-[36vw] bg-gradient-to-l from-black/55 via-black/15 to-transparent"
                : "pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/75 via-black/35 to-transparent"
            }
          />
          <HostChatTicker
            hostToken={token}
            variant={isLandscape ? "landscape" : "portrait"}
          />
        </div>

        <RoomAudioRenderer />
        <div
          className="relative z-30 border-t border-white/10 bg-black/65 backdrop-blur-md"
          style={{
            paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))",
          }}
        >
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
      </LiveKitRoom>
      {error ? (
        <p
          className="absolute inset-x-0 z-40 px-4 py-2 text-center text-xs text-amber-100"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 3.25rem)",
            background: "rgba(120, 53, 15, 0.85)",
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function HostStage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  return (
    <GridLayout tracks={tracks} style={{ height: "100%" }}>
      <ParticipantTile />
    </GridLayout>
  );
}
