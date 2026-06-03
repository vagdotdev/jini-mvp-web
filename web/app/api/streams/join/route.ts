import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type JoinBody = {
  slug?: string;
};

export async function POST(req: Request) {
  const admin = createAdminClient();
  const supabase = await createServerSupabaseClient();
  if (!admin || !supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { slug } = (await req.json().catch(() => ({}))) as JoinBody;
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { data: stream, error: streamError } = await admin
    .from("live_streams")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (streamError) {
    return NextResponse.json({ error: streamError.message }, { status: 500 });
  }
  if (!stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }

  const { error } = await admin.from("stream_access").upsert(
    { stream_id: stream.id, user_id: user.id },
    { onConflict: "user_id,stream_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
