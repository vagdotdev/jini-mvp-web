import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { wrapRoute } from "@/lib/logger";

export const GET = wrapRoute("api.account", async () => {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, phone, default_shipping_address")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  let balance_paise = 0;
  const { data: wallet, error: walletError } = await supabase
    .from("wallet_balances")
    .select("balance_paise")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !walletError &&
    wallet?.balance_paise != null &&
    Number.isFinite(Number(wallet.balance_paise))
  ) {
    balance_paise = Number(wallet.balance_paise);
  }

  return NextResponse.json({
    email: user.email ?? null,
    profile: profile ?? null,
    wallet: { balance_paise },
  });
});
