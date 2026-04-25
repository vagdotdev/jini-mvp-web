"use client";

import { useState } from "react";
import { LoginButton } from "@/components/auth/login-button";
import { OnboardingForm } from "@/components/auth/onboarding-form";

type StreamOnboardingPanelProps = {
  slug: string;
};

/**
 * Keeps login + onboarding in one client boundary so anonymous sign-in can bump
 * auth state and the form re-reads the session (avoids missed SIGNED_IN edge cases).
 */
export function StreamOnboardingPanel({ slug }: StreamOnboardingPanelProps) {
  const [authVersion, setAuthVersion] = useState(0);

  return (
    <>
      <LoginButton
        redirectTo={`/stream/${slug}/onboarding`}
        onAnonymousSignedIn={() => setAuthVersion((v) => v + 1)}
      />
      <OnboardingForm slug={slug} authVersion={authVersion} />
    </>
  );
}
