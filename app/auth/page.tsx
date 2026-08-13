"use client";

import { Suspense, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient, establishSessionFromUrlFragment } from "@/supabase/browser";
import { AuthShell, AUTH_INPUT_CLASS, AUTH_BUTTON_CLASS, AUTH_LINK_CLASS } from "@/components/auth/AuthShell";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserSupabaseClient();

  const redirectTarget = searchParams.get("redirect");
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [establishingSession, setEstablishingSession] = useState(false);

  // Post-launch fix: Supabase invitation links land here as
  // `#access_token=...&refresh_token=...&type=invite` — the same
  // implicit-flow fragment delivery `/auth/confirm` already handles for
  // signup confirmation, via the same `establishSessionFromUrlFragment()`
  // helper. `/auth` never looked at the fragment at all, so invited users
  // just saw the plain sign-in form with their session tokens sitting
  // unused in the URL. `useLayoutEffect` (not `useEffect`) runs before the
  // browser paints, so a normal `/auth` visit (no fragment) never renders
  // this branch and is completely unaffected.
  useLayoutEffect(() => {
    const hash = window.location.hash;
    // "error" covers expired/invalid links: Supabase redirects those as
    // `#error=...&error_description=...` with no access_token at all, and
    // establishSessionFromUrlFragment()'s own error_description handling
    // must still run so the user sees why, instead of a silent blank form.
    if (!hash.includes("access_token") && !hash.includes("error")) return;

    // Flips to the "Confirming..." view before the browser paints (this is
    // a layout effect, not a regular effect), so a normal /auth visit never
    // renders it and an invite visit never flashes the sign-in form first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstablishingSession(true);
    let cancelled = false;

    establishSessionFromUrlFragment(supabase)
      .then(({ error: sessionError }) => {
        if (cancelled) return;
        if (sessionError) {
          setError(sessionError);
          setEstablishingSession(false);
          return;
        }
        router.replace(redirectTarget || "/");
      })
      .catch((err) => {
        // Belt-and-suspenders, matching establishRecoverySession()'s own
        // precedent: nothing above should throw, but if it ever does, this
        // still returns to a usable login form instead of leaving
        // "Confirming..." stuck on screen forever.
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Something went wrong confirming that link.");
        setEstablishingSession(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Post-launch fix: signing in from an invitation link (`?redirect=/invite/CODE`)
    // used to always land on `/` regardless — the invitation was lost the
    // moment "Sign In" was clicked. Now returns to wherever the user was
    // actually trying to go.
    router.push(redirectTarget || "/");
  }

  if (establishingSession) {
    return (
      <AuthShell title="Confirming..." subtitle="Finishing sign-in — you'll be brought straight back to what you were doing.">
        {null}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Sign In"
      subtitle="Welcome to Delta"
      footer={
        <div className="flex items-center justify-between">
          <Link href="/auth/forgot-password" className={AUTH_LINK_CLASS}>
            Forgot password?
          </Link>
          <Link href={redirectTarget ? `/auth/register?redirect=${encodeURIComponent(redirectTarget)}` : "/auth/register"} className={AUTH_LINK_CLASS}>
            Create an account
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSignIn} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={AUTH_INPUT_CLASS}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={AUTH_INPUT_CLASS}
        />

        {callbackError && <p className="text-sm text-error">{callbackError}</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={AUTH_BUTTON_CLASS}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
