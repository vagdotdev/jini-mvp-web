import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger, wrapRoute } from "@/lib/logger";

function checkCreateSecret(req: Request) {
  const required = process.env.JINI_STREAM_CREATE_SECRET;
  if (!required) return true;
  const sent = req.headers.get("x-jini-create-secret");
  return sent === required;
}

type Body = {
  user_id?: string;
  amount_inr?: number;
  ref?: string;
  note?: string;
};

/**
 * POST /api/admin/wallet/topup
 * Manually adjust a user's Jini wallet (pilot mode: payment collected outside).
 * Atomic via wallet_credit() Postgres function.
 *
 * Body: { user_id, amount_inr, ref?, note? }
 */
export const POST = wrapRoute(
  "api.admin.wallet.topup",
  async (req: Request) => {
    if (!checkCreateSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 503 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const userId = body.user_id?.trim();
    const amountInr = Number(body.amount_inr);
    const ref = body.ref?.trim() || null;
    const note = body.note?.trim() || "manual UPI top-up";

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user_id" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(amountInr) || amountInr === 0) {
      return NextResponse.json(
        { error: "amount_inr must be non-zero (use minus to remove)." },
        { status: 400 },
      );
    }
    if (Math.abs(amountInr) > 1_00_000) {
      return NextResponse.json(
        { error: "Amount looks too high — confirm before retrying." },
        { status: 400 },
      );
    }

    const amountPaise = Math.round(amountInr * 100);

    const { data, error } = await admin.rpc("wallet_credit", {
      p_user_id: userId,
      p_amount_paise: amountPaise,
      p_reason: note,
      p_ref: ref,
    });

    if (error) {
      logger.error("api.admin.wallet.topup", "wallet adjust failed", {
        user_id: userId,
        error: error.message,
      });
      const msg = error.message?.toLowerCase().includes("wallet_credit")
        ? "Wallet functions missing — run migrations 006_wallet_ops.sql and 007_wallet_negative_adjustments.sql in Supabase SQL editor."
        : error.message?.toLowerCase().includes("wallet_low")
          ? "Wallet balance cannot go below zero."
          : error.message;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const newBalancePaise = Number(data) || 0;
    logger.info("api.admin.wallet.topup", "wallet adjusted", {
      user_id: userId,
      amount_paise: amountPaise,
      new_balance_paise: newBalancePaise,
    });

    return NextResponse.json({
      ok: true,
      user_id: userId,
      credited_paise: amountPaise,
      new_balance_paise: newBalancePaise,
    });
  },
);
