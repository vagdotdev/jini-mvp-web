# Jini Live — project journal

**Entry:** 25 April · ~6:00 (local)  
**Scope:** MVP web app in `web/` (Next.js + Supabase + LiveKit). Payment checkout not live yet.

---

## Product we’re building

**Jini Live** — web-first live shopping: host streams, viewers join via welcome → login → address → live room with video, product rail, chat, and “reserve” (lock) on items; buddy publishes inventory (with photos); admin creates streams and three links (viewer / host / buddy).

---

## Done so far (shipped in codebase)

### Core platform
- [x] Next.js App Router app under `web/`
- [x] Supabase: Postgres schema (`001_init.sql`) — `profiles`, `live_streams`, `stream_access`, `stream_items`, `orders`, `chat_messages`
- [x] RLS (`002_rls.sql`) — joined viewers read items/chat; own profile; own orders; chat insert when joined
- [x] Storage (`003_storage.sql`) — `item-images` bucket, public read, no direct client writes (service role uploads)
- [x] Chat + wallet migration (`004_chat_wallet.sql`) — `sender_display_name` on messages; `wallet_balances` / `wallet_ledger` + RLS

### Streams & access
- [x] Create stream API + `/admin` — three links (viewer welcome, host token, buddy token); optional `JINI_STREAM_CREATE_SECRET`
- [x] Public stream metadata `GET /api/streams/:slug`
- [x] Viewer join `POST /api/streams/join` (with cookies) for `stream_access` (unlocks RLS realtime)
- [x] Admin: list recent streams, copy/open links, **Mark live** / **End stream** (end clears items + expires pending orders + system chat line)

### Buddy (companion)
- [x] Publish items via `POST /api/items` with `buddy_token`
- [x] Max **4** active/locked items per stream
- [x] `GET /api/items` + inventory UI; `DELETE /api/items/:id` soft-cancel (not sold)
- [x] Image **URL** + **upload** `POST /api/items/upload` (validated token, size/type limits)
- [x] Demo mode via `localStorage` + `BroadcastChannel` when Supabase off

### Viewer UX
- [x] Welcome page — Jini + Sarojini-oriented copy, CTA to onboarding, safe-area aware layout
- [x] Onboarding — Google sign-in + **Skip Google (dev)** anonymous; `StreamOnboardingPanel` + `authVersion` so UI updates; profile upsert + join; `credentials: "include"` on join fetch
- [x] Live room — `LiveVideoStage` (LiveKit), product rail (realtime Supabase), **Buy now** → `POST /api/items/lock`, messages for reserve / conflict
- [x] **Mobile:** horizontal scroll + snap for product cards; floating **Chat** sheet; unread badge; safe-area padding; larger tap targets
- [x] **Account** `/account` + `GET /api/account` — email, profile snippet, wallet balance display (₹0 until credited)

### Chat
- [x] `LiveStreamChat` — initial load + realtime inserts
- [x] **Server** `POST /api/chat` — requires join; sets `sender_display_name` from profile (first-token style; **no phone in public chat**)
- [x] Lock + stream-end inserts set `sender_display_name` where relevant

### LiveKit
- [x] `GET /api/livekit/token` — host vs viewer; room from stream
- [x] Host + viewer UI; `@livekit/components-styles`
- [x] When env missing: structured error + `LiveKitSetupNotice` (links to LiveKit Cloud / docs)

### Locks & orders
- [x] Reserve flow creates pending `orders` row + `chat_messages` purchase line
- [x] `POST|GET /api/items/release-expired-locks` — unlock expired + expire pending orders; optional `JINI_CRON_SECRET`
- [x] **Opportunistic** release on `POST /api/items/lock` so quiet rooms still heal

### Payments (scaffolding only)
- [x] `POST /api/payments/razorpay/create-order` — `item_id` (locked to you) or `amount_paise`; returns stub if keys missing
- [x] `POST /api/payments/razorpay/verify` — signature check scaffold
- [x] `POST /api/payments/razorpay/webhook` — optional `RAZORPAY_WEBHOOK_SECRET` + HMAC verify
- [x] `.env.example` documents Razorpay vars

### Ops / quality
- [x] Structured logging + `wrapRoute` on several API routes
- [x] Dev server note: `ulimit -n` + clean `.next` if EMFILE / 404 routes
- [x] Docs: `web/docs/JINI-LIVE-MAP.md` (Mermaid architecture / status)

---

## Not done yet (intentionally or next phase)

### Payments & money path
- [ ] Razorpay **Checkout** on the live page after “Yours (reserved)” — open modal, pay `price_inr`
- [ ] **Webhook + verify** path: mark `orders.paid`, `stream_items.sold`, clear lock, idempotency
- [ ] **Wallet top-up** from successful payment + `wallet_ledger` rows (schema exists; flow not wired)
- [ ] Refunds / partial flows (policy + implementation)

### Deploy & automation
- [ ] **Deploy** app (e.g. Vercel) with production env (`NEXT_PUBLIC_APP_URL`, secrets, Supabase prod)
- [ ] **Cron** every ~1 min: `GET` or `POST` `/api/items/release-expired-locks` with `Authorization: Bearer` if `JINI_CRON_SECRET` set

### Product / UX depth
- [ ] Order / reservation **history** on account (“what I held / bought”)
- [ ] **Inline edit** profile + **multiple addresses** + validation (pincode etc.)
- [ ] **Moderation** — slow mode, ban, strip/block links in chat, reports
- [ ] **Rate limits** on chat, publish, lock APIs
- [ ] **Analytics** funnel + **error monitoring** (e.g. Sentry)
- [ ] Notifications — email/SMS “stream starting”
- [ ] Legal — Terms, Privacy, refund copy

### Video / scale
- [ ] Tuning for weak networks; explicit quality ladder; host reconnect UX
- [ ] Load / cost dashboards (Supabase egress, LiveKit minutes)

### Optional / Phase 2b
- [ ] AI product image styling (`GOOGLE_AI_API_KEY` path) if you still want it

---

## Env vars you care about (checklist)

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_APP_URL` | Canonical URL for generated links |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only APIs |
| `JINI_STREAM_CREATE_SECRET` | Locks down admin create/list/status |
| `JINI_CRON_SECRET` | Protects release-expired-locks cron |
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | Video |
| `RAZORPAY_*` | When going live on payments |

---

## SQL you should have run (Supabase)

1. `001_init.sql` — tables  
2. `002_rls.sql` — policies (skip re-run if “policy already exists”)  
3. `003_storage.sql` — bucket  
4. `004_chat_wallet.sql` — chat label + wallet  

Paths: `web/supabase/migrations/`

---

## Quick “am I good?” test

1. Admin → create stream (with secret if set) → open three links.  
2. Host → camera on; viewer live → video.  
3. Buddy → upload photo → publish; viewer rail updates.  
4. Viewer → chat shows **name**, not random id.  
5. Account page loads with balance **₹0.00** when signed in.

---

*This file is a snapshot for planning and handoff; update or add dated entries in `pjournal/` as you ship.*
