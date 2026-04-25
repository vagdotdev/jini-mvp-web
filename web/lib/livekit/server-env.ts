/**
 * Server-side LiveKit env reader.
 * Trims, strips wrapping quotes, and validates shape so dashboard pastes
 * (which often include trailing newlines, quotes, or wrong URL scheme) do
 * not silently produce "invalid token" responses from LiveKit.
 */
function clean(value: string | undefined): string {
  if (!value) return "";
  let s = value.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export type LiveKitServerEnv = {
  url: string;
  apiKey: string;
  apiSecret: string;
  /** non-fatal warnings to expose in error responses (no secrets). */
  warnings: string[];
  /** truthy when all three values are present (does not guarantee correctness). */
  configured: boolean;
};

export function readLiveKitServerEnv(): LiveKitServerEnv {
  const url = clean(process.env.LIVEKIT_URL);
  const apiKey = clean(process.env.LIVEKIT_API_KEY);
  const apiSecret = clean(process.env.LIVEKIT_API_SECRET);

  const warnings: string[] = [];
  if (url) {
    if (!/^wss?:\/\//i.test(url)) {
      warnings.push(
        "LIVEKIT_URL should start with wss:// (e.g. wss://your-project.livekit.cloud).",
      );
    } else if (/^ws:\/\//i.test(url)) {
      warnings.push(
        "LIVEKIT_URL is using ws:// (insecure). Use wss:// for LiveKit Cloud.",
      );
    }
    if (/\s/.test(url)) {
      warnings.push("LIVEKIT_URL contains whitespace. Re-paste without spaces or newlines.");
    }
  }
  if (apiKey && apiKey.length < 6) {
    warnings.push("LIVEKIT_API_KEY looks too short. Confirm you copied the full key.");
  }
  if (apiSecret && apiSecret.length < 16) {
    warnings.push(
      "LIVEKIT_API_SECRET looks too short. Confirm you copied the full secret.",
    );
  }

  return {
    url,
    apiKey,
    apiSecret,
    warnings,
    configured: Boolean(url && apiKey && apiSecret),
  };
}

/**
 * LiveKit's WebSocket URL (wss://...) needs to become an HTTPS URL when
 * calling the server-side RoomService REST API.
 */
export function toLiveKitApiUrl(value: string): string {
  if (value.startsWith("ws://")) return `http://${value.slice(5)}`;
  if (value.startsWith("wss://")) return `https://${value.slice(6)}`;
  return value;
}
