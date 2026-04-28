# Pjournal

This file consolidates previous journal files without trimming or rewriting their contents.

---

## From `25th-April-6am.md`

# Jini Live — Status Update (snapshot)

**Updated (snapshot):** Saturday, 25 April, 9:30 AM (local)

> **Latest journal:** see [`25th-April-9am.md`](./25th-April-9am.md) for the current rundown, session deltas, and **upcoming / next session** plan.

## What’s done till now

- Core MVP is live in `web/` with Next.js + Supabase + LiveKit, including the full stream flow: admin creates links, host goes live, buddy publishes items, viewers join and reserve items.
- Stream-link generation is fixed for production: generated links now consistently resolve on `https://www.sarojini.shop` and are no longer broken/404 due to malformed base URLs.
- Admin usability is much better now:
  - Recent streams can be unlocked using the secret without creating a new stream.
  - `Clear all` no longer destroys historical sales data; it now ends streams in bulk, cancels active/locked items, expires pending reservations, and preserves paid order history.
  - Copy actions on admin now show a visual toast confirmation so you know links were copied.
- Orders visibility has moved forward:
  - Recent paid orders are visible in admin.
  - `/admin/orders` and CSV export exist.
  - Stream title/slug context is retained in order views.
- Live-room and chat issues from testing have been fixed:
  - Removed misleading “could not join stream” status noise.
  - Removed fake viewer count display.
  - Mobile chat no longer dismisses unexpectedly when interacting inside the panel.
- Reliability hardening for host/buddy flow is now in place:
  - Host LiveKit token TTL extended from 2h to 24h.
  - Host can rejoin with the same host link even if stream status is ended (recovery-friendly).
  - Buddy item actions are now blocked once a stream is ended.
- Multiple production redeploys completed on Vercel, and smoke tests have been run against live generated links.

## What’s left

- Payments are still scaffold-level: Razorpay checkout + end-to-end paid-order state transitions (with idempotent webhook handling) need to be finalized.
- Post-stream fulfillment needs to be completed as a polished operator workflow: full filters (stream/time/buyer), richer address handling, and dispatch lifecycle actions.
- Add stronger operational safeguards for scale:
  - API rate limits (chat/publish/lock)
  - moderation controls
  - better reconnect UX and long-session monitoring
  - error monitoring + analytics funnel
- Clean up environment management and deployment hygiene (reduce dependency on local `.env` assumptions, keep Vercel env source of truth).
- Stress-test with a team under realistic traffic and device conditions, then tune weak-network behavior and performance bottlenecks.

---

## From `25th-April-9am.md`

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

---

## From `25th-April-10pm.md`

# Jini Live — 10 PM Update

**Updated:** Saturday, 25 April, 10:00 PM (local)

> Continuation from [`25th-April-9am.md`](./25th-April-9am.md).  
> This captures the full pilot-shaping work completed through tonight.

---

## What we completed today (major outcomes)

- Host stream UX stabilized:
  - Host view is now a proper viewfinder (local camera only, no multi-tile participant layout).
  - Host-side live chat/ticker experience works alongside camera view.
- Commerce control shipped end-to-end:
  - Host can toggle purchasing on/off during stream.
  - Viewer side now reflects host state with simple pills:
    - `People are shopping`
    - `Shopping starts in a sometime`
  - `Buy now` is hidden when commerce is off.
- Viewer UI cleanup and polish:
  - Removed distracting warning noise.
  - Added profile icon on `Account`.
  - Added location notch centered at top with pin icon.
  - Added live viewers pill near `LIVE` badge (formatted with `K` suffix as requested).
  - Product cards are centered better in layout.
- Manual wallet pilot flow is now functional:
  - Dedicated admin wallet page: `/admin/wallet`.
  - Admin can search users, top up wallet, and (new) reverse mistakes by entering negative amounts.
  - Wallet adjustments are atomic and logged in wallet ledger.
- Purchase flow implemented for pilot:
  - Viewer reserves item -> confirms purchase.
  - Wallet debit + order status + item sold transition run atomically.
  - Exact low-funds copy shown: `Wallet cash not enough`.
- Auth/test operations setup:
  - `Login as Ganesh` pilot shortcut added.
  - Ganesh helper documented in `END_OF_GANESH.md`.
  - User list was cleaned as requested; Ganesh preserved for pilot testing.

---

## Late-night improvements just completed

- Added safe signed wallet adjustments:
  - Positive amount adds money.
  - Negative amount removes money.
  - Balance cannot go below zero (guarded).
- Viewer stream now shows a tiny wallet pill at top:
  - Wallet icon + current balance.
  - Balance refreshes while viewing stream.
- Added extra client-side purchase guard:
  - If wallet is zero or below item price, flow does not proceed and shows:
    - `Wallet cash not enough`

---

