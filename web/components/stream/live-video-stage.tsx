"use client";

import "@livekit/components-styles";

import {
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
import { useCallback, useEffect, useState } from "react";

type LiveConn = {
  url: string;
  token: string;
  room: string;
};

type LiveVideoStageProps = {
  slug: string;
};

export function LiveVideoStage({ slug }: LiveVideoStageProps) {
  const [conn, setConn] = useState<LiveConn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLiveKitSetup, setShowLiveKitSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowLiveKitSetup(false);
    try {
      const res = await fetch(
        `/api/livekit/token?role=viewer&slug=${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      );
      const json = (await res.json().catch(() => ({}))) as Partial<LiveConn> &
        LiveKitTokenErrorBody;
      if (!res.ok || !json.token || !json.url) {
        if (json.code === LIVEKIT_NOT_CONFIGURED_CODE) {
          setShowLiveKitSetup(true);
          setError("Live video is off until LiveKit env vars are set on the server.");
        } else {
          setError(json.error || "Live video is not available yet.");
        }
        return;
      }
      setConn({ url: json.url, token: json.token, room: json.room ?? "" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not reach LiveKit token API.",
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  if (!conn) {
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/60 p-4 text-center text-sm text-white/80">
        <div className="max-w-md">
          {loading ? (
            <p>Connecting to live video…</p>
          ) : (
            <>
              <p>{error || "Waiting for host to start the stream."}</p>
              {showLiveKitSetup ? <LiveKitSetupNotice variant="dark" /> : null}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <LiveKitRoom
        serverUrl={conn.url}
        token={conn.token}
        connect
        audio={false}
        video={false}
        data-lk-theme="default"
        style={{ height: "100%", width: "100%" }}
        onDisconnected={() => setConn(null)}
        onError={(err) => setError(err.message)}
      >
        <ViewerStage />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function ViewerStage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true },
  );
  if (!tracks.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/70">
        Waiting for host video…
      </div>
    );
  }
  return (
    <div className="grid h-full w-full grid-cols-1">
      {tracks.map((track) => (
        <ParticipantTile
          key={`${track.participant.identity}-${track.source}`}
          trackRef={track}
          disableSpeakingIndicator
        />
      ))}
    </div>
  );
}
