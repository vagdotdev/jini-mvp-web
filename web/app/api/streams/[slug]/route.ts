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
    .select("id, slug, title, status, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
