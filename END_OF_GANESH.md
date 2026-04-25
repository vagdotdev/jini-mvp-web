# End of Ganesh (Pilot Cleanup Guide)

This note explains what the Ganesh test mode is, where it lives, and exactly how to remove it later without breaking the stream flow.

## What Ganesh Is

Ganesh is a pilot-only fast-login test account used to skip normal onboarding during wallet testing.

Current behavior:

- On stream onboarding, there is a button: `Login as Ganesh (test user)`.
- Clicking it calls `POST /api/dev/login-as-ganesh`.
- That endpoint ensures a fixed test user exists, then the UI signs in using password auth and jumps to `/stream/[slug]/live`.
- Ganesh is also visible in the admin wallet top-up page so we can test reserve -> confirm purchase -> wallet debit quickly.

Ganesh identity constants:

- Email: `ganesh@jini.test`
- Password: `ganesh-pilot-test`
- Name: `Ganesh`
- Phone: `+919148917755`

## Files Added/Changed for Ganesh

Main Ganesh-specific files:

- `web/lib/dev/ganesh.ts`
- `web/app/api/dev/login-as-ganesh/route.ts`

Ganesh UI wiring:

- `web/components/auth/login-button.tsx`
- `web/components/auth/stream-onboarding-panel.tsx`

Admin wallet access (related pilot UX, not Ganesh-only):

- `web/app/admin/page.tsx` (hero wallet button)
- `web/app/admin/wallet/page.tsx` (wallet controls page)

## One-Command Discovery

When removing later, first confirm all current references:

```bash
rg -n "Ganesh|ganesh|login-as-ganesh|PILOT-ONLY" web
```

## Safe Removal Steps

Follow in this order.

### 1) Remove the Ganesh login route and constants

Delete:

- `web/app/api/dev/login-as-ganesh/route.ts`
- `web/lib/dev/ganesh.ts`

### 2) Remove Ganesh button from onboarding UI

In `web/components/auth/login-button.tsx`:

- Remove import from `@/lib/dev/ganesh`.
- Remove `loadingGanesh` state.
- Remove `loginAsGanesh()` function.
- Remove the Ganesh button JSX and its helper text.
- Remove `liveRedirect` prop usage if no longer needed.

### 3) Remove the extra prop plumbing

In `web/components/auth/stream-onboarding-panel.tsx`:

- Remove `liveRedirect={`/stream/${slug}/live`}` from `LoginButton`.

Optional cleanup in `login-button.tsx`:

- Remove the `liveRedirect?: string` type if unused after step 3.

### 4) Optional: Keep or remove wallet admin UX

These are not Ganesh-specific. Decide based on pilot status:

- Keep if manual wallet operations continue.
- Remove if moving fully to normal auth/payment flow:
  - wallet button in `web/app/admin/page.tsx`
  - page `web/app/admin/wallet/page.tsx`

### 5) Remove Ganesh data from Supabase (optional but recommended)

If you want to fully clean Ganesh data, run this in Supabase SQL editor:

```sql
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = 'ganesh@jini.test'
  limit 1;

  if v_user_id is null then
    raise notice 'Ganesh user not found.';
    return;
  end if;

  -- orders.buyer_id is ON DELETE RESTRICT, so remove order rows first.
  delete from public.orders where buyer_id = v_user_id;

  -- these are ON DELETE CASCADE from auth.users, but explicit deletes are fine.
  delete from public.wallet_ledger where user_id = v_user_id;
  delete from public.wallet_balances where user_id = v_user_id;
  delete from public.profiles where id = v_user_id;

  -- finally remove auth user
  delete from auth.users where id = v_user_id;

  raise notice 'Ganesh removed: %', v_user_id;
end $$;
```

## Quick Validation After Removal

Run these checks:

1. `npm run build` in `web/` passes.
2. Stream onboarding only shows intended login options (Google + Skip as desired).
3. `rg -n "Ganesh|login-as-ganesh" web` returns no matches.
4. `/api/dev/login-as-ganesh` returns 404 (expected).

## Re-Enable Later (if ever needed)

If you need Ganesh again, restore:

- `web/lib/dev/ganesh.ts`
- `web/app/api/dev/login-as-ganesh/route.ts`
- Ganesh button block in `web/components/auth/login-button.tsx`
- `liveRedirect` prop in `web/components/auth/stream-onboarding-panel.tsx`

Then build and test once.

