-- Jini Live: core schema (run in Supabase SQL editor or via Supabase CLI)
-- Requires extension for gen_random_uuid (pgcrypto)

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users; app should upsert on first Google login)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  default_shipping_address jsonb,
  role text not null default 'buyer' check (role in ('buyer', 'buddy', 'host', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid (),
  slug text not null unique,
  title text,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
  livekit_room_name text not null unique,
  host_token text not null unique,
  buddy_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Viewer joined a stream (needed for RLS-safe realtime reads)
create table if not exists public.stream_access (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  stream_id uuid not null references public.live_streams (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, stream_id)
);

create index if not exists stream_access_stream_id_idx on public.stream_access (stream_id);

create table if not exists public.stream_items (
  id uuid primary key default gen_random_uuid (),
  stream_id uuid not null references public.live_streams (id) on delete cascade,
  name text not null,
  price_inr integer not null check (price_inr > 0),
  size_label text,
  image_display_url text,
  image_raw_url text,
  image_variant text not null default 'direct' check (image_variant in ('direct', 'generated')),
  status text not null default 'active' check (status in ('active', 'locked', 'sold', 'expired', 'cancelled')),
  locked_by uuid references auth.users (id) on delete set null,
  lock_expires_at timestamptz,
  sold_to uuid references auth.users (id) on delete set null,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stream_items_stream_id_status_idx on public.stream_items (stream_id, status);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid (),
  item_id uuid not null references public.stream_items (id) on delete restrict,
  buyer_id uuid not null references auth.users (id) on delete restrict,
  amount_inr integer not null check (amount_inr > 0),
  payment_method text not null default 'upi',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'expired')),
  upi_txn_ref text,
  shipping_snapshot jsonb,
  payment_provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists orders_one_paid_per_item on public.orders (item_id)
where
  status = 'paid';

create index if not exists orders_buyer_id_idx on public.orders (buyer_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid (),
  stream_id uuid not null references public.live_streams (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  message text not null,
  message_type text not null default 'user' check (message_type in ('user', 'purchase', 'system')),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_stream_id_idx on public.chat_messages (stream_id, created_at);
