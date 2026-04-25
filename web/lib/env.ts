import { cleanSupabaseEnvValue } from "@/lib/supabase/clean-env";

export function getPublicAppUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return raw?.replace(/\/$/, "") || "http://localhost:3000";
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
