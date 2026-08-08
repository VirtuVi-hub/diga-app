"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient, establishSessionFromUrlFragment } from "@/supabase/browser";
import { AuthShell } from "@/components/auth/AuthShell";

/**
 * Post-launch fix: the missing landing page for a signup confirmation
 * link. Traced live against the hosted Supabase project (not guessed):
 * confirmation links here deliver the session as a URL fragment
 * (`#access_token=...&refresh_token=...`), the same implicit-style
 * delivery `reset-password/page.tsx` already documents and handles for
 * password recovery — fragments never reach the server, so no server
 * Route Handler can ever see them. This page follows that exact
 * precedent: the browser Supabase client (`detectSessionInUrl: true` by
 * default) consumes the fragment automatically on load and establishes a
 * real session; once it exists, this redirects to wherever the user was
 * actually headed (`?redirect=/invite/CODE` when confirming from an
 * invitation) instead of leaving them stranded with no session and no
 * path forward — the confirmed root cause of "registration loops back to
 * Create Account."
 */
function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/firm";
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let cancelled = false;

    establishSessionFromUrlFragment(supabase).then(({ error: sessionError }) => {
      if (cancelled) return;
      if (sessionError) {
        setError(sessionError);
        return;
      }
      router.replace(redirectTarget);
    });

    return () => {
      cancelled = true;
    };
  }, [router, redirectTarget]);

  return (
    <AuthShell title="Confirming..." subtitle={error || "Finishing sign-in — you'll be brought straight back to what you were doing."}>
      {error && (
        <a href="/auth" className="inline-block rounded-full bg-accent-primary px-5 py-2.5 text-sm font-medium text-white">
          Back to sign in
        </a>
      )}
    </AuthShell>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  );
}
