"use client";

import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useEffect } from "react";
import { useViewerMusicPulse } from "@/lib/stream/viewer-music-pulse-context";

/**
 * Listens for small JSON data packets from the host so the viewer shell can
 * reflect background music state (e.g. location pill pulse) without guessing
 * from audio tracks.
 */
export function ViewerLiveKitMusicListener() {
  const room = useRoomContext();
  const { setMusicPulseActive } = useViewerMusicPulse();

  useEffect(() => {
    const onData = (payload: Uint8Array, participant?: { isLocal: boolean } | null) => {
      if (!participant || participant.isLocal) return;
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text) as { type?: string; playing?: boolean };
        if (msg.type === "jini-music" && typeof msg.playing === "boolean") {
          setMusicPulseActive(msg.playing);
        }
      } catch {
        // ignore non-JSON payloads
      }
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room, setMusicPulseActive]);

  return null;
}
