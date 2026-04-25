-- Commerce toggle: host can enable/disable purchasing mid-stream.
alter table public.live_streams
  add column if not exists commerce_enabled boolean not null default false;

comment on column public.live_streams.commerce_enabled is
  'When false, the lock/buy API rejects purchase attempts with a friendly message. Host controls this live.';
