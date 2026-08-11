import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCreateSecret } from "@/lib/auth/secrets";
import { wrapRoute } from "@/lib/logger";

/**
 * GET /api/admin/users?q=<text>
 * Lists pilot users with their wallet balance for the admin top-up panel.
 * Filters by case-insensitive substring on email / full name / phone when q is provided.
 */
export const GET = wrapRoute("api.admin.users", async (req: Request) => {
  const denied = requireCreateSecret(req);
  if (denied) return denied;

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  // Pull recent users (pilot scale; one page is plenty)
  const { data: authData, error: authErr } =
    await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 500 });
  }

  const authUsers = authData.users ?? [];
  const userIds = authUsers.map((u) => u.id);
  if (!userIds.length) {
    return NextResponse.json({ users: [] });
  }

  const [{ data: profiles }, { data: balances }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", userIds),
    admin
      .from("wallet_balances")
      .select("user_id, balance_paise")
      .in("user_id", userIds),
  ]);

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p]),
  );
  const balanceById = new Map(
    (balances ?? []).map((b) => [
      b.user_id as string,
      Number(b.balance_paise) || 0,
    ]),
  );

  const merged = authUsers.map((u) => {
    const profile = profileById.get(u.id) as
      | { full_name: string | null; phone: string | null }
      | undefined;
    return {
      id: u.id,
      email: u.email ?? null,
      full_name: profile?.full_name ?? null,
      phone: profile?.phone ?? u.phone ?? null,
      balance_paise: balanceById.get(u.id) ?? 0,
      created_at: u.created_at,
    };
  });

  const filtered = q
    ? merged.filter((u) => {
        const blob = `${u.email ?? ""} ${u.full_name ?? ""} ${u.phone ?? ""}`.toLowerCase();
        return blob.includes(q);
      })
    : merged;

  filtered.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return NextResponse.json({ users: filtered.slice(0, 50) });
});
