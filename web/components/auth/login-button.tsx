"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
// PILOT-ONLY: Ganesh test sign-in. Remove with the manual-wallet pilot.
import { GANESH_EMAIL, GANESH_PASSWORD } from "@/lib/dev/ganesh";

type LoginButtonProps = {
  redirectTo: string;
  /** Where to send the user after a one-tap test sign-in (Ganesh). */
  liveRedirect?: string;
  /** Called after anonymous dev sign-in succeeds so sibling UI can refresh session. */
  onAnonymousSignedIn?: () => void;
};

export function LoginButton({
  redirectTo,
  liveRedirect,
  onAnonymousSignedIn,
}: LoginButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingAnon, setLoadingAnon] = useState(false);
  const [loadingGanesh, setLoadingGanesh] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function signIn() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage(
        "Supabase is not connected yet. You can still preview the UI; login will work after env keys are added.",
      );
      return;
    }

    setLoading(true);
    setMessage(null);
    setSuccessMessage(null);
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  async function skipGoogleDev() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage(
        "Supabase is not connected yet. You can still preview the UI; login will work after env keys are added.",
      );
      return;
    }

    setLoadingAnon(true);
    setMessage(null);
    setSuccessMessage(null);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        setMessage(
          `${error.message} If Anonymous sign-ins are off, turn them on in Supabase → Authentication → Providers → Anonymous.`,
        );
        return;
      }
      if (!data.session?.user) {
        setMessage(
          "Anonymous sign-in did not return a session (check Supabase Auth logs, captcha, or rate limits).",
        );
        return;
      }
      setSuccessMessage("Signed in as guest (dev). Fill the form below, then save.");
      onAnonymousSignedIn?.();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Anonymous sign-in failed unexpectedly.",
      );
    } finally {
      setLoadingAnon(false);
    }
  }

  // PILOT-ONLY: Ganesh test sign-in. Remove with the manual-wallet pilot.
  async function loginAsGanesh() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage(
        "Supabase is not connected yet. Add the env keys before using the Ganesh test account.",
      );
      return;
    }
    setLoadingGanesh(true);
    setMessage(null);
    setSuccessMessage(null);
    try {
      const ensureRes = await fetch("/api/dev/login-as-ganesh", {
        method: "POST",
      });
      if (!ensureRes.ok) {
        const ensureJson = (await ensureRes.json().catch(() => ({}))) as {
          error?: string;
        };
        setMessage(
          ensureJson.error || "Could not prepare the Ganesh test account.",
        );
        return;
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: GANESH_EMAIL,
        password: GANESH_PASSWORD,
      });
      if (signInErr) {
        setMessage(
          `${signInErr.message} Try again — Ganesh was prepared but sign-in failed.`,
        );
        return;
      }
      const target = liveRedirect || redirectTo;
      router.push(target);
      router.refresh();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Ganesh sign-in failed unexpectedly.",
      );
    } finally {
      setLoadingGanesh(false);
    }
  }

  const anyLoading = loading || loadingAnon || loadingGanesh;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void signIn()}
        disabled={anyLoading}
        className="w-full rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Opening Google..." : "Continue with Google"}
      </button>
      <button
        type="button"
        onClick={() => void skipGoogleDev()}
        disabled={anyLoading}
        className="w-full rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingAnon ? "Starting dev session..." : "Skip Google for now (dev)"}
      </button>
      {/* PILOT-ONLY: Ganesh test sign-in. Remove with the manual-wallet pilot. */}
      <button
        type="button"
        onClick={() => void loginAsGanesh()}
        disabled={anyLoading}
        className="w-full rounded-xl border-2 border-dashed border-amber-400 bg-amber-100 px-5 py-3 text-sm font-bold uppercase tracking-wide text-amber-900 shadow-sm hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingGanesh ? "Becoming Ganesh..." : "Login as Ganesh (test user)"}
      </button>
      <p className="-mt-1 px-1 text-[11px] leading-4 text-amber-800/80">
        Pilot only. Skips the form and drops you straight into the live stream
        as our shared test account.
      </p>
      {successMessage ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-900">
          {successMessage}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          {message}
        </p>
      ) : null}
    </div>
  );
}
