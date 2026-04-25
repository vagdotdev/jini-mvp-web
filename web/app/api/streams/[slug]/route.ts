import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/streams/:slug
 * Public metadata for welcome page (no secrets).
 */
export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({
      id: `demo-${slug}`,
      slug,
      title: "Sarojini Demo Live",
      status: "scheduled",
      created_at: new Date().toISOString(),
      demo: true,
    });
  }

  const { data, error } = await admin
    .from("live_streams")
    .select("id, slug, title, status, commerce_enabled, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    // Graceful fallback when migration 005 (commerce_enabled) hasn't been run yet
    if (error.message?.toLowerCase().includes("commerce_enabled")) {
      const { data: legacy, error: legacyErr } = await admin
        .from("live_streams")
        .select("id, slug, title, status, created_at")
        .eq("slug", slug)
        .maybeSingle();
      if (legacyErr) {
        return NextResponse.json({ error: legacyErr.message }, { status: 500 });
      }
      if (!legacy) {
        return NextResponse.json({ error: "Stream not found" }, { status: 404 });
      }
      return NextResponse.json({ ...legacy, commerce_enabled: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }

  // Live viewer count from stream_access
  const { count: viewerCount } = await admin
    .from("stream_access")
    .select("id", { count: "exact", head: true })
    .eq("stream_id", data.id);

  return NextResponse.json({ ...data, viewer_count: viewerCount ?? 0 });
}
