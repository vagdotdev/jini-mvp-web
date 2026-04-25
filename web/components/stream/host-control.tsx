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
  slug: string;
};

export function HostControl({ token }: HostControlProps) {
  const [conn, setConn] = useState<LiveKitConn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLiveKitSetup, setShowLiveKitSetup] = useState(false);
  const [loading, setLoading] = useState(false);

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
    /* Outer row: video left, chat right. Fixed full-screen, flex-row always. */
    <div className="fixed inset-0 z-50 flex flex-row bg-black text-white">

      {/* ── LEFT: LiveKit video column ── */}
      <div className="relative flex-1 min-w-0" style={{ height: "100dvh" }}>
        <LiveKitRoom
          serverUrl={conn.url}
          token={conn.token}
          connect
          video
          audio
          data-lk-theme="default"
          style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }}
          onDisconnected={() => setConn(null)}
          onError={(err) => setError(err.message)}
        >
          {/* Video fills the whole left column */}
          <div style={{ position: "absolute", inset: 0 }}>
            <HostStage />
          </div>

          {/* Live pill top-left */}
          <div
            className="pointer-events-none absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur ring-1 ring-white/10"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            Live
          </div>

          {/* Controls floating center-bottom */}
          <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center">
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

      {/* ── RIGHT: Chat panel (outside LiveKitRoom entirely) ── */}
      <div className="flex h-full w-80 shrink-0 flex-col border-l border-white/10 bg-zinc-950">
        <HostChatTicker hostToken={token} variant="panel" slug={conn.slug} />
      </div>
    </div>
  );
}

function HostStage() {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  ).filter((track) => track.participant.isLocal);

  return (
    <GridLayout tracks={tracks} style={{ height: "100%", width: "100%" }}>
      <ParticipantTile />
    </GridLayout>
  );
}
