import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicAppUrl } from "@/lib/env";

function checkCreateSecret(req: Request) {
  const required = process.env.JINI_STREAM_CREATE_SECRET;
  if (!required) return true;
  const sent = req.headers.get("x-jini-create-secret");
  return sent === required;
}

/**
 * GET /api/streams
 * Lists recent streams (admin only). Returns the three URLs for each stream so
 * the admin page can re-copy / re-open links without recreating a stream.
 */
export async function GET(req: Request) {
  if (!checkCreateSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const base = getPublicAppUrl();
  if (!admin) {
    return NextResponse.json({ demo: true, streams: [] });
  }
  const { data, error } = await admin
    .from("live_streams")
    .select("id, slug, title, status, host_token, buddy_token, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const streams = (data || []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    created_at: row.created_at,
    viewer_url: `${base}/stream/${row.slug}/welcome`,
    host_url: `${base}/host/${row.host_token}`,
    buddy_url: `${base}/companion/${row.buddy_token}`,
  }));
  return NextResponse.json({ streams });
}

/**
 * POST /api/streams
 * Creates a live_streams row and returns three links (viewer, host, buddy).
 * Requires Supabase service role + optional JINI_STREAM_CREATE_SECRET header.
 */
export async function POST(req: Request) {
  if (!checkCreateSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  let body: { title?: string } = {};
  try {
    body = (await req.json()) as { title?: string };
  } catch {
    body = {};
  }

  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : "Jini Live";

  const slug = nanoid(10);
  const host_token = nanoid(32);
  const buddy_token = nanoid(32);
  const livekit_room_name = `jini-${slug}`;
  const base = getPublicAppUrl();

  if (!admin) {
    return NextResponse.json({
      demo: true,
      streamId: `demo-${slug}`,
      slug,
      title,
      livekit_room_name,
      viewer_url: `${base}/stream/${slug}/welcome`,
      host_url: `${base}/host/demo-host-${slug}`,
      buddy_url: `${base}/companion/demo-buddy-${slug}`,
      warning:
        "Demo links generated locally. Connect Supabase to persist real streams.",
    });
  }

  const { data, error } = await admin
    .from("live_streams")
    .insert({
      slug,
      title,
      status: "scheduled",
      livekit_room_name,
      host_token,
      buddy_token,
    })
    .select("id, slug, title, livekit_room_name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    streamId: data.id,
    slug: data.slug,
    title: data.title,
    livekit_room_name: data.livekit_room_name,
    viewer_url: `${base}/stream/${data.slug}/welcome`,
    host_url: `${base}/host/${host_token}`,
    buddy_url: `${base}/companion/${buddy_token}`,
  });
}
