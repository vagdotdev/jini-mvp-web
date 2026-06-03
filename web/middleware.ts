import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { cleanSupabaseEnvValue } from "@/lib/supabase/clean-env";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const url = cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // If Supabase is not configured, let requests through (dev preview mode).
  if (!url || !anon) return response;

  // Wrap the entire auth flow so a malformed cookie, a transient Supabase
  // outage, or a stale refresh token never produces a 500 — which mobile
  // browsers (especially in-app browsers) render as "This page couldn't load".
  let user: { id: string } | null = null;
  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
  } catch {
    // Treat any auth failure as "not signed in" rather than crashing.
    user = null;
  }

  const { pathname } = request.nextUrl;

  // Protect /stream/[slug]/live — redirect unauthed users to onboarding.
  const liveMatch = pathname.match(/^\/stream\/([^/]+)\/live$/);
  if (liveMatch && !user) {
    const slug = liveMatch[1];
    return NextResponse.redirect(
      new URL(`/stream/${slug}/onboarding`, request.url),
    );
  }

  // Protect /account — redirect to home if not signed in.
  if (pathname === "/account" && !user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets.
     * This is the standard Supabase Next.js middleware matcher.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
