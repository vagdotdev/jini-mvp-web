import { cleanSupabaseEnvValue } from "@/lib/supabase/clean-env";

function normalizeBaseUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

/**
 * Returns the canonical base URL for the app.
 *
 * Priority (when `req` is provided):
 *   1. The incoming request's origin if it's a real production host
 *      (anything other than localhost/127.0.0.1) — this keeps generated
 *      links on whatever domain the user is currently on (e.g. sarojini.shop).
 *   2. NEXT_PUBLIC_APP_URL env var, normalized (https:// auto-added if missing).
 *   3. Localhost fallback (only used when no req and no env var).
 *
 * Without a `req` (e.g. build-time), env var is used first.
 */
export function getPublicAppUrl(req?: Request): string {
  const envBase = process.env.NEXT_PUBLIC_APP_URL
    ? normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL)
    : null;

  if (req) {
    try {
      const reqUrl = new URL(req.url);
      const isLocal =
        reqUrl.hostname === "localhost" || reqUrl.hostname === "127.0.0.1";
      if (!isLocal) {
        return `${reqUrl.protocol}//${reqUrl.host}`;
      }
    } catch {
      // fall through
    }
  }

  if (envBase) return envBase;
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
