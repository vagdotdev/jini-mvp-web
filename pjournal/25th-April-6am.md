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
