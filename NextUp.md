# NextUp — Jini direction & what comes after the pilot

**Last updated:** 4 July 2026  
**Status:** Deliberate **Wizard of Oz** — ops-heavy, admin-gated, manually run. That is intentional for now.  
**Audience:** Future you (or anyone picking this up cold). Read `README.md` + `pjournal/Pjournal.md` first for technical baseline; this file is the *why* and *what next*.

---

## TL;DR

Jini started as a Sarojini live-shopping MVP. The engine works. What changed is the **market**: Instagram is banning thrift sellers who do commerce through DMs and payment screenshots. Live streaming is a real escape hatch — one link, watch, buy, no DM ping-pong.

The product opportunity is no longer “cool live shopping experiment.” It is **infrastructure for sellers Instagram is kicking off the platform**.

Right now the app is deliberately run like Wizard of Oz: you (ops) create streams, top up wallets, export orders. Sellers and buyers never see a polished “start your live shop” experience. **That is correct for the current phase.** The next phase is a friendly, self-serve front door — without throwing away the live engine underneath.

---

## What triggered this update

After the first original Jini stream, several thrift sellers reached out (DMs, replies). Their message was consistent:

> Instagram is banning people who sell through DMs — transaction photos, UPI screenshots, back-and-forth in chat. It feels random. Accounts go away.

That pain is structural, not anecdotal. Thrift and surplus fashion sellers often:

- Have no formal catalog or SKU system
- Sell one-off pieces in real time
- Close deals in DMs with payment proof
- Depend on Instagram for discovery *and* checkout

When Meta cracks down on off-platform commerce signals, **their entire workflow breaks**. They lose discovery *and* transaction rails at once.

Live streaming solves a specific slice of that:

| DM commerce (broken) | Live commerce (Jini-shaped) |
|----------------------|-----------------------------|
| Async, screenshot-heavy | Synchronous, in-stream |
| Looks like “evasion” to platforms | Public showcase + structured checkout |
| Trust built in private chat | Trust built on camera + chat + social proof |
| Seller types the same answers 50× | One stream, many buyers at once |
| No order log | Paid orders + shipping export |

This is not a nice-to-have UX improvement. For this cohort, **live is survival infrastructure**.

---

## Product thesis (hold onto this)

**Live streams are to sellers what coding agents are to developers.**

- Developers: less friction from idea → shipped code  
- Sellers: less friction from “I found this piece” → “someone paid for it”

The social layer is not decoration. It *is* the conversion engine:

- Show the garment on a real person, in real light, in real time  
- Answer “will it fit?” once, publicly, for everyone  
- Create urgency when a drop appears on the rail  
- Replace the DM negotiation loop with a single shared moment  

Jini’s job is to collapse that loop into: **post link → join → watch → buy → done**.

---

## Where the codebase stands today

### What actually works (the engine)

The core live-commerce loop is built and pilot-tested. See `web/docs/JINI-LIVE-MAP.md` for architecture; see `pjournal/Pjournal.md` for session history (note: journal last updated ~28 April 2026 — git continued with UI/stability work through early June).

**Operational loop today:**

1. Ops opens `/admin`, enters create secret, creates a stream  
2. Three links: **viewer** (public), **host** (camera phone), **buddy** (inventory phone)  
3. Host goes live via LiveKit; buddy publishes items (photo + name + price)  
4. Viewers join, chat, reserve items, confirm purchase  
5. **Pilot payments:** admin manually tops up buyer wallets at `/admin/wallet`; purchase debits wallet atomically  
6. End of stream: `/admin/orders` + CSV export for fulfillment  

**Stack:** Next.js 16 (`web/`), Supabase (auth, Postgres, realtime, storage), LiveKit (video), Tailwind. Razorpay API routes exist as stubs — not wired to buyer UI.

**Production:** Vercel, target domain `https://www.sarojini.shop`. Root directory must be `web/`.

### What it feels like to use (honest)

| Persona | Experience today |
|---------|-------------------|
| **Ops / you** | Admin dashboard, secrets, wallet top-ups, CSV export — workable, deliberate |
| **Host** | Token link → camera viewfinder, music controls, chat ticker — good enough for pilot |
| **Buddy** | Token link → fast publish form — good enough for pilot |
| **Buyer** | Stream link → welcome → onboarding → live room → buy — functional, recently polished (neo-brut UI, mobile fixes) |
| **New thrift seller (Instagram refugee)** | **No front door.** No “welcome, start your live shop.” No self-serve. Would bounce or need hand-holding |

That last row is the gap — and it is **known and intentional** right now.

---

## Wizard of Oz — deliberate, not accidental

**Wizard of Oz** here means:

- **You** are behind the curtain: create streams, fund wallets, run fulfillment, fix env issues  
- **They** see the magic: a live link, a stream, items appearing, buy button, confirmation  
- The product *looks* like a live shop to buyers; the *operations* are still manual for sellers  

