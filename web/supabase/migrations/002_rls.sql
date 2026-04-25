-- Row Level Security (MVP). Service role (server API) bypasses RLS.

alter table public.profiles enable row level security;
alter table public.live_streams enable row level security;
alter table public.stream_access enable row level security;
alter table public.stream_items enable row level security;
alter table public.orders enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles: users manage their own row
create policy "profiles_select_own" on public.profiles for
select
  to authenticated using (id = auth.uid ());

create policy "profiles_update_own" on public.profiles for
update to authenticated using (id = auth.uid ())
with
  check (id = auth.uid ());

create policy "profiles_insert_own" on public.profiles for insert to authenticated
with
  check (id = auth.uid ());

-- Live streams: no direct client reads in MVP (use Next.js API + service role).

-- Stream access: user sees own memberships
create policy "stream_access_select_own" on public.stream_access for
select
  to authenticated using (user_id = auth.uid ());

-- Stream items: authenticated viewers who joined the stream
create policy "stream_items_select_joined" on public.stream_items for
select
  to authenticated using (
    exists (
      select
        1
      from
        public.stream_access sa
      where
        sa.user_id = auth.uid ()
        and sa.stream_id = stream_items.stream_id
    )
  );

-- Chat: same joined viewers can read
create policy "chat_select_joined" on public.chat_messages for
select
  to authenticated using (
    exists (
      select
        1
      from
        public.stream_access sa
      where
        sa.user_id = auth.uid ()
        and sa.stream_id = chat_messages.stream_id
    )
  );

-- Chat insert: joined viewers, own user_id
create policy "chat_insert_joined" on public.chat_messages for insert to authenticated
with
  check (
    user_id = auth.uid ()
    and exists (
      select
        1
      from
        public.stream_access sa
      where
        sa.user_id = auth.uid ()
        and sa.stream_id = chat_messages.stream_id
    )
  );

-- Orders: buyer reads own orders
create policy "orders_select_own" on public.orders for
select
  to authenticated using (buyer_id = auth.uid ());

-- NOTE: stream_items insert/update, item locking, and sold transitions are
-- intentionally server-only in the MVP. The buddy link calls a Next.js API that
-- validates the token, then writes with the Supabase service role.
