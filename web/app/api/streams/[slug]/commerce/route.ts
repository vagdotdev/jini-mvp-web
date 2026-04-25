import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger, wrapRoute } from "@/lib/logger";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * POST /api/streams/[slug]/commerce
 * Body: { enabled: boolean }
 * Gated by host_token (query param) — no admin secret required so host phone
 * can call it directly without knowing the secret.
 */
export const POST = wrapRoute(
  "api.streams.commerce",
  async (req: Request, context: RouteContext) => {
    const { slug } = await context.params;
    const url = new URL(req.url);
    const hostToken = url.searchParams.get("token")?.trim() || "";

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 503 },
      );
    }

    // Validate host_token belongs to this stream
    const { data: stream, error: lookupErr } = await admin
      .from("live_streams")
      .select("id, slug, commerce_enabled")
      .eq("slug", slug)
      .eq("host_token", hostToken)
      .maybeSingle();

    if (lookupErr) {
      const msg = lookupErr.message || "";
      if (msg.toLowerCase().includes("commerce_enabled")) {
        return NextResponse.json(
          {
            error:
              "Database missing the commerce_enabled column. Run web/supabase/migrations/005_commerce_toggle.sql in your Supabase SQL editor, then try again.",
          },
          { status: 500 },
        );
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    if (!stream) {
      return NextResponse.json(
        { error: "Stream not found or invalid host token" },
        { status: 404 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      enabled?: boolean;
    };
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { error: "Body must include { enabled: true | false }" },
        { status: 400 },
      );
    }

    const { data: updated, error: updateErr } = await admin
      .from("live_streams")
      .update({ commerce_enabled: body.enabled })
      .eq("id", stream.id)
      .select("id, slug, commerce_enabled")
      .single();

    if (updateErr) {
      const msg = updateErr.message || "";
      if (msg.toLowerCase().includes("commerce_enabled")) {
        return NextResponse.json(
          {
            error:
              "Database missing the commerce_enabled column. Run web/supabase/migrations/005_commerce_toggle.sql in your Supabase SQL editor, then try again.",
          },
          { status: 500 },
        );
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    logger.info("api.streams.commerce", "commerce toggled", {
      slug,
      enabled: body.enabled,
    });

    return NextResponse.json({
      slug: updated.slug,
      commerce_enabled: updated.commerce_enabled,
    });
  },
);
