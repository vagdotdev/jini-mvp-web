# Jini Live — architecture & status map

Use this file in GitHub, VS Code (Mermaid preview), or paste into [mermaid.live](https://mermaid.live).

---

## 1) System overview (what talks to what)

```mermaid
flowchart TB
  subgraph clients["Clients"]
    VW[Viewer web]
    HW[Host web]
    BW[Buddy web]
    AW[Admin web]
  end

  subgraph next["Next.js app (web/)"]
    PGS[Pages: welcome / onboard / live / host / companion / admin / account]
    API[Route handlers /api/*]
  end

  subgraph supa["Supabase"]
    AUTH[Auth: Google + anonymous]
    PG[(Postgres: streams items orders chat access profiles wallet)]
    RLS[RLS policies]
    RT[Realtime subscriptions]
    OBJ[Storage: item-images bucket]
  end

  subgraph lk["LiveKit Cloud"]
    ROOM[WebRTC room per stream]
  end

  subgraph pay["Payments (future)"]
    RZ[Razorpay]
  end

  VW --> PGS
  HW --> PGS
  BW --> PGS
  AW --> PGS
  PGS --> API
  PGS --> RT
  API --> PG
  API --> OBJ
  API --> ROOM
  API -.->|not wired in UI yet| RZ
  AUTH --- PG
  RLS --- PG
```

---

## 2) Viewer journey (happy path)

```mermaid
flowchart LR
  W[Welcome page] --> O[Onboarding: login + profile + join stream]
  O --> L[Live: video + product rail + chat + reserve]
  L --> ACC[Account page]

  W -.- wnote["✓"]
  O -.- onote["✓"]
  L -.- lnote["✓"]
  ACC -.- anote["✓"]
```

---

## 3) Done vs remaining (checklist style)

Legend: **✓** = implemented in this repo (may still need your keys / deploy). **☐** = not done / empty for you to fill as you prioritize.

```mermaid
flowchart TB
  subgraph DONE["✅ Done (in codebase)"]
    direction TB
    d1["Core schema + RLS + migrations 001–004 ✓"]
    d2["Stream create / join / slug metadata ✓"]
    d3["Buddy: publish / list / remove items, cap 4 ✓"]
    d4["Image URL + upload to Supabase Storage ✓"]
    d5["Viewer live: LiveKit video + product rail realtime ✓"]
    d6["Reserve item lock + pending order + hold message ✓"]
    d7["Release expired locks API + heal-on-lock ✓"]
    d8["Chat via server API + display names (no phone in chat) ✓"]
    d9["Google + Skip Google (anon) auth ✓"]
    d10["Admin: links + recent streams + mark live / end ✓"]
    d11["Mobile: chat drawer + horizontal rail + safe areas ✓"]
    d12["Welcome / onboarding copy + touch-friendly forms ✓"]
    d13["Account page + wallet tables (balance display) ✓"]
    d14["Razorpay: create-order / verify / webhook stubs ✓"]
  end

  subgraph LEFT["☐ Remaining (empty — fill as you go)"]
    direction TB
    l1["☐"]
    l2["☐"]
    l3["☐"]
    l4["☐"]
    l5["☐"]
    l6["☐"]
    l7["☐"]
    l8["☐"]
  end
```

### Suggested labels for the empty `☐` boxes (copy into your roadmap)

| Slot | Typical next work |
|------|-------------------|
| `l1` | Razorpay Checkout on “Yours” + mark order paid + item sold |
| `l2` | Wallet top-up from payment + ledger writes |
| `l3` | Hosted **deploy** (Vercel etc.) + env + domain |
| `l4` | **Cron** calling release-expired-locks every minute |
| `l5` | Order history / “my reservations” UI |
| `l6` | Inline edit profile & multiple addresses |
| `l7` | Moderation: slow mode, ban, link filtering |
| `l8` | Analytics, error monitoring (e.g. Sentry), rate limits |

To turn a slot into a visible node in Mermaid, replace `" "` with e.g. `["Razorpay checkout UI ☐"]`.

---

## 4) API surface (mental model)

```mermaid
flowchart LR
  subgraph public["Public / session"]
    A1["GET /api/streams/:slug"]
    A2["POST /api/streams/join"]
    A3["POST /api/chat"]
    A4["GET /api/account"]
    A5["GET /api/livekit/token"]
  end

  subgraph secret["Secrets / tokens"]
    B1["POST /api/streams (+ admin header)"]
    B2["POST /api/items (buddy_token)"]
    B3["GET/DELETE /api/items…"]
    B4["POST /api/items/upload"]
    B5["POST /api/items/lock"]
    B6["POST /api/streams/:slug/status"]
    B7["POST/GET /api/items/release-expired-locks"]
  end

  subgraph pay2["Payments (stub)"]
    C1["POST …/razorpay/create-order"]
    C2["POST …/razorpay/verify"]
    C3["POST …/razorpay/webhook"]
  end
```

---

*Generated for the Jini MVP web app. Edit `LEFT` nodes as you ship features.*
