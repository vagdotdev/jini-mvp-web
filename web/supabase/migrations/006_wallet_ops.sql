-- Atomic wallet operations for the manual-wallet pilot.
-- Both functions run as SECURITY DEFINER so the service role can call them
-- via Supabase RPC. They lock rows with FOR UPDATE for safe concurrency.

create or replace function public.wallet_credit (
  p_user_id uuid,
  p_amount_paise bigint,
  p_reason text,
  p_ref text default null
) returns bigint language plpgsql security definer as $$
declare
  v_new_balance bigint;
begin
  if p_amount_paise is null or p_amount_paise <= 0 then
    raise exception 'amount must be positive';
  end if;

  insert into public.wallet_balances (user_id, balance_paise, updated_at)
  values (p_user_id, p_amount_paise, now())
  on conflict (user_id) do update
    set balance_paise = public.wallet_balances.balance_paise + excluded.balance_paise,
        updated_at = now()
  returning balance_paise into v_new_balance;

  insert into public.wallet_ledger (user_id, delta_paise, reason, ref)
  values (p_user_id, p_amount_paise, p_reason, p_ref);

  return v_new_balance;
end;
$$;

-- Pay for an item the buyer already reserved (locked) using wallet credits.
-- Raises 'WALLET_LOW' if balance is insufficient (caller maps to friendly text).
create or replace function public.wallet_pay_for_item (
  p_user_id uuid,
  p_item_id uuid
) returns table (
  new_balance_paise bigint,
  order_id uuid,
  amount_paise bigint
) language plpgsql security definer as $$
declare
  v_stream_id uuid;
  v_price_paise bigint;
  v_balance bigint;
  v_order_id uuid;
  v_new_balance bigint;
begin
  -- Lock the item row and validate it is reserved by this user
  select stream_id, price_inr * 100
    into v_stream_id, v_price_paise
  from public.stream_items
  where id = p_item_id
    and status = 'locked'
    and locked_by = p_user_id
    and (lock_expires_at is null or lock_expires_at > now())
  for update;

  if not found then
    raise exception 'item not reserved by this user (or hold expired)';
  end if;

  -- Lock buyer's wallet row
  select balance_paise into v_balance
  from public.wallet_balances
  where user_id = p_user_id
  for update;

  if v_balance is null or v_balance < v_price_paise then
    raise exception 'WALLET_LOW';
  end if;

  -- Debit wallet
  update public.wallet_balances
    set balance_paise = balance_paise - v_price_paise,
        updated_at = now()
    where user_id = p_user_id
  returning balance_paise into v_new_balance;

  insert into public.wallet_ledger (user_id, delta_paise, reason, ref)
  values (p_user_id, -v_price_paise, 'purchase', p_item_id::text);

  -- Mark item sold
  update public.stream_items
    set status = 'sold',
        sold_to = p_user_id,
        sold_at = now(),
        locked_by = null,
        lock_expires_at = null,
        updated_at = now()
    where id = p_item_id;

  -- Mark pending order paid (or insert if missing)
  update public.orders
    set status = 'paid',
        payment_method = 'wallet',
        updated_at = now()
    where item_id = p_item_id
      and buyer_id = p_user_id
      and status = 'pending'
  returning id into v_order_id;

  if v_order_id is null then
    insert into public.orders (item_id, buyer_id, amount_inr, payment_method, status)
    values (p_item_id, p_user_id, v_price_paise / 100, 'wallet', 'paid')
    returning id into v_order_id;
  end if;

  return query select v_new_balance, v_order_id, v_price_paise;
end;
$$;

revoke all on function public.wallet_credit (uuid, bigint, text, text) from public;
revoke all on function public.wallet_pay_for_item (uuid, uuid) from public;
grant execute on function public.wallet_credit (uuid, bigint, text, text) to service_role;
grant execute on function public.wallet_pay_for_item (uuid, uuid) to service_role;
