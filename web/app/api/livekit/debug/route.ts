import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import {
  LIVEKIT_BAD_CONFIG_CODE,
  LIVEKIT_CLOUD_URL,
  LIVEKIT_KEYS_DOCS_URL,
  LIVEKIT_NOT_CONFIGURED_CODE,
} from "@/lib/livekit/setup-messages";
import { readLiveKitServerEnv, toLiveKitApiUrl } from "@/lib/livekit/server-env";

/**
 * GET /api/livekit/debug
 * Validates LiveKit credentials by performing a single ListRooms call.
 * Gated by JINI_STREAM_CREATE_SECRET when set, so it can stay enabled in
 * production without leaking the existence of credentials.
 */
function checkCreateSecret(req: Request) {
  const required = process.env.JINI_STREAM_CREATE_SECRET;
  if (!required) return true;
  const sent = req.headers.get("x-jini-create-secret");
  return sent === required;
}

export async function GET(req: Request) {
  if (!checkCreateSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const lk = readLiveKitServerEnv();
  if (!lk.configured) {
    return NextResponse.json(
      {
        ok: false,
        code: LIVEKIT_NOT_CONFIGURED_CODE,
        error:
          "Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in Vercel and Redeploy.",
        livekit_cloud_url: LIVEKIT_CLOUD_URL,
        docs_url: LIVEKIT_KEYS_DOCS_URL,
      },
      { status: 503 },
    );
  }
  if (lk.warnings.length) {
    return NextResponse.json(
      {
        ok: false,
        code: LIVEKIT_BAD_CONFIG_CODE,
        error: "LiveKit env values look malformed.",
        warnings: lk.warnings,
      },
      { status: 503 },
    );
  }

  const roomService = new RoomServiceClient(
    toLiveKitApiUrl(lk.url),
    lk.apiKey,
    lk.apiSecret,
  );
  try {
    const rooms = await roomService.listRooms();
    return NextResponse.json({
      ok: true,
      url: lk.url,
      apiKeyHint: `${lk.apiKey.slice(0, 4)}…${lk.apiKey.slice(-2)}`,
      roomCount: rooms.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const lower = message.toLowerCase();
    let hint = message;
    if (lower.includes("invalid") || lower.includes("unauthorized") || lower.includes("401")) {
      hint =
        "LiveKit rejected the credentials. Most likely cause: LIVEKIT_URL is for a different LiveKit project than LIVEKIT_API_KEY/SECRET. Open https://cloud.livekit.io → your project → Settings → Keys, and copy URL + Key + Secret from the SAME project. Re-paste cleanly into Vercel and Redeploy.";
    } else if (lower.includes("getaddrinfo") || lower.includes("enotfound")) {
      hint =
        "Cannot reach LIVEKIT_URL host. Confirm the wss:// URL from LiveKit Cloud is exact (no extra path, no spaces).";
    }
    return NextResponse.json(
      {
        ok: false,
        url: lk.url,
        apiKeyHint: `${lk.apiKey.slice(0, 4)}…${lk.apiKey.slice(-2)}`,
        error: hint,
        rawError: message,
      },
      { status: 502 },
    );
  }
}
