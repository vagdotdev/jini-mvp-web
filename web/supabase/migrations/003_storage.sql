-- Storage bucket for buddy item photos.
-- Buddy uploads are server-side via service role (validated by buddy_token), so
-- we keep the bucket private to direct writes; reads are public so viewers can
-- load product images without signed URLs.

insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do update set public = excluded.public;

-- Public read for the bucket
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'item_images_public_read'
  ) then
    create policy "item_images_public_read"
      on storage.objects for select
      using (bucket_id = 'item-images');
  end if;
end $$;

-- Block direct anon/authenticated writes; service role bypasses RLS.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'item_images_no_client_writes'
  ) then
    create policy "item_images_no_client_writes"
      on storage.objects for insert to authenticated, anon
      with check (false);
  end if;
end $$;