## Current system behavior (pilot reality)

- Pilot is running with mixed login paths (Google / skip / Ganesh test), not final production auth.
- Manual wallet operations are the payment mechanism right now.
- This is intentional for the 5-10 user pilot to keep operations simple and controllable.

---

## What is still left (next priority stack)

1. Authentication hardening
   - Decide final login policy (Google only vs Google + phone OTP).
   - Disable skip login outside dev/pilot mode.
   - Ensure repeat users reliably return to same identity/wallet.
2. Onboarding simplification
   - Reduce friction in account + address save flow.
   - Improve clarity of steps and state.
3. Account creation without stream link
   - Add standalone signup/login path (outside stream URL).
   - Allow users to prepare profile/address before joining live.
4. Small UX reliability pass
   - Add lock countdown visibility for reserved items.
   - Make all user-facing errors equally simple/friendly.
5. Pilot teardown readiness
   - Remove Ganesh shortcuts when real auth is finalized.

## Latest To-Do List (from this 10 PM entry)

- Authentication hardening
  - Implement final auth path (Google only vs Google + phone OTP).
  - Disable skip login outside dev/pilot mode.
  - Ensure repeat users return to the same identity and wallet.
- Onboarding improvement
  - Simplify onboarding UI and reduce friction in profile/address save.
  - Make login state clearly visible ("You are signed in as ...").
- Account without stream link
  - Add standalone signup/login flow so users can create accounts before joining a stream.
- UX and reliability polish
  - Show lock countdown while an item is reserved.
  - Keep wallet balance context visible near purchase actions.
  - Standardize user-facing error messages (simple, consistent tone).
  - Add small safety rails for negative wallet adjustments (clear warning + reason logging quality).
- Pilot cleanup readiness
  - Keep Ganesh/test-only flows clearly marked and easy to remove after production auth is live.

---

## Risk watch (important)

- If migrations are not run in Supabase, wallet operations can fail.
  - Required for current flow:
    - `006_wallet_ops.sql`
    - `007_wallet_negative_adjustments.sql`
- Manual wallet process needs operator discipline:
  - Correct user selection
  - Correct amount sign (+/-)
  - Reference note entry for traceability

---

## Summary

The pilot loop is now coherent:

- go live,
- show items,
- open/close commerce,
- reserve,
- confirm purchase,
- debit wallet safely,
- monitor from admin.

What remains is mostly product-hardening for broader launch: proper auth, smoother onboarding, and standalone account entry.

---

## From `JOURNAL.md`

# Jini Journal

This is the single growing journal file for Jini.  
All future updates should be appended here as new dated entries.

---

## 2026-04-25 06:00 (Saturday) — Snapshot Entry

### Done

- Core MVP is live in `web/` with Next.js + Supabase + LiveKit.
- Full stream loop exists: admin creates links -> host goes live -> buddy publishes items -> viewers join and reserve.
- Stream-link generation stabilized for production URL behavior.
- Admin usability improved:
  - secret unlock for recent streams,
  - safer clear-all behavior (preserves paid order history),
  - copy toast feedback.
- Orders visibility introduced:
  - recent paid orders in admin,
  - `/admin/orders`,
  - CSV export support,
  - stream context retained on orders.
- Live-room/chat cleanup:
  - noisy status removed,
  - fake viewer count removed,
  - mobile chat interaction improved.
- Host/buddy reliability improvements:
  - longer host token TTL,
  - host recovery-friendly rejoin,
  - buddy actions blocked after stream end.

### What was left then

- End-to-end payments finalization (Razorpay happy path + idempotent webhook handling).
- Post-stream fulfillment flow polish (filters, address quality, dispatch lifecycle).
- Scale/ops safeguards (rate limits, moderation, reconnect UX, monitoring/analytics).
- Stronger deployment/env hygiene and stress testing.

---

## 2026-04-25 09:00 (Saturday) — Infrastructure + Reliability Entry

### Done

- Vercel deployment path clarified and stabilized (`web/` root).
- Env handling hardened:
  - clearer distinction between anon and service-role key failures,
  - cleaner error guidance.
- Build/deploy confusion resolved (`No Next.js version detected` linked to wrong root directory).
- Domain and SSL debugging process documented.
- Session-level ELI5 system mapping completed (Next.js, Vercel, Supabase, LiveKit, env wiring).

### Risks noted

- Wrong Vercel root directory can break builds.
- Production/preview env scope confusion can mask misconfiguration.
- Supabase key mix-ups can break admin stream creation.
- Domain + SSL propagation delays can look like app errors.

### Next focus (at that time)

- Stabilize production smoke flow.
- Move toward Razorpay or fulfillment slice depending on priority.

---

## 2026-04-25 22:00 (Saturday) — Pilot-Shaping Entry

### Major outcomes completed

