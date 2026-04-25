// PILOT-ONLY: remove with the manual-wallet pilot.
// Idempotent endpoint that guarantees the Ganesh test user exists, with a
// pre-filled profile + shipping address + wallet row at zero. The browser
// then signs in with `signInWithPassword` using the shared constants.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger, wrapRoute } from "@/lib/logger";
import {
  GANESH_DEFAULT_ADDRESS,
  GANESH_DISPLAY_NAME,
  GANESH_EMAIL,
  GANESH_PASSWORD,
  GANESH_PHONE,
} from "@/lib/dev/ganesh";

export const POST = wrapRoute("api.dev.login-as-ganesh", async () => {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  // Find Ganesh by email (paginate defensively if needed)
  let userId: string | null = null;
  for (let page = 1; page <= 5 && !userId; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      logger.error("api.dev.login-as-ganesh", "listUsers failed", {
        error: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === GANESH_EMAIL,
    );
    if (match) userId = match.id;
    if (data.users.length < 200) break;
  }

  // Create on the first call, then re-use forever
  if (!userId) {
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email: GANESH_EMAIL,
        password: GANESH_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: GANESH_DISPLAY_NAME },
      });
    if (createErr || !created.user) {
      logger.error("api.dev.login-as-ganesh", "createUser failed", {
        error: createErr?.message,
      });
      return NextResponse.json(
        { error: createErr?.message || "Could not create Ganesh user" },
        { status: 500 },
      );
    }
    userId = created.user.id;
    logger.info("api.dev.login-as-ganesh", "created Ganesh user", { userId });
  }

  // Make sure the profile row exists with the right defaults
  const { error: profileErr } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: GANESH_DISPLAY_NAME,
        phone: GANESH_PHONE,
        default_shipping_address: GANESH_DEFAULT_ADDRESS,
      },
      { onConflict: "id" },
    );
  if (profileErr) {
    logger.error("api.dev.login-as-ganesh", "profile upsert failed", {
      userId,
      error: profileErr.message,
    });
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // Make sure the wallet row exists (admin tops it up via /admin/wallet)
  const { error: walletErr } = await admin
    .from("wallet_balances")
    .upsert(
      { user_id: userId, balance_paise: 0 },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
  if (walletErr) {
    logger.error("api.dev.login-as-ganesh", "wallet upsert failed", {
      userId,
      error: walletErr.message,
    });
    // Non-fatal: balance row may already exist; ignore and continue
  }

  return NextResponse.json({
    ok: true,
    user_id: userId,
    email: GANESH_EMAIL,
  });
});
