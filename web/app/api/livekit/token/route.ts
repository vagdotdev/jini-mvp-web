import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  LIVEKIT_BAD_CONFIG_CODE,
  LIVEKIT_CLOUD_URL,
  LIVEKIT_KEYS_DOCS_URL,
  LIVEKIT_NOT_CONFIGURED_CODE,
} from "@/lib/livekit/setup-messages";
import { readLiveKitServerEnv } from "@/lib/livekit/server-env";
import { logger, wrapRoute } from "@/lib/logger";

type Role = "host" | "viewer";

export const GET = wrapRoute("api.livekit.token", async (req: Request) => {
  const url = new URL(req.url);
  const role = (url.searchParams.get("role") || "viewer") as Role;
  const tokenOrSlug = url.searchParams.get(role === "host" ? "token" : "slug");

  const lk = readLiveKitServerEnv();
  const admin = createAdminClient();

  if (!lk.configured) {
    return NextResponse.json(
      {
        error:
          "LiveKit is not configured on the server. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET (Vercel → Settings → Environment Variables) and Redeploy.",
        code: LIVEKIT_NOT_CONFIGURED_CODE,
        livekit_cloud_url: LIVEKIT_CLOUD_URL,
        docs_url: LIVEKIT_KEYS_DOCS_URL,
      },
      { status: 503 },
    );
  }
  if (lk.warnings.length) {
    return NextResponse.json(
      {
        error:
          "LiveKit env values look malformed: " +
          lk.warnings.join(" ") +
          " Fix in Vercel → Environment Variables and Redeploy.",
        code: LIVEKIT_BAD_CONFIG_CODE,
        warnings: lk.warnings,
        docs_url: LIVEKIT_KEYS_DOCS_URL,
      },
      { status: 503 },
    );
  }
  if (!admin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  if (!tokenOrSlug) {
    return NextResponse.json({ error: "Missing token or slug" }, { status: 400 });
  }

  const query =
    role === "host"
      ? admin
          .from("live_streams")
          .select("id, slug, title, status, livekit_room_name")
          .eq("host_token", tokenOrSlug)
          .maybeSingle()
      : admin
          .from("live_streams")
          .select("id, slug, title, status, livekit_room_name")
          .eq("slug", tokenOrSlug)
          .maybeSingle();

  const { data: stream, error } = await query;
  if (error) {
    logger.error("api.livekit.token", "stream lookup failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }
  if (stream.status === "ended" && role !== "host") {
    return NextResponse.json(
      { error: "This stream has ended. New joins are disabled." },
      { status: 410 },
    );
  }

  const identity = `${role}-${crypto.randomUUID()}`;
  const accessToken = new AccessToken(lk.apiKey, lk.apiSecret, {
    identity,
    name: role === "host" ? "Jini host" : "Jini viewer",
    ttl: role === "host" ? "24h" : "2h",
  });

  accessToken.addGrant({
    room: stream.livekit_room_name,
    roomJoin: true,
    canPublish: role === "host",
    canSubscribe: true,
    canPublishData: role === "host",
  });

  return NextResponse.json({
    url: lk.url,
    token: await accessToken.toJwt(),
    room: stream.livekit_room_name,
  });
});
