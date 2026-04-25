import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Release all stream_items whose lock_expires_at is in the past back to
 * `active`, and mark any matching pending orders as `expired`.
 */
export async function releaseExpiredLocks(): Promise<{
  ok: boolean;
  status: number;
  body: { released?: number; error?: string };
}> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, status: 503, body: { error: "Supabase not configured" } };
  }

  const now = new Date().toISOString();

  const { data: expiredItems, error: selectError } = await admin
    .from("stream_items")
    .select("id")
    .eq("status", "locked")
    .lt("lock_expires_at", now);
  if (selectError) {
    return { ok: false, status: 500, body: { error: selectError.message } };
  }

  const ids = (expiredItems || []).map((row) => row.id);
  if (!ids.length) {
    return { ok: true, status: 200, body: { released: 0 } };
  }

  const { error: updateError } = await admin
    .from("stream_items")
    .update({ status: "active", locked_by: null, lock_expires_at: null })
    .in("id", ids);
  if (updateError) {
    return { ok: false, status: 500, body: { error: updateError.message } };
  }

  await admin
    .from("orders")
    .update({ status: "expired" })
    .in("item_id", ids)
    .eq("status", "pending");

  return { ok: true, status: 200, body: { released: ids.length } };
}
