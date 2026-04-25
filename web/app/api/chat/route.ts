import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logger, wrapRoute } from "@/lib/logger";

const MAX_LEN = 500;

function shortDisplayName(raw: string | null | undefined, fallback: string) {
  const s = (raw ?? "").trim();
  if (!s) return fallback;
  const first = s.split(/\s+/)[0] ?? s;
  const capped = first.length > 32 ? `${first.slice(0, 29)}…` : first;
  return capped || fallback;
}

export const POST = wrapRoute("api.chat", async (req: Request) => {
  const supabase = await createServerSupabaseClient();
  const admin = createAdminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    stream_id?: string;
    message?: string;
  };
  const streamId = typeof body.stream_id === "string" ? body.stream_id.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!streamId || !message) {
    return NextResponse.json({ error: "Missing stream_id or message" }, { status: 400 });
  }
  if (message.length > MAX_LEN) {
    return NextResponse.json({ error: `Message too long (max ${MAX_LEN})` }, { status: 400 });
  }

  const { data: access, error: accessError } = await admin
    .from("stream_access")
    .select("id")
    .eq("stream_id", streamId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (accessError) {
    logger.error("api.chat", "access check failed", { error: accessError.message });
    return NextResponse.json({ error: accessError.message }, { status: 500 });
  }
  if (!access) {
    return NextResponse.json(
      { error: "Join this stream from onboarding before chatting." },
      { status: 403 },
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const metaName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;
  const senderLabel = shortDisplayName(profile?.full_name ?? metaName, "Shopper");

  const { data: row, error: insError } = await admin
    .from("chat_messages")
    .insert({
      stream_id: streamId,
      user_id: user.id,
      message,
      message_type: "user",
      sender_display_name: senderLabel,
    })
    .select("id, user_id, message, message_type, created_at, sender_display_name")
    .single();

  if (insError) {
    logger.error("api.chat", "insert failed", { error: insError.message });
    return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  return NextResponse.json({ message: row });
});
