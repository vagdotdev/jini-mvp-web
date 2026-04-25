# Jini Live Project Brief

## What We Are Building

Jini Live is a web-first live shopping platform designed for markets like Sarojini, where products are unique, fast-moving, and often one-off (no traditional SKU inventory).

The goal is simple and practical:
- Go live from market.
- Show products in real time.
- Let viewers buy instantly.
- Accept payment safely.
- Generate a clean delivery log for manual fulfillment.

This is not a "fun demo" project. It is being designed as a real operating system for live commerce.

## Core Business Outcome

Jini should allow a host to run a high-speed live selling session without pre-buying stock:
- Host finds product in market.
- Buddy lists it immediately.
- Buyer pays first and wins.
- Host now has confirmed money and can pay shopkeeper.
- System logs exactly who bought what for delivery.

This creates:
- Zero inventory risk.
- Faster cash flow.
- Better conversion than DMs/manual workflows.

## Product Model (Zoom-Style Link Workflow)

From one `Create Stream` action, Jini generates three links:

1. `viewer_url` (public)
   - Sent to audience.
   - Opens welcome page, then login/address capture, then stream + buy interface.

2. `host_url` (private)
   - Used on host phone.
   - Starts camera livestream and controls stream state.

3. `buddy_url` (private)
   - Used on second phone (companion).
   - Adds products quickly (photo + name + price) to live feed.
   - **Optional:** AI “UGC-style” thumbnail — toggle on to generate a lifestyle image of a model wearing the item from the buddy’s hanger/in-hand photo; preview with **Accept** or **Cancel** before publish. Toggle off uses the direct photo only (fastest pilot path).

This creates a two-phone operation:
- Phone 1 = camera/host
- Phone 2 = inventory buddy

## User Roles

- **Host (Broadcaster)**: focuses on bargaining, showing products, and engagement.
- **Buddy (Companion)**: publishes products into the live feed in seconds.
- **Viewer (Buyer)**: watches stream, chats, buys item, receives delivery.
- **Admin/Ops**: creates streams, monitors sessions, exports shipping log.

## Core Product Flow

1. Create stream in control panel.
2. Share host/buddy/viewer links.
3. Host starts stream.
4. Viewers join via browser (laptop/mobile), login, save details.
5. Buddy adds item from hidden page.
6. Item appears instantly to all viewers.
7. First buyer taps buy and gets temporary lock.
8. Buyer pays via UPI flow.
9. On verification, item is marked sold and removed from live rail.
10. Order goes to buyer "My Bags" and admin "Master Sales Log."
11. End of stream: export report and fulfill manually.

## Experience We Want (Visual + Vibe)

The product vibe is modern live commerce:
- Large livestream viewport (especially optimized for landscape/laptop viewing).
- Active chat pane with social proof ("just purchased").
- Real-time product tile cards that appear while stream is live.
- "Buy now" action with urgency and clarity.
- Clear state transitions (`Live`, `Locked`, `Sold`).

## UI Direction from Reference Screens

Based on the shared reference UI style, Jini should follow these presentation principles:

- **Immersive video-first canvas**: stream remains the dominant visual element.
- **Top overlay identity**: brand name, host identity, live badge, viewer count, and location cluster near top.
- **Right-side social rail (desktop)**: chat panel with clear chronology and purchase callouts.
- **Bottom commerce rail**: active product cards pinned near bottom-left/bottom area with strong `Buy now` CTA.
- **Live context signals**: subtle animations/states for new product drops, sold events, and lock countdown.
- **Minimal friction controls**: volume/fullscreen/chat toggle should be obvious but low visual noise.

### Product Tile UX Requirements

- Item card contains image, title, live price, old/reference price (optional), size line if you collect it (optional field later), and primary buy action.
- Reference mocks often show a **model wearing the item** on the card; that image may be **AI-generated** from the real garment photo for conversion. When AI is used, optionally show a small **“AI styled”** label for transparency.
- Sold/locked labels are visually unmissable.
- Item card transitions:
  - `active`: buy enabled
  - `locked`: timer visible, buy disabled for others
  - `sold`: removed from live rail and reflected in chat/social proof

### Chat UX Requirements

- Chat must support normal messages plus system-generated purchase events.
- Purchase events should be highlighted differently from normal comments.
- Input should stay pinned and usable even on smaller screens.
- Chat send latency should feel near-instant during active sessions.

## Non-Negotiables (Pilot)

- Stream should remain stable for 60-90 minutes.
- Buddy should publish an item in under 10 seconds.
- Checkout after buy click should complete rapidly (target under 30 seconds).
- No duplicate sale of one item.
- End-of-day report should include:
  - Buyer name
  - Phone
  - Shipping address
  - Item details
  - Amount
  - Payment status

## Tech Stack (Chosen)

- **Frontend**: Next.js (web-first, laptop and mobile browser friendly)
- **Auth + Database + Realtime**: Supabase
- **Video**: LiveKit (low-latency WebRTC)
- **Payments (MVP)**: Direct UPI flow (intent/QR style with verification)
- **Storage**: Supabase Storage for item images
- **Optional AI styling**: Google AI (Gemini / Vertex / Imagen-class — exact model chosen at implementation) via **server-only** API route; never expose API keys in the browser.

## Device and Size Strategy (Laptop First, Mobile Ready)

