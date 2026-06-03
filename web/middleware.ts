import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { cleanSupabaseEnvValue } from "@/lib/supabase/clean-env";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const url = cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = cleanSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // If Supabase is not configured, let requests through (dev preview mode).
  if (!url || !anon) return response;

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

  // Always refresh the session so the cookie stays valid.
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
