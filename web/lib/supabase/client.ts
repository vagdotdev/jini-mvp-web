import { createBrowserClient } from "@supabase/ssr";
import { cleanSupabaseEnvValue } from "@/lib/supabase/clean-env";

export function createBrowserSupabaseClient() {
  const url = cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anon) return null;
  return createBrowserClient(url, anon);
}
