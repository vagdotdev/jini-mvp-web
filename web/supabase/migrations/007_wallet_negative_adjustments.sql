-- Allow admin wallet adjustments with signed amounts.
-- Positive amount credits wallet, negative amount debits wallet.
-- Keeps safety rule: wallet balance can never go below zero.

create or replace function public.wallet_credit (
  p_user_id uuid,
  p_amount_paise bigint,
  p_reason text,
  p_ref text default null
) returns bigint language plpgsql security definer as $$
declare
  v_new_balance bigint;
begin
  if p_amount_paise is null or p_amount_paise = 0 then
    raise exception 'amount must be non-zero';
  end if;

  -- Debit path: ensure row exists and enough balance before subtracting.
  if p_amount_paise < 0 then
    insert into public.wallet_balances (user_id, balance_paise, updated_at)
    values (p_user_id, 0, now())
    on conflict (user_id) do nothing;

    update public.wallet_balances
      set balance_paise = balance_paise + p_amount_paise,
          updated_at = now()
      where user_id = p_user_id
        and balance_paise + p_amount_paise >= 0
    returning balance_paise into v_new_balance;

    if v_new_balance is null then
      raise exception 'WALLET_LOW';
    end if;
  else
    -- Credit path
    insert into public.wallet_balances (user_id, balance_paise, updated_at)
    values (p_user_id, p_amount_paise, now())
    on conflict (user_id) do update
      set balance_paise = public.wallet_balances.balance_paise + excluded.balance_paise,
          updated_at = now()
    returning balance_paise into v_new_balance;
  end if;

  insert into public.wallet_ledger (user_id, delta_paise, reason, ref)
  values (p_user_id, p_amount_paise, p_reason, p_ref);

  return v_new_balance;
end;
$$;

