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
import {
  LIVEKIT_NOT_CONFIGURED_CODE,
  type LiveKitTokenErrorBody,
} from "@/lib/livekit/setup-messages";
import { Track } from "livekit-client";
import { useCallback, useState } from "react";

type HostControlProps = {
  token: string;
};

type LiveKitConn = {
  url: string;
  token: string;
  room: string;
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
      setConn({ url: json.url, token: json.token, room: json.room ?? "" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reach LiveKit token API.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

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
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 shadow-sm">
      <LiveKitRoom
        serverUrl={conn.url}
        token={conn.token}
        connect
        video
        audio
        data-lk-theme="default"
        style={{ height: "70vh", display: "flex", flexDirection: "column" }}
        onDisconnected={() => setConn(null)}
        onError={(err) => setError(err.message)}
      >
        <div className="flex-1 min-h-0">
          <HostStage />
        </div>
        <RoomAudioRenderer />
        <ControlBar
          variation="minimal"
          controls={{ microphone: true, camera: true, screenShare: false, leave: true, chat: false }}
        />
      </LiveKitRoom>
      {error ? (
        <p className="bg-amber-50 px-4 py-2 text-xs text-amber-900">{error}</p>
      ) : null}
    </section>
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
