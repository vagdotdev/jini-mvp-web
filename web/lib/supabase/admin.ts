import { createClient } from "@supabase/supabase-js";
import { cleanSupabaseEnvValue } from "@/lib/supabase/clean-env";

/**
 * Server-only Supabase client with full database access.
 * Never import this from client components.
 */
export function createAdminClient() {
  const url = cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanSupabaseEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
