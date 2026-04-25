import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { wrapRoute } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/items/:id?token=<buddy_token>
 * Soft-removes the item (status -> "cancelled") if it belongs to the stream
 * that owns the given buddy token. Sold items cannot be removed.
 */
export const DELETE = wrapRoute(
  "api.items.delete",
  async (req: Request, { params }: RouteContext) => {
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing item id" }, { status: 400 });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const { data: stream, error: streamError } = await admin
      .from("live_streams")
      .select("id")
      .eq("buddy_token", token)
      .maybeSingle();
    if (streamError) {
      return NextResponse.json({ error: streamError.message }, { status: 500 });
    }
    if (!stream) {
      return NextResponse.json({ error: "Invalid buddy link" }, { status: 401 });
    }

    const { data: item, error: itemError } = await admin
      .from("stream_items")
      .select("id, status, stream_id")
      .eq("id", id)
      .maybeSingle();
    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }
    if (!item || item.stream_id !== stream.id) {
      return NextResponse.json({ error: "Item not found for this stream" }, { status: 404 });
    }
    if (item.status === "sold") {
      return NextResponse.json(
        { error: "Item is already sold and cannot be removed." },
        { status: 409 },
      );
    }

    const { error: updateError } = await admin
      .from("stream_items")
      .update({
        status: "cancelled",
        locked_by: null,
        lock_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, was_locked: item.status === "locked" });
  },
);
