-- Chat: optional display label shown to other viewers (first name / profile name only; never phone).
alter table public.chat_messages
  add column if not exists sender_display_name text;

comment on column public.chat_messages.sender_display_name is
  'Short label for chat UI, set by server from profiles.full_name (not verified PII like phone).';

-- Wallet: Jini credits in paise (₹1 = 100 paise). Mutations via service role / webhooks only.
create table if not exists public.wallet_balances (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance_paise bigint not null default 0 check (balance_paise >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta_paise bigint not null,
  reason text not null,
  ref text,
  created_at timestamptz not null default now()
);

create index if not exists wallet_ledger_user_id_idx on public.wallet_ledger (user_id, created_at desc);

alter table public.wallet_balances enable row level security;
alter table public.wallet_ledger enable row level security;

create policy "wallet_balances_select_own" on public.wallet_balances for
select to authenticated using (user_id = auth.uid ());

create policy "wallet_ledger_select_own" on public.wallet_ledger for
select to authenticated using (user_id = auth.uid ());