Launch priority is laptop-first viewing, but architecture and UI must be responsive from the start.

### Phase 1 (Laptop-First)

- Optimize stream page for landscape desktop widths.
- Use a two-column layout:
  - large video zone
  - persistent chat/product interaction zone
- Ensure product purchase flow remains one-click + payment handoff.

### Phase 2 (Mobile Web)

- Support portrait layout where video remains top priority.
- Convert side panels into stacked or tabbed layers:
  - video
  - products
  - chat
- Keep buy button thumb-friendly and always reachable.
- Preserve speed mechanics on mobile:
  - quick login
  - lock countdown
  - fast payment transition

### Cross-Device Rules

- Core flows and states must be identical across laptop and mobile.
- No feature should exist only on one form factor for buy-critical actions.
- Real-time state sync must remain consistent on all devices.
- Performance budget should prioritize low-latency interactions over visual effects.

## Why This Is Feasible

Yes, this is technically feasible today with the chosen stack:
- Realtime item updates are achievable with Supabase Realtime.
- Low-latency live interactions are achievable with LiveKit.
- Fast UPI checkout flows are practical on web (mobile intent + desktop QR fallback).
- Race condition handling can be solved using server-side lock transactions.

## How Fast Live-Commerce Apps Sell in Seconds

Fast-selling platforms do not rely on magic. They optimize these mechanics:
- User identity/address already saved before product drop.
- Minimal checkout steps at decision time.
- First-come lock to prevent double-selling.
- Clear and immediate state changes in UI.
- Quick payment handoff and reliable backend verification.

Jini adopts these same principles.

## Data Model (Core Entities)

- `profiles`: user identity + phone + shipping + role
- `live_streams`: stream metadata and status
- `stream_items`: per-item lifecycle during stream; stores `image_display_url` (what buyers see) and optionally `image_raw_url` (source photo) plus `image_variant` (`direct` | `generated`) when AI styling is used
- `orders`: payment and purchase records
- `chat_messages`: live chat
- `shipping_log`: operational fulfillment data

### Key Item States

- `active`: available to buy
- `locked`: temporarily reserved for first buyer
- `sold`: paid and allocated
- `expired`: timed out/released

### Key Order States

- `pending`
- `paid`
- `failed`
- `refunded`

## Race Logic (First-to-Pay Wins)

- Buyer click triggers server lock for 2 minutes.
- While locked, others cannot buy.
- If payment is verified in time -> item becomes `sold`.
- If not paid in time -> lock expires and item returns `active`.

All state transitions happen server-side (not trusted to frontend).

## Payment Reliability Policy

- Payment success should be confirmed via gateway callback/status verification.
- Screenshot proof is not source of truth.
- If callback is delayed, buyer sees "verifying" state.
- Item is sold only after verified payment status.

## Security and Access Control

- Viewer link is public, but buy/chat actions require login.
- Host and buddy links are private/tokenized.
- Database uses row-level access control (RLS) by role.
- Admin-only pages are access restricted.

## Live Session Runbook (Operations)

### Pre-Live (15 minutes before)
- Host checks camera/mic/network.
- Buddy opens companion link and tests one product publish.
- Team runs one test login and test purchase path.

### During Live
- Host sells and entertains.
- Buddy continuously publishes products.
- Optional moderator helps chat and support.

### Purchase Moment
- Lock starts immediately for first buyer.
- Verified payment marks sold instantly.
- Sold item disappears from buy rail.

### Post-Live
- Export master sales/shipping report.
- Pack by report.
- Mark packed/dispatched statuses.

## Risks and Mitigations

1. Weak market network
   - adaptive video quality + lightweight buddy form
2. Buddy overload
   - only 3 mandatory actions: photo, name, price
3. Payment confusion
   - explicit item/payment states in UI
4. Fraud/spam
   - auth-gated purchase + rate limits
5. Fulfillment mistakes
   - one canonical shipping log from paid orders
6. AI image generation (if enabled)
   - latency and cost: default toggle off for pilot; timeouts and fallback to raw photo
   - trust: optional on-card disclosure; constrained prompts (no free-text from buddy in v1)

## Build Plan (Execution Sequence)

1. Project setup and environment
2. Auth + profile onboarding (phone/address)
3. Database schema + constraints + RLS
4. Stream control page (Create Stream -> 3 links)
5. Host page (camera stream controls)
6. Buddy page (publish products)
7. Optional: Buddy AI thumbnail (toggle, generate, preview, accept/cancel, dual image URLs)
8. Viewer page (watch, chat, buy)
9. Lock APIs (2-minute reservation)
10. Payment verification + sold transition
11. My Bags + Master Sales Log
12. Lock expiry automation
13. Pilot rehearsal (20 item mock run) + fixes

## Acceptance Criteria for Pilot

- Host, buddy, and viewer links all work in same session.
- Real-time item publish appears quickly for all viewers.
- No item can be sold twice.
- Lock expiry correctly reopens unpaid items.
- Paid items move to buyer history and admin log.
- End-of-day shipping log is accurate and usable.

## What Happens Next

Once implementation begins, development will be run as guided execution:
- Every step explained in plain language.
- What is being built and why.
- What you need to do at each checkpoint.
- What to test before moving to next phase.

The build will be handled end-to-end with clear milestone updates.

