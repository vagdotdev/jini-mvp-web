# Jini Live (web app)

## What this folder is

This is the **Next.js** application: the website viewers open, plus admin/host/buddy pages.

## First-time setup (plain steps)

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).
2. In Supabase: **SQL** → new query → paste `supabase/migrations/001_init.sql` → Run. Then paste `002_rls.sql` → Run.
3. In Supabase: **Project Settings → API** — copy `Project URL`, `anon public` key, and **`service_role` key** (keep service role secret; never put it in the browser).
4. Copy `web/.env.example` to `web/.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` while developing)
   - `JINI_STREAM_CREATE_SECRET` (**required** — admin APIs fail closed without it)
   - `JINI_CRON_SECRET` (**required** for lock-release cron)
5. Put the same `JINI_STREAM_CREATE_SECRET` value in the admin page “Create secret” field.
6. From this folder run:

```bash
npm run dev
```

7. Open [http://localhost:3000/admin](http://localhost:3000/admin), create a stream, copy the three links.

Security notes: see `../SECURITY_WHITEBOX_REPORT.md`.

## Repo layout reminder

The project brief at repo root is `../JINI_LIVE_PROJECT_BRIEF.md` (one level up from `web/`).
