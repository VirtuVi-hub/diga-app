"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/supabase/browser";
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
