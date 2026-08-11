# Jini MVP — Whitebox Security Report

**Target:** [`vagdotdev/jini-mvp-web`](https://github.com/vagdotdev/jini-mvp-web)  
**Scope:** Full source (whitebox). No live blackbox against production.  
**Date:** 2026-08-12  
**Method:** Cursor agent whitebox review (attack-surface map → code-backed findings → fix PRs).

---

## Executive summary

Jini’s real ACL is **not** `profiles.role`. It is:

1. Supabase session (viewers)
2. Unguessable `host_token` / `buddy_token` URLs
3. Shared header secret `JINI_STREAM_CREATE_SECRET` for admin

Almost every mutating API uses the **Supabase service role** after a thin app check. If that check fails open, an attacker gets full DB power (wallet credit, PII export, stream wipe, capability token leak).

**Highest risk in production if secrets are unset:** open admin + open cron + unsigned Razorpay webhook + public Ganesh account provisioner.

---

## Findings

### CRITICAL

#### C1 — Admin APIs fail-open when `JINI_STREAM_CREATE_SECRET` is unset
- **Locations:** `web/app/api/streams/route.ts`, `web/app/api/admin/wallet/topup/route.ts`, `web/app/api/admin/orders/route.ts`, `web/app/api/admin/users/route.ts`, `web/app/api/streams/[slug]/status/route.ts`, `web/app/api/livekit/debug/route.ts`
- **Pattern:** `if (!required) return true;`
- **Attacker:** Anyone who can hit the deployed origin.
- **Impact:** Create/list streams and **leak host/buddy URLs**, credit/debit wallets, export buyer PII (phone/email/shipping), end all streams / wipe related rows.
- **Confidence:** confirmed (source)

#### C2 — Unauthenticated Ganesh pilot backdoor
- **Locations:** `web/app/api/dev/login-as-ganesh/route.ts`, `web/lib/dev/ganesh.ts`, `web/components/auth/login-button.tsx`
- **Attacker:** Unauthenticated POST to `/api/dev/login-as-ganesh`, then password login with hardcoded `ganesh@jini.test` / `ganesh-pilot-test` (also shipped in the client bundle).
- **Impact:** Guaranteed test account with known password; admin can top up wallet → free purchases in pilot commerce.
- **Confidence:** confirmed (source)

#### C3 — Cron lock-release fail-open when `JINI_CRON_SECRET` unset
- **Location:** `web/app/api/items/release-expired-locks/route.ts`
- **Impact:** Anyone can force lock/order expiry mutations via service-role path.
- **Confidence:** confirmed (source)

---

### HIGH

#### H1 — Razorpay webhook accepts unsigned events when secret unset
- **Location:** `web/app/api/payments/razorpay/webhook/route.ts`
- **Impact:** Today mostly log-only, but any future fulfillment on this path becomes forgeable payment confirmation.
- **Confidence:** confirmed (source)

#### H2 — LiveKit viewer JWT issued from public slug alone
- **Location:** `web/app/api/livekit/token/route.ts`
- **Impact:** Anyone who knows/guesses a stream slug gets a subscribe token without joining/onboarding. Bypasses room access intent.
- **Confidence:** confirmed (source)

#### H3 — `commerce_enabled` not enforced on lock/buy
- **Location:** `web/app/api/items/lock/route.ts` (and purchase path that assumes lock)
- **Impact:** Host “commerce off” is UI-only; buyers can still lock items via API.
- **Confidence:** confirmed (source)

---

### MEDIUM

#### M1 — Client can upsert `profiles.role`
- **Location:** `web/components/auth/onboarding-form.tsx` + RLS update-own without column guard
- **Impact:** Dormant today (APIs ignore `profiles.role`), but any future code that trusts DB role becomes an instant privilege escalation.
- **Confidence:** likely

#### M2 — Capability tokens in URLs
- **Locations:** `/host/[token]`, `/companion/[token]`, admin list APIs
- **Impact:** Tokens leak via Referer, screenshots, logs, shared links. By design for MVP, but high blast radius — treat as long-lived bearer secrets.
- **Confidence:** confirmed (design risk)

#### M3 — Auth callback `next` redirect
- **Location:** `web/app/auth/callback/route.ts`
- **Impact:** Open-redirect within origin if not path-validated (phishing / token fixation adjacent).
- **Confidence:** needs-runtime (verify path allowlist)

---

### LOW / notes

- Razorpay verify route does not fulfill orders yet (reduces H1 blast radius today).
- Storage bucket `item-images` is public-read by design.
- No Server Actions; surface is App Router APIs + middleware + browser Supabase.

---

## Fix plan (PR loop)

| PR | Fixes |
|----|--------|
| #1 Fail-closed secrets | C1, C3, H1 — shared auth helper; require secrets; reject unsigned webhooks |
| #2 Kill pilot backdoor in prod | C2 — gate Ganesh API + UI; keep password out of prod client path |
| #3 Access control hardening | H2, H3, M1 — LiveKit session+access, enforce commerce, role trigger |

---

## Out of scope this pass

- Live blackbox against `sarojini.shop`
- Host/buddy token rotation / binding to sessions
- Full Razorpay fulfillment implementation
- Dependency CVE hunting