Why this was the right call for the Sarojini pilot:

- Prove the loop end-to-end with 5–10 known buyers before optimizing onboarding  
- Avoid Razorpay/KYC delays (wallet = controllable)  
- Learn host + buddy choreography in a real market before simplifying roles  
- Keep blast radius small when things break  

**Do not mistake “admin dashboard” for “wrong product.”** It is the correct control plane for WoZ. The mistake would be *stopping* at WoZ when the market is ready for more.

### WoZ signals you are still in this phase

- [ ] Stream creation requires `JINI_STREAM_CREATE_SECRET` and `/admin` literacy  
- [ ] Buyer payments are manual wallet top-ups, not self-serve UPI/card  
- [ ] “Login as Ganesh” and skip-auth still exist for pilot speed  
- [ ] Lock expiry cron may not be scheduled (API exists; ops must verify)  
- [ ] Fulfillment is CSV export, not dispatch lifecycle  
- [ ] Seller never gets a dashboard — only three links handed to them by ops  

When most of these are unchecked, you are still in WoZ. That is fine.

---

## The shift: from Sarojini pilot → seller platform

### Old framing

> “Live shopping MVP for Sarojini Nagar — host in market, buddy lists, viewers buy.”

Still true technically. Too narrow strategically.

### New framing

> **“Live shop for sellers Instagram is banning — one link, no DMs, real checkout.”**

Same engine. Different front door. Different GTM. Different onboarding.

### Target seller journey (future — not built yet)

This is the experience to design toward. Nothing here requires immediate build; it is the north star.

```
1. Seller lands on jini (from Instagram bio, referral, or ad)
      ↓
2. "Start your live shop" — sign up (Google / phone), minimal profile
      ↓
3. One primary link to post on Stories / Reels / bio
   ("Join my live shop" — viewers use this)
      ↓
4. Seller goes live from phone (host flow — maybe solo, maybe + buddy)
      ↓
5. Viewers join, watch, chat, buy (no app download)
      ↓
6. Stream ends → seller sees orders + addresses → ship
      ↓
7. Repeat next drop
```

**Key UX principle from `OPEN_FLOODGATES.md`:** keep watch access open; put the account wall at purchase intent. Do not gate the stream behind signup until someone taps Buy.

### What “friendly and nice” actually means (concrete)

Not vague polish. Specific surfaces:

| Surface | WoZ today | Friendly future |
|---------|-----------|-----------------|
| Entry | `/admin` + secret | `/start` or `/sell` — “Create your live shop” |
| Links | Three links (viewer/host/buddy) explained by ops | One **share link** for Instagram; host/buddy setup guided in-app |
| Payments | Admin wallet top-up | Razorpay UPI/card at buy time (or seller-connected payout later) |
| Auth | Mixed pilot paths | Google (+ phone OTP decision); no skip in prod |
| Post-stream | CSV from admin | Seller-facing “Your orders” + export |
| Trust | “Some guy sent me a link” | Seller profile, past streams, optional replay hooks |

---

## Market context — why timing matters

Instagram enforcement on DM commerce is not a Jini bug or feature request. It is **demand generation**:

- Sellers are actively looking for alternatives *now*  
- They already understand “go live” from IG Live muscle memory  
- They do not want a Shopify setup — they want **speed and social**  
- First mover who makes “post link → live → buy” dead simple wins mindshare  

Jini does not need to replace Instagram for discovery. It needs to replace Instagram for **transaction and trust** once someone is interested.

**Positioning line (draft):**  
*“Stop selling in DMs. Go live. One link. Get paid.”*

---

## Gap analysis — engine vs front door

### Keep (do not rebuild)

- LiveKit host/viewer video path  
- Buddy publish flow (photo, name, price, realtime rail)  
- Item lock → confirm purchase → sold state machine  
- Supabase schema, RLS, wallet RPCs (pilot), chat  
- Admin ops panel (becomes internal/super-admin later, not deleted)  
- Race logic, 5s publish countdown, commerce-always-on  

### Build next (priority-ordered)

#### Phase A — Still WoZ, but safer ops (low UI, high reliability)

*Goal: run another pilot or first external seller without embarrassing failures.*

1. **Schedule lock expiry** — cron hits `/api/items/release-expired-locks` every minute (`JINI_CRON_SECRET`)  
2. **Observability light** — Sentry or structured error logging on viewer live + purchase paths  
3. **Rate limits** — chat, publish, lock endpoints  
4. **Journal catch-up** — document May–June UI/stability work in `pjournal/Pjournal.md`  
5. **Pre-stream buyer onboarding** — standalone `/login` exists; ensure wallet can be topped before stream starts (admin needs user IDs — document the flow)  

Ref: `areas-for-improvement-sun-may-3.md`, `POST_STREAM_FULFILLMENT.md`

#### Phase B — Graduate one seller off pure WoZ (first “friendly” slice)

