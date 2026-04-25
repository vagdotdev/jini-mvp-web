import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicAppUrl } from "@/lib/env";

function friendlySupabaseKeyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid api key") || m.includes("jwt expired")) {
    return (
      "Supabase rejected the server key. In Vercel, set SUPABASE_SERVICE_ROLE_KEY to the service_role value from Supabase → Project Settings → API (long “secret” key — not the anon “public” key). Remove spaces, save, then Redeploy."
    );
  }
  return message;
}

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
  const base = getPublicAppUrl(req);
  if (!admin) {
    return NextResponse.json({ demo: true, streams: [] });
  }
  const { data, error } = await admin
    .from("live_streams")
    .select("id, slug, title, status, host_token, buddy_token, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) {
    return NextResponse.json(
      { error: friendlySupabaseKeyError(error.message) },
      { status: 500 },
    );
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
 * DELETE /api/streams
 * Bulk-ends all streams without deleting order history.
 * Side-effects:
 *   - marks all streams as ended
 *   - cancels active/locked items and clears locks
 *   - expires pending orders for affected items
 *   - clears chat messages + stream access rows
 */
export async function DELETE(req: Request) {
  if (!checkCreateSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ demo: true, cleared: 0 });
  }

  const { data: streams, error: streamError } = await admin
    .from("live_streams")
    .select("id");
  if (streamError) {
    return NextResponse.json(
      { error: friendlySupabaseKeyError(streamError.message) },
      { status: 500 },
    );
  }

  const streamIds = (streams || []).map((stream) => stream.id);
  if (streamIds.length === 0) {
    return NextResponse.json({ ended: 0, cleaned_items: 0, expired_orders: 0 });
  }

  const { data: items, error: itemLookupError } = await admin
    .from("stream_items")
    .select("id")
    .in("stream_id", streamIds);
  if (itemLookupError) {
    return NextResponse.json({ error: itemLookupError.message }, { status: 500 });
  }

  const itemIds = (items || []).map((item) => item.id);

  const { error: endStreamsError } = await admin
    .from("live_streams")
    .update({ status: "ended", updated_at: new Date().toISOString() })
    .in("id", streamIds);
  if (endStreamsError) {
    return NextResponse.json(
      { error: friendlySupabaseKeyError(endStreamsError.message) },
      { status: 500 },
    );
  }

  let cleanedItems = 0;
  let expiredOrders = 0;
  if (itemIds.length > 0) {
    const { data: cleanedRows, error: itemUpdateError } = await admin
      .from("stream_items")
      .update({
        status: "cancelled",
        locked_by: null,
        lock_expires_at: null,
      })
      .in("id", itemIds)
      .in("status", ["active", "locked"])
      .select("id");
    if (itemUpdateError) {
      return NextResponse.json({ error: itemUpdateError.message }, { status: 500 });
    }
    cleanedItems = cleanedRows?.length ?? 0;

    const { data: expiredRows, error: ordersError } = await admin
      .from("orders")
      .update({ status: "expired" })
      .in("item_id", itemIds)
      .eq("status", "pending")
      .select("id");
    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }
    expiredOrders = expiredRows?.length ?? 0;
  }

  for (const table of ["chat_messages", "stream_access"] as const) {
    const { error } = await admin.from(table).delete().in("stream_id", streamIds);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ended: streamIds.length,
    cleaned_items: cleanedItems,
    expired_orders: expiredOrders,
    note: "Streams ended. Orders and stream history preserved.",
  });
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
  const base = getPublicAppUrl(req);

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
    return NextResponse.json(
      { error: friendlySupabaseKeyError(error.message) },
      { status: 500 },
    );
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
