import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logger, wrapRoute } from "@/lib/logger";

type Body = {
  item_id?: string;
};

/**
 * POST /api/items/confirm-purchase
 * Pilot: pay for a reserved item using wallet credits (atomic).
 *
 * Returns:
 *  - 200 { ok, new_balance_paise, item, order }
 *  - 402 { error: "Wallet cash not enough" } when balance is too low
 *  - 409 { error: "Hold expired or not yours" } when lock is gone
 */
export const POST = wrapRoute(
  "api.items.confirm-purchase",
  async (req: Request) => {
    const admin = createAdminClient();
    const supabase = await createServerSupabaseClient();
    if (!admin || !supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 503 },
      );
    }

    const { item_id } = (await req.json().catch(() => ({}))) as Body;
    if (!item_id) {
      return NextResponse.json({ error: "Missing item_id" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const { data, error } = await admin.rpc("wallet_pay_for_item", {
      p_user_id: user.id,
      p_item_id: item_id,
    });

    if (error) {
      const raw = (error.message || "").toLowerCase();
      if (raw.includes("wallet_low")) {
        return NextResponse.json(
          { error: "Wallet cash not enough" },
          { status: 402 },
        );
      }
      if (raw.includes("not reserved")) {
        return NextResponse.json(
          { error: "Hold expired or not yours — reserve again." },
          { status: 409 },
        );
      }
      if (raw.includes("wallet_pay_for_item")) {
        return NextResponse.json(
          {
            error:
              "Wallet functions missing — run migration 006_wallet_ops.sql in Supabase SQL editor.",
          },
          { status: 500 },
        );
      }
      logger.error("api.items.confirm-purchase", "rpc failed", {
        user_id: user.id,
        item_id,
        error: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const row = Array.isArray(data) ? data[0] : data;
    const newBalance = Number(row?.new_balance_paise ?? 0);
    const orderId = row?.order_id ?? null;
    const amountPaise = Number(row?.amount_paise ?? 0);

    // Friendly chat note so other viewers see "X bought Y"
    try {
      const { data: itemRow } = await admin
        .from("stream_items")
        .select("name, stream_id")
        .eq("id", item_id)
        .maybeSingle();
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const buyerLabel = profile?.full_name?.trim() || "A shopper";
      if (itemRow?.stream_id) {
        await admin.from("chat_messages").insert({
          stream_id: itemRow.stream_id,
          user_id: user.id,
          message: `${buyerLabel} bought «${itemRow.name}» (₹${amountPaise / 100}).`,
          message_type: "purchase",
          sender_display_name: buyerLabel,
        });
      }
    } catch {
      // Non-fatal
    }

    logger.info("api.items.confirm-purchase", "wallet purchase complete", {
      user_id: user.id,
      item_id,
      order_id: orderId,
      amount_paise: amountPaise,
      new_balance_paise: newBalance,
    });

    return NextResponse.json({
      ok: true,
      new_balance_paise: newBalance,
      order_id: orderId,
      amount_paise: amountPaise,
    });
  },
);