- Host stream UX stabilized:
  - host sees local camera viewfinder only,
  - host-side chat/ticker experience improved.
- Commerce control shipped end-to-end:
  - host can open/close purchasing mid-stream,
  - viewer gets simple commerce status pills,
  - buy CTA hidden while commerce is off.
- Viewer UI polish:
  - removed distracting warning noise,
  - profile icon on account action,
  - top-center location notch + icon,
  - viewers pill beside live badge (`K` style),
  - better product-card placement.
- Manual wallet pilot flow shipped:
  - dedicated `/admin/wallet` page,
  - user search + top-up controls,
  - audit-friendly ledger-backed adjustments.
- Purchase flow shipped:
  - reserve -> confirm purchase,
  - atomic wallet debit + order paid + item sold transition,
  - exact low-balance copy: `Wallet cash not enough`.
- Pilot test-user flow shipped:
  - `Login as Ganesh` shortcut,
  - Ganesh cleanup runbook added in `END_OF_GANESH.md`.

### Late-night additions

- Signed wallet adjustments:
  - positive adds funds,
  - negative removes funds,
  - cannot go below zero.
- Viewer wallet pill on stream:
  - tiny wallet icon + current balance in header.
- Extra client-side guard:
  - if wallet is zero/insufficient, purchase flow is blocked early with the same low-funds message.

### Current pilot reality

- Pilot still uses mixed auth paths (Google / skip / Ganesh test), not final production auth.
- Manual wallet flow is intentionally used for 5-10 user pilot simplicity.

### Remaining work (next priority)

1. Authentication hardening
   - finalize login policy (Google only vs Google + phone OTP),
   - disable skip outside dev/pilot,
   - ensure repeat identity/wallet continuity.
2. Onboarding simplification
   - reduce friction in account/address save flow,
   - improve step clarity and UX confidence.
3. Account creation without stream link
   - standalone signup/login path,
   - allow pre-stream account readiness.
4. Reliability polish
   - reserved-item lock countdown visibility,
   - consistent user-friendly error tone.
5. Pilot teardown readiness
   - remove Ganesh shortcuts after final auth launch.

---

## Journal Rule Going Forward

- Do not create new dated journal files unless explicitly needed.
- Add each new session as:
  - `## YYYY-MM-DD HH:mm (Day) — Title`
  - `### Done`
  - `### Decisions`
  - `### Risks / Open Questions`
  - `### Next`

---

## 2026-04-26 01:52 (Sunday) — Host Music + Purchase Audio Stabilization

### Done

- Added purchase sound cues:
  - Host purchase cue now plays uploaded file `web/public/payment done.mp3.mpeg`.
  - Viewer purchase cue remains a soft generated tone.
- Added stream music controls on host live page:
  - `Start song` = play selected song from start with fade-in.
  - `Transition` = jump to middle segment (20-80%) of selected song with fade-out/fade-in.
  - `Stop music` = fade-out + stop + host mic restore.
- Enforced pilot audio policy while music plays:
  - host mic auto-mutes while music is active.
  - fixed music level set to 40% (volume slider removed).
- Added song selection flow:
  - default song is `Masakali`.
  - `Switch song` only changes selected song (does not auto-play).
  - song list auto-loads from `web/public/audio` and supports newly dropped files.
- Added audio tracks API:
  - `GET /api/audio/tracks` returns discoverable music files from `public/audio`.
  - fallback song list added so host UI never initializes to a dead empty state.
- Added reliability fixes:
  - interrupt-safe action handling for Start/Transition/Stop to prevent stuck button states.
  - action timeout watchdog with clean UI recovery.
- Host chat panel UX fixed:
  - in host right panel mode, message composer is always visible at bottom (normal chat behavior).
- Local link reliability cleanup:
  - normalized local app URL back to `http://localhost:3000` to avoid dev cross-origin/HMR host issues.

### Decisions

- Keep purchase success and stream music controls lightweight and operator-first.
- Keep host purchase cue file-based for explicit human-noticeable feedback.
- Keep transition scoped to currently selected song (no random song changes on transition).
- Keep fixed 40% music level for now to reduce runtime control complexity.

### Risks / Open Questions

- Browser media behavior still varies by device; if edge cases remain, add temporary in-panel debug state traces for action step timing.
- Some local logs still show `/api/streams/join 500` intermittently for viewer join flow; separate issue from music controls, worth hardening next.
- If production wants stricter audio consistency, consider moving music track publication and mic mute flow to a dedicated host audio controller module with explicit state machine tests.

### Next

- Optional: add tiny "Now playing mm:ss" readout for host confidence during transition moments.
- Optional: expose a configurable fade profile preset (gentle/normal/fast) once operator flow is stable.
- Keep validating on actual host phone + one viewer device before each live session.

---

