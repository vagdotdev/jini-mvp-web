# Deploy Jini MVP Web on Vercel

The Next.js app lives in **`web/`**.

## Vercel CLI (this machine)

- **Installed:** `brew install vercel-cli` → `vercel` at `/opt/homebrew/bin/vercel`
- **Login:** `vercel login` (device flow; complete in browser once)
- **Redeploy from terminal:** from repo root run `./scripts/vercel-prod.sh` or:

```bash
cd web && vercel deploy --prod --yes
```

**Current production alias** (from first CLI deploy; confirm in [Vercel dashboard](https://vercel.com/vagdevs-projects/web)):

**`https://web-chi-neon-59.vercel.app`**

Linked project: **`vagdevs-projects/web`** (Vercel team + project name).  
`.vercel/` under `web/` is **gitignored** — link stays local; GitHub import is a separate optional path.

### Connect GitHub for auto-deploy (recommended)

In Vercel: open project **web** → **Settings → Git** → connect **`vagdotdev/jini-mvp-web`**, root **`web`**, so pushes to `main` deploy automatically. You can keep using the CLI for ad-hoc deploys too.

---

## 1. Import the repo (dashboard-only path)

1. [vercel.com](https://vercel.com) → **Add New…** → **Project** → Import **`vagdotdev/jini-mvp-web`**.
2. **Root Directory** → **Edit** → set to **`web`** (not the repo root).
3. Framework: **Next.js** (auto). Build: `next build`, Output: default.
4. **Deploy**, then add env vars below and **Redeploy**.

---

## 2. Production URL → `NEXT_PUBLIC_APP_URL`

Set this to your **stable** production host (no trailing slash), e.g.:

- `https://web-chi-neon-59.vercel.app`  
  or your custom domain after you attach one.

In **Vercel → Project → Settings → Environment Variables** (Production), add:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_APP_URL` | Your stable Vercel URL (see above) |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as local `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as local |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as local (server only) |
| `LIVEKIT_URL` | Same as local |
| `LIVEKIT_API_KEY` | Same as local |
| `LIVEKIT_API_SECRET` | Same as local |
| `JINI_STREAM_CREATE_SECRET` | Same as local (if you use it) |
| `JINI_CRON_SECRET` | Optional, for cron later |
| `RAZORPAY_*` | When payments go live |

Then **Deployments → … → Redeploy** so `/admin` link builder picks up `NEXT_PUBLIC_APP_URL`.

CLI alternative (interactive): `cd web && vercel env add`

---

## 3. Supabase (OAuth)

**Supabase Dashboard → Authentication → URL configuration**

- Add your Vercel URL(s) to **Redirect URLs** (and Site URL if you use a single canonical site).

---

## 4. Smoke test

1. Open `https://YOUR-STABLE-URL.vercel.app/admin`
2. Create a stream (with create secret if set).
3. Confirm the three links use your **Vercel** host, not `localhost`.

---

## 5. Cron (optional)

When you want auto-unlock: Vercel **Cron Jobs** → schedule `GET` or `POST`  
`/api/items/release-expired-locks` with header `Authorization: Bearer YOUR_JINI_CRON_SECRET` if that env is set.
