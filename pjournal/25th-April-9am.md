# Jini Live — Status Update

**Updated:** Saturday, 25 April, 9:00 AM (local)

> **Supersedes:** [`25th-April-6am.md`](./25th-April-6am.md) for product + ops detail up to that point.

---

## What’s done till now (product + reliability)

- Core MVP in `web/`: Next.js + Supabase + LiveKit — admin links, host live, buddy items, viewers join and reserve.
- Stream links fixed for production use: base URL driven by `NEXT_PUBLIC_APP_URL`; production host (e.g. `https://www.sarojini.shop`) when env is set correctly.
- Admin UX: recent streams + secret unlock, safer `Clear all` (preserves paid order history), copy toasts, orders in admin, `/admin/orders`, CSV, stream context on orders.
- Live room: cleaned status noise, removed fake viewer count, mobile chat panel behavior improved.
- Host/buddy: 24h LiveKit token TTL, host rejoin recovery, buddy blocked after stream end.
- **Infra / deployment (this week’s work):**
  - Vercel CLI installed and linked; production deploys from `web/`.
  - Docs + `scripts/vercel-prod.sh` for repeatable prod deploys.
  - Supabase env hardening in code: trim / accidental quote stripping on keys; clearer API errors when the **service_role** key is wrong vs anon.
  - Custom domain work started (`sarojini.shop`); SSL/DNS alignment is an ongoing ops checklist (see blockers).

---

## What changed between ~6 AM and ~9 AM (session notes)

- Vercel login + deploy flow exercised; project env vs local `.env.local` clarified.
- “Invalid API key” on stream create traced to **Supabase server key** (`SUPABASE_SERVICE_ROLE_KEY` must be **service_role**, same project as URL) — not LiveKit.
- Build confusion resolved: monorepo needs Vercel **Root Directory = `web`** (where `package.json` + `next` live); otherwise “No Next.js version detected.”
- Env vars in Vercel UI often **hide** values after save — names still being listed usually means they’re stored; re-paste only when replacing.
- Domain: `ERR_CERT_COMMON_NAME_INVALID` is DNS/SSL propagation or apex vs `www` mismatch — fix in Vercel Domains + registrar, then wait for cert.

---

## ELI5 — how the pieces fit

- **Next.js** = the app UI and API routes.
- **Vercel** = where the app runs on the internet (must point at the `web/` folder).
- **Supabase** = database + auth; **service role** key is for trusted server actions (e.g. creating streams).
- **LiveKit** = video; keys must match the project you use in the app.
- **Env vars** = wiring between all of the above; wrong or missing key ⇒ one feature fails even if the rest works.

---

## Current blockers / watchouts

| Area | Risk |
|------|------|
| Vercel Root Directory | Must be **`web`** or builds fail |
| Env scope | Production vs Preview; values often masked in UI |
| Supabase keys | Anon vs **service_role** mix-up breaks admin stream create |
| Domain + HTTPS | DNS + cert lag; use Vercel’s shown records exactly |
| `NEXT_PUBLIC_APP_URL` | Must match **canonical** live URL (then redeploy) |

---

## What’s still left (backlog)

- **Payments:** Razorpay checkout + paid-order state machine + **idempotent** webhooks.
- **Fulfillment:** Operator workflow — filters (stream/time/buyer), address quality, dispatch lifecycle.
- **Scale / ops:** Rate limits (chat/publish/lock), moderation, reconnect + long-session UX, error monitoring + analytics.
- **Hygiene:** Vercel as source of truth for prod env; document “no secrets in git.”
- **Validation:** Team stress-test, weak-network and device matrix, perf tuning.

---

## Upcoming — suggested focus for **next session**

Pick **1–2** of these so the next block of work stays shippable:

1. **Stabilize prod (15–30 min if not green):** Confirm Vercel Root = `web`, Production env complete, one clean redeploy, smoke: `/admin` create stream, open viewer/host/buddy links, HTTPS on chosen domain.
2. **Razorpay path (bigger feature):** Order creation → payment → webhook → order status; idempotency and logging for failed/signature errors.
3. **Fulfillment slice:** One tight loop — e.g. “paid → ready to pack → shipped” on `/admin/orders` with minimal new UI.
4. **Observability light:** Sentry (or Vercel Runtime logs + one alert) so production errors aren’t invisible.

**Recommended order if prod still flaky:** (1) first, then (2) or (3) by business priority. **Next session default proposal:** (1) if anything is red, else start **(2) Razorpay happy path** or **(3) one fulfillment state** depending on whether money or operations is the hotter pain.

---

## Open questions to decide next time

- Canonical URL: `www` vs apex — pick one, redirect the other, set `NEXT_PUBLIC_APP_URL` + Supabase auth URLs to match.
- When to enable stricter `JINI_STREAM_CREATE_SECRET` on public admin URL.
- Razorpay: test mode vs live keys timeline (KYC).
