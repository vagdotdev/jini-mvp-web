import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cleanSupabaseEnvValue } from "@/lib/supabase/clean-env";

/**
 * Supabase client for Route Handlers / Server Components using the user's session (cookies).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const url = cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anon) return null;

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where cookies are read-only
        }
      },
    },
  });
}
