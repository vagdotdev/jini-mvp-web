import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger, wrapRoute } from "@/lib/logger";

const MAX_LEN = 500;
const HOST_DISPLAY_NAME = "Host";

/**
 * GET /api/chat/host?token=<host_token>&since=<iso>&limit=<n>
 * Returns recent chat messages for the host's stream. Bypasses RLS via the
 * admin client because the host is authenticated by their host_token, not by
 * Supabase auth/session. Use ?since to incrementally poll for new rows.
 */
export const GET = wrapRoute("api.chat.host.get", async (req: Request) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim() || "";
  if (!token) {
    return NextResponse.json({ error: "Missing host token" }, { status: 400 });
  }
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const { data: stream, error: lookupError } = await admin
    .from("live_streams")
    .select("id, slug, title, status, commerce_enabled")
    .eq("host_token", token)
    .maybeSingle();
  if (lookupError) {
    // Graceful fallback if the migration for commerce_enabled was not run yet
    if (lookupError.message?.toLowerCase().includes("commerce_enabled")) {
      const { data: legacy, error: legacyErr } = await admin
        .from("live_streams")
        .select("id, slug, title, status")
        .eq("host_token", token)
        .maybeSingle();
      if (legacyErr) {
        return NextResponse.json({ error: legacyErr.message }, { status: 500 });
      }
      if (!legacy) {
        return NextResponse.json(
          { error: "Stream not found for host token" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        stream: { ...legacy, commerce_enabled: false },
        messages: [],
        warning:
          "commerce_enabled column missing — run migration 005_commerce_toggle.sql in Supabase SQL editor.",
      });
    }
    logger.error("api.chat.host.get", "stream lookup failed", {
      error: lookupError.message,
    });
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!stream) {
    return NextResponse.json(
      { error: "Stream not found for host token" },
      { status: 404 },
    );
  }

  const sinceRaw = url.searchParams.get("since");
  const since =
    sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? sinceRaw : null;
  const limitParam = Number.parseInt(url.searchParams.get("limit") || "", 10);
  const limit =
    Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 200
      ? limitParam
      : 60;

  let query = admin
    .from("chat_messages")
    .select(
      "id, user_id, message, message_type, created_at, sender_display_name",
    )
    .eq("stream_id", stream.id)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (since) {
    query = query.gt("created_at", since);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("api.chat.host.get", "fetch failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    stream: {
      id: stream.id,
      slug: stream.slug,
      title: stream.title,
      status: stream.status,
      commerce_enabled: (stream as { commerce_enabled?: boolean }).commerce_enabled ?? false,
    },
    messages: data || [],
  });
});

/**
 * POST /api/chat/host?token=<host_token>
 * Body: { message: string }
 * Inserts a chat message authored by the host. user_id is null (host has no
 * Supabase user); sender_display_name is set to "Host" so viewers see who sent
 * it without revealing PII.
 */
export const POST = wrapRoute("api.chat.host.post", async (req: Request) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim() || "";
  if (!token) {
    return NextResponse.json({ error: "Missing host token" }, { status: 400 });
  }
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const { data: stream, error: lookupError } = await admin
    .from("live_streams")
    .select("id, status")
    .eq("host_token", token)
    .maybeSingle();
  if (lookupError) {
    logger.error("api.chat.host.post", "stream lookup failed", {
      error: lookupError.message,
    });
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!stream) {
    return NextResponse.json(
      { error: "Stream not found for host token" },
      { status: 404 },
    );
  }
  if (stream.status === "ended") {
    return NextResponse.json(
      { error: "Stream has ended; chat is closed." },
      { status: 410 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { message?: string };
  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json(
      { error: "Message cannot be empty" },
      { status: 400 },
    );
  }
  if (message.length > MAX_LEN) {
    return NextResponse.json(
      { error: `Message too long (max ${MAX_LEN})` },
      { status: 400 },
    );
  }

  const { data: row, error: insertError } = await admin
    .from("chat_messages")
    .insert({
      stream_id: stream.id,
      user_id: null,
      message,
      message_type: "user",
      sender_display_name: HOST_DISPLAY_NAME,
    })
    .select(
      "id, user_id, message, message_type, created_at, sender_display_name",
    )
    .single();

  if (insertError) {
    logger.error("api.chat.host.post", "insert failed", {
      error: insertError.message,
    });
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: row });
});
