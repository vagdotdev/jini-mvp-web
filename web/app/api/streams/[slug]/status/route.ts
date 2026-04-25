import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { readLiveKitServerEnv, toLiveKitApiUrl } from "@/lib/livekit/server-env";

type RouteContext = { params: Promise<{ slug: string }> };

const ALLOWED_STATUSES = new Set(["scheduled", "live", "ended"]);

function checkCreateSecret(req: Request) {
  const required = process.env.JINI_STREAM_CREATE_SECRET;
  if (!required) return true;
  const sent = req.headers.get("x-jini-create-secret");
  return sent === required;
}

/**
 * POST /api/streams/:slug/status
 * Body: { status: "scheduled" | "live" | "ended" }
 * Admin-only: updates the lifecycle state of the stream.
 * Side-effects when ending:
 *   - cancels every still-active item (status -> cancelled)
 *   - releases every locked item (status -> active, then cancelled)
 *   - expires pending orders for those items
 */
export async function POST(req: Request, context: RouteContext) {
  if (!checkCreateSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await context.params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  const next = (body.status || "").trim();
  if (!ALLOWED_STATUSES.has(next)) {
    return NextResponse.json(
      { error: `status must be one of ${[...ALLOWED_STATUSES].join(", ")}` },
      { status: 400 },
    );
  }

  const { data: stream, error: streamError } = await admin
    .from("live_streams")
    .update({ status: next, updated_at: new Date().toISOString() })
    .eq("slug", slug)
    .select("id, slug, status, livekit_room_name")
    .maybeSingle();
  if (streamError) {
    return NextResponse.json({ error: streamError.message }, { status: 500 });
  }
  if (!stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }

  let cleaned: { items: number; orders: number } | null = null;
  if (next === "ended") {
    const { data: openItems } = await admin
      .from("stream_items")
      .select("id")
      .eq("stream_id", stream.id)
      .in("status", ["active", "locked"]);
    const ids = (openItems || []).map((row) => row.id);
    if (ids.length) {
      await admin
        .from("stream_items")
        .update({
          status: "cancelled",
          locked_by: null,
          lock_expires_at: null,
        })
        .in("id", ids);
      const { data: orders } = await admin
        .from("orders")
        .update({ status: "expired" })
        .in("item_id", ids)
        .eq("status", "pending")
        .select("id");
      cleaned = { items: ids.length, orders: orders?.length ?? 0 };
    } else {
      cleaned = { items: 0, orders: 0 };
    }

    await admin.from("chat_messages").insert({
      stream_id: stream.id,
      message: "Stream ended by host. Thanks for shopping with us!",
      message_type: "system",
      sender_display_name: "Jini",
    });

    const lk = readLiveKitServerEnv();
    const roomName = stream.livekit_room_name;
    if (lk.configured) {
      const roomService = new RoomServiceClient(
        toLiveKitApiUrl(lk.url),
        lk.apiKey,
        lk.apiSecret,
      );
      try {
        await roomService.deleteRoom(roomName);
      } catch {
        // Room may already be closed or never created. Do not fail stream ending.
      }
    }
  }

  return NextResponse.json({ stream, cleaned });
}
