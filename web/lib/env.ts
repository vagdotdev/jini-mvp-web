import { cleanSupabaseEnvValue } from "@/lib/supabase/clean-env";

/**
 * Returns the canonical base URL for the app.
 *
 * Priority:
 *   1. NEXT_PUBLIC_APP_URL env var (set this in Vercel for a stable domain).
 *   2. Derived from the incoming request's origin (works on any deployment —
 *      preview URLs, custom domains — without needing to set the env var).
 *   3. Falls back to http://localhost:3000 for local dev without the env var.
 *
 * Pass the `req` argument from any API route handler to enable option 2.
 */
export function getPublicAppUrl(req?: Request): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");

  if (req) {
    try {
      const { protocol, host } = new URL(req.url);
      return `${protocol}//${host}`;
    } catch {
      // fall through
    }
  }

  return "http://localhost:3000";
}

export function isSupabaseConfigured() {
  return Boolean(
    cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function isSupabaseAdminConfigured() {
  return Boolean(
    cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      cleanSupabaseEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}