*Goal: one thrift seller can run a stream without you creating links manually.*

1. **Seller signup** — minimal account, not tied to a stream URL  
2. **Self-serve stream create** — seller clicks “Go live” → generates share link + host setup  
3. **Hide the three-link complexity** — default to one viewer link; host/buddy as “setup steps” inside app  
4. **Razorpay happy path** — replace wallet for real buyers: create order → pay → webhook → sold  
5. **Seller post-stream view** — paid orders + addresses (not admin-only CSV)  

Ref: Razorpay stubs in `web/app/api/payments/razorpay/*` — fulfillment still TODO in verify route

#### Phase C — Instagram-native GTM (growth)

*Goal: sellers post about drops; buyers convert in one tap.*

1. **Share assets** — OG preview, Story-friendly copy, optional QR on seller page  
2. **Fast onboard at buy** — 60-second Google + address when they tap Buy (see `OPEN_FLOODGATES.md`)  
3. **Solo seller mode** — one phone: host publishes items themselves (no buddy) for smaller sellers  
4. **Dispatch lifecycle** — packed → shipped, buyer notification (WhatsApp later)  
5. **Remove pilot shortcuts** — Ganesh, skip login (`END_OF_GANESH.md`)  

#### Phase D — Differentiation (later)

- AI product styling (buddy toggle exists; API returns 501 — `web/app/api/images/style-product/route.ts`)  
- Multi-stream seller dashboard, analytics, repeat buyer CRM  
- Payouts to sellers (marketplace economics — hard, do not rush)  

---

## Open decisions (write answers here when you decide)

| Question | Options | Decision |
|----------|---------|----------|
| Canonical auth | Google only vs Google + phone OTP | _TBD_ |
| Pilot payments | Keep wallet vs switch to Razorpay test mode | _TBD_ |
| Seller roles | Always host+buddy vs solo seller mode | _TBD_ |
| First external seller | Hand-held WoZ vs self-serve Phase B | _TBD_ |
| Domain story | sarojini.shop vs broader brand name | _TBD_ |
| Pricing model | Free pilot vs take rate vs subscription | _TBD_ |

---

## What not to do yet

- **Do not** rip out the admin dashboard — it becomes ops/super-admin  
- **Do not** chase AI styling before Razorpay + seller onboarding — conversion > pretty cards  
- **Do not** build a native app — web-first is the wedge (no download friction)  
- **Do not** open floodgates (`OPEN_FLOODGATES.md`) before one non-WoZ seller completes a full stream cleanly  
- **Do not** assume Sarojini-only — thrift sellers everywhere share the same Instagram pain  

---

## Suggested “pick up later” checklist

When you return to this repo:

- [ ] Read this file  
- [ ] Skim latest git log: `git log --oneline -20`  
- [ ] Confirm prod smoke: `/admin` create stream → viewer/host/buddy links → one test purchase  
- [ ] Confirm Supabase migrations 001–008 applied (especially 006–007 wallet)  
- [ ] Decide: **another WoZ pilot** vs **start Phase B (seller self-serve)**  
- [ ] If external seller incoming: pre-create their account, top up test wallet OR enable Razorpay test mode first  
- [ ] Update `pjournal/Pjournal.md` with whatever you ship  

---

## Related docs (do not duplicate — link out)

| File | Use for |
|------|---------|
| [README.md](./README.md) | Repo entry, pilot plan, prod URLs |
| [JINI_LIVE_PROJECT_BRIEF.md](./JINI_LIVE_PROJECT_BRIEF.md) | Original product spec, roles, acceptance criteria |
| [pjournal/Pjournal.md](./pjournal/Pjournal.md) | Session-by-session build log |
| [web/docs/JINI-LIVE-MAP.md](./web/docs/JINI-LIVE-MAP.md) | Architecture diagrams, API map |
| [OPEN_FLOODGATES.md](./OPEN_FLOODGATES.md) | Post-pilot growth vision |
| [POST_STREAM_FULFILLMENT.md](./POST_STREAM_FULFILLMENT.md) | Fulfillment spec (partially built) |
| [END_OF_GANESH.md](./END_OF_GANESH.md) | Remove pilot test user when going prod |
| [areas-for-improvement-sun-may-3.md](./areas-for-improvement-sun-may-3.md) | Technical debt audit |

---

## One paragraph to leave on the table

Instagram is deleting DM thrift commerce. Live streaming is the obvious replacement — social, synchronous, show-don't-tell. Jini already has the hard part built: video, realtime items, locks, checkout, orders. What it does not have yet is a **front door a banned seller can walk through without you.** That is deliberate Wizard of Oz, and it worked for the first stream. The next chapter is making the curtain optional: friendly onboarding, one link for Instagram, real payments, seller-facing order view — same engine, new skin, real market timing.

---

*When this doc goes stale, append a dated section at the bottom — do not spawn another strategy file.*
