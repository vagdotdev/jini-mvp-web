"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OnboardingFormProps = {
  slug: string;
  /** Incremented after dev anonymous sign-in so we re-read auth session. */
  authVersion?: number;
};

export function OnboardingForm({ slug, authVersion = 0 }: OnboardingFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  const applyUser = useCallback((user: { user_metadata?: Record<string, unknown> } | null) => {
    setIsAuthed(Boolean(user));
    if (!user?.user_metadata) return;
    const full = user.user_metadata.full_name as string | undefined;
    const nm = user.user_metadata.name as string | undefined;
    if (full?.trim() || nm?.trim()) {
      setName(full?.trim() || nm?.trim() || "");
    }
  }, []);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => applyUser(session?.user ?? null));
    });

    return () => subscription.unsubscribe();
  }, [applyUser]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      applyUser(data.user);
    });
  }, [slug, authVersion, applyUser]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage("Supabase is not connected yet, so this form is preview-only.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setMessage("Please sign in first.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: userData.user.id,
      full_name: name.trim(),
      phone: phone.trim(),
      default_shipping_address: {
        line1: address.trim(),
      },
      role: "buyer",
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const joinRes = await fetch("/api/streams/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ slug }),
    });
    const joinJson = (await joinRes.json().catch(() => ({}))) as {
      error?: string;
    };
    if (!joinRes.ok) {
      setMessage(joinJson.error || "Could not join this stream session yet.");
      setLoading(false);
      return;
    }

    window.location.href = `/stream/${slug}/live`;
  }

  return (
    <form
      onSubmit={(event) => void saveProfile(event)}
      className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-md sm:p-7"
    >
      <div>
        <label className="block text-sm font-medium text-zinc-800">Name</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base outline-none ring-violet-500 focus:border-violet-500 focus:ring-2 sm:text-sm"
          placeholder="Your full name"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-800">
          Phone number
        </label>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base outline-none ring-violet-500 focus:border-violet-500 focus:ring-2 sm:text-sm"
          placeholder="+91..."
          inputMode="tel"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-800">
          Shipping address
        </label>
        <textarea
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          className="mt-1 min-h-28 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base outline-none ring-violet-500 focus:border-violet-500 focus:ring-2 sm:text-sm"
          placeholder="House/flat, street, area, city, pincode"
          required
        />
      </div>
      {message ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading || !isAuthed}
        className="min-h-12 w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Saving..."
          : isAuthed
            ? "Save details & enter live"
            : "Sign in first to save details"}
      </button>
      <Link
        href={`/stream/${slug}/live`}
        className="block text-center text-xs text-zinc-500 hover:text-violet-600"
      >
        Preview layout only (buddy items need sign-in + join)
      </Link>
    </form>
  );
}
