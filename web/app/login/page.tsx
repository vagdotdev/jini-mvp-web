"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LoginButton } from "@/components/auth/login-button";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/account";
  return raw;
}

function LoginContent() {
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-8 px-4 py-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
          Jini
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Log in or sign up
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Continue with Google, or use a guest session in development.
        </p>
      </div>
      <LoginButton redirectTo={next} liveRedirect={next} />
      <p className="text-center text-sm text-zinc-500">
        <Link href="/" className="font-medium text-violet-700 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center text-zinc-500">
      Loading…
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-full bg-[#f7f2ea]">
      <Suspense fallback={<LoginFallback />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