## 2026-04-26 02:03 (Sunday) — Admin Link QR (Mobile-First)

### Done

- Added compact QR icon actions next to admin `Copy` + `Open` link controls.
- QR actions are available in both:
  - newly generated stream links (`Your three links`),
  - existing links in `Recent streams`.
- Added a lightweight QR modal overlay that shows:
  - generated QR for the selected URL,
  - link role label (`Viewer`, `Host camera phone`, `Buddy inventory phone`),
  - stream name for session context,
  - full link text.
- Added mobile reliability behavior:
  - tap outside modal (including corners/edges) closes popup,
  - Android/back navigation closes QR first (history state push + popstate handling),
  - body scroll lock while modal is open,
  - `Esc` close support for desktop keyboard fallback.
- Kept visual footprint intentionally minimal so QR action stays present but non-distracting.

### Decisions

- Keep implementation entirely client-side in admin page for fast iteration and no backend migration.
- Use a small icon-only QR trigger to preserve existing control hierarchy (`Copy`/`Open` remain primary).
- Include stream name in QR popup by default to reduce operator confusion during rapid multi-stream handling.

### Risks / Open Questions

- QR image currently uses external QR image generation endpoint; if connectivity is poor, operator may see delayed QR load.
- If stricter offline reliability is needed later, replace external QR source with local in-app QR generation library.

### Next

- Optional: add a small “Download QR” action for sharing in WhatsApp/Telegram when needed.
- Optional: add a tiny “Copied link role + stream name” helper text on QR open for extra confidence in high-speed operations.

---

## 2026-04-26 10:05 (Sunday) — Commerce Always Live + Viewer Product Timing Polish

### Done

- Removed host-side commerce toggling flow; no manual on/off step during live.
  - Host chat panel now shows passive `Shopping live` state.
- Removed backend `commerce_enabled` gate in lock API so buyer reserve flow is always available.
- Updated viewer item rail to keep purchase CTA present by default (no commerce flag dependency).
- Added a per-item **5-second publish countdown** after buddy publish:
  - button shows `Live in 5s ... 1s`,
  - button stays disabled until countdown completes,
  - then switches to normal `Buy now` / `Confirm purchase`.
- Added sold/cancelled product exit polish in viewer:
  - product card animates out (fade + slight scale/translate),
  - CTA changes to `Sold` during exit and is disabled,
  - animation is scoped to product card only (not full-screen).

### Decisions

- Keep shopping always-on to reduce host operational overhead and avoid accidental “buying closed” mistakes.
- Keep publish countdown viewer-side only to preserve host and buddy speed while improving buyer clarity.
- Keep sold animation subtle and localized to item cards for minimal distraction.

### Risks / Open Questions

- Countdown currently uses client-side `created_at` comparison; network/client clock skew can shift perceived seconds slightly.
- If future moderation requires pausing sales globally, we will need a separate hard-stop flag path (different from previous host toggle UX).

### Next

- Optional: move publish countdown duration to a config constant/env for easier pilot tuning.
- Optional: add tiny “just dropped” tag after countdown finishes to encourage immediate purchase action.

---

## 2026-04-28 18:16 (Tuesday) — Music-Reactive Location Pill + Viewer Sync

### Done

- Added host-to-viewer music state sync via LiveKit data packets:
  - host publishes `{ type: "jini-music", playing: boolean }` when music starts/stops.
  - viewer listens inside the live room and updates UI state.
- Added viewer music pulse context and provider:
  - `web/lib/stream/viewer-music-pulse-context.tsx`
  - wrapped `LiveRoomShell` with provider while preserving existing viewer logic.
- Added viewer listener component:
  - `web/components/stream/viewer-livekit-music-listener.tsx`
  - wired into `LiveVideoStage` so music activity is detected from remote host data.
- Added subtle rhythmic animation on the viewer location pill (`Sarojini Market`) when host music is active.
  - animation is intentionally low-intensity and tasteful.
  - respects `prefers-reduced-motion` by disabling motion for accessibility.
- Fixed a TypeScript compatibility issue in viewer item polling promise handling (`PromiseLike` path) while implementing these changes.

### Decisions

- Use explicit host data messages instead of trying to infer state from audio levels/tracks for deterministic UI behavior.
- Keep effect viewer-only and scoped to the location pill to avoid distracting the full screen.
- Keep animation rhythm steady and subtle (not aggressive beat visualization) to preserve stream readability.

### Risks / Open Questions

- If host data packets are missed during reconnect edge cases, viewer pulse might briefly desync until next state packet.
- If we add multiple host-side audio modes later, we may want to extend packet schema to include source/type metadata.

### Next

- Optional: send periodic heartbeat packets while music is playing for stronger reconnect recovery.
- Optional: expose one “pulse intensity” setting in code constants for rapid live-tuning.

