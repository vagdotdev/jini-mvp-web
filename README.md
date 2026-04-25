# Jini MVP Web

Live shopping MVP: Next.js app in **`web/`**, product brief and journal at repo root.

---

## What this project is and why it exists

Jini is being built specifically for **Sarojini Nagar** — a large open-air and semi-covered fashion market in **South Delhi, India**. Sarojini is one of the best-known cheap fashion destinations in the country. It sells factory surplus, export overruns, and one-off pieces. Nothing is catalogued. Stock is chaotic, high-turnover, genuinely non-repeatable. Prices are negotiated on the spot with individual shopkeepers.

**The problem:** Online buyers cannot browse an inventory that doesn't exist, and traditional e-commerce (list → cart → checkout) requires pre-held stock. Sarojini sellers don't do that.

**What Jini does instead:**

- Host physically goes to Sarojini with a phone.
- A second phone (buddy) lists items in real time as the host finds and negotiates them with shopkeepers.
- Remote viewers watch live, see items appear as they're found, and buy instantly.
- The host only pays the shopkeeper **after** a confirmed buyer has paid. No pre-buy, no inventory risk.
- End of session: clean order log → manual fulfillment → dispatch.

This model only works with live video + real-time item state + fast checkout. That is exactly what this system is built to do.

---

## Pilot plan

The first live run is a **small controlled test: ~5–10 known buyers, real items, real purchases from Sarojini**.

**Payment for the pilot is wallet-based, not Razorpay/UPI:**
- Admin manually tops up each buyer's in-app wallet before the stream (via `/admin/wallet`).
- When a buyer confirms a purchase, their wallet is debited atomically.
- No payment gateway setup required, no KYC delays, fully controllable for a small group.

Razorpay (UPI + card) replaces this after the pilot validates the core flow end-to-end.

---

## Production

- **Live URL:** `https://www.sarojini.shop`
- **Vercel project:** `vagdevs-projects/web` (root directory must be `web/`)
- **Supabase migrations** — these must be applied in the Supabase project SQL editor if not already done:
  - `web/supabase/migrations/006_wallet_ops.sql` — wallet RPCs
  - `web/supabase/migrations/007_wallet_negative_adjustments.sql` — signed adjustments (negative allowed, floor at zero)

---

- **Product brief:** [JINI_LIVE_PROJECT_BRIEF.md](./JINI_LIVE_PROJECT_BRIEF.md)
- **Run the app:** [web/README.md](./web/README.md)
- **Project journal (single source):** [pjournal/Pjournal.md](./pjournal/Pjournal.md)
- **Deploy (Vercel):** [VERCEL.md](./VERCEL.md) — CLI + dashboard; production alias **`https://web-chi-neon-59.vercel.app`** (set `NEXT_PUBLIC_APP_URL` to this in Vercel env, then redeploy)

## Project ownership + session continuity

Everything in this project is made by **Vagdev**.

Vagdev tracks what has been done and what is next in:

- [pjournal/Pjournal.md](./pjournal/Pjournal.md)

If you open this repo in a different editor/session later, reading this `README.md` and then `pjournal/Pjournal.md` is enough to understand current status and next tasks.

## Git / GitHub (`vagdotdev` / `jini-mvp-web`)

GitHub CLI is installed at **`/opt/homebrew/bin/gh`**. This repo is on branch **`main`**.

### One-time login (you must do this once in a real terminal)

```bash
/opt/homebrew/bin/gh auth login
```

Pick **GitHub.com** → **HTTPS** → **Login with a web browser**.  
After that, `gh` can create repos and push from this machine (including from Cursor’s terminal).

### Create the repo + push (after login)

```bash
cd /Users/vagdev/Documents/jinimvpweb
./scripts/github-sync.sh
```

That creates **`https://github.com/vagdotdev/jini-mvp-web`** if it does not exist yet, sets **`origin`**, and pushes **`main`**.

### Let Cursor / agents run `gh` without a browser next time

Create a **classic PAT** (or fine-grained token) on GitHub with **`repo`** scope. In Cursor, add an environment variable **`GH_TOKEN`** = that token (do **not** commit it). Then non-interactive commands like `gh repo view` and `git push` work in agent runs.
