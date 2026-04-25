# Deploy Jini MVP Web on Vercel

The Next.js app lives in **`web/`**. Vercel must use that folder as the **Root Directory**.

## 1. Import the repo

1. [vercel.com](https://vercel.com) → **Add New…** → **Project** → Import **`vagdotdev/jini-mvp-web`**.
2. **Root Directory** → **Edit** → set to **`web`** (not the repo root).
3. Framework: **Next.js** (auto). Build: `next build`, Output: default.
4. **Deploy** (first deploy can succeed even before env vars; fix env then redeploy).

## 2. Production URL → `NEXT_PUBLIC_APP_URL`

After the first deploy, copy your URL, e.g. `https://jini-mvp-web.vercel.app` (no trailing slash).

In **Vercel → Project → Settings → Environment Variables** (Production), add:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-PROJECT.vercel.app` |
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

## 3. Supabase (OAuth)

**Supabase Dashboard → Authentication → URL configuration**

- Add your Vercel URL to **Redirect URLs** (and Site URL if you use a single canonical site).
- Google OAuth **Authorized redirect URIs** (Google Cloud Console) must include your Supabase callback URL (unchanged if you already use Supabase’s hosted callback).

## 4. Smoke test

1. Open `https://YOUR-PROJECT.vercel.app/admin`
2. Create a stream (with create secret if set).
3. Confirm the three links use **`https://YOUR-PROJECT.vercel.app`** (not `localhost`).

## 5. Cron (optional)

When you want auto-unlock: Vercel **Cron Jobs** → schedule `GET` or `POST`  
`/api/items/release-expired-locks` with header `Authorization: Bearer YOUR_JINI_CRON_SECRET` if that env is set.
