-- Prevent client-side privilege escalation via profiles.role.
-- Authenticated users may update their own profile, but role changes are
-- only allowed for the service_role (server admin client).

create or replace function public.profiles_guard_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(
    auth.role(),
    current_setting('request.jwt.claim.role', true),
    ''
  );

  if tg_op = 'INSERT' then
    if jwt_role is distinct from 'service_role' then
      new.role := 'buyer';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role
       and jwt_role is distinct from 'service_role' then
      new.role := old.role;
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_role_trg on public.profiles;

create trigger profiles_guard_role_trg
before insert or update on public.profiles
for each row
execute function public.profiles_guard_role();

comment on function public.profiles_guard_role() is
  'Blocks non-service_role callers from setting or changing profiles.role.';
