import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger, wrapRoute } from "@/lib/logger";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * POST /api/items/upload
 * Form fields: token (buddy_token), file (image)
 * Returns: { url } — public URL in the item-images bucket.
 *
 * Buddy auth is the buddy_token from the URL; we never trust the client to
 * pick the storage path or bypass size/type checks.
 */
export const POST = wrapRoute("api.items.upload", async (req: Request) => {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const token = form.get("token");
  const file = form.get("file");
  if (typeof token !== "string" || !token.trim()) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File must be > 0 and < ${MAX_BYTES / (1024 * 1024)}MB` },
      { status: 413 },
    );
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type ${file.type || "unknown"}; use JPEG/PNG/WebP/GIF.` },
      { status: 415 },
    );
  }

  const { data: stream, error: streamError } = await admin
    .from("live_streams")
    .select("id, slug")
    .eq("buddy_token", token)
    .maybeSingle();
  if (streamError) {
    return NextResponse.json({ error: streamError.message }, { status: 500 });
  }
  if (!stream) {
    return NextResponse.json({ error: "Invalid buddy link" }, { status: 401 });
  }

  const ext = (file.name.split(".").pop() || "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5) || "jpg";
  const path = `${stream.slug}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("item-images")
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadError) {
    logger.error("api.items.upload", "storage upload failed", {
      error: uploadError.message,
      slug: stream.slug,
    });
    const friendly = uploadError.message.toLowerCase().includes("bucket")
      ? "Storage bucket not found. Run web/supabase/migrations/003_storage.sql in Supabase to create the item-images bucket."
      : uploadError.message;
    return NextResponse.json({ error: friendly }, { status: 500 });
  }

  const { data: pub } = admin.storage.from("item-images").getPublicUrl(path);
  logger.info("api.items.upload", "uploaded", { slug: stream.slug, bytes: file.size });
  return NextResponse.json({ url: pub.publicUrl, path });
});
