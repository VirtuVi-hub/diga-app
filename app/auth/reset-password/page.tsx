"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient, establishSessionFromUrlFragment } from "@/supabase/browser";
import { AuthShell, AUTH_INPUT_CLASS, AUTH_BUTTON_CLASS } from "@/components/auth/AuthShell";

/**
 * Reached via the recovery link `requestPasswordReset()` triggers.
 *
 * Post-launch fix: this page previously assumed `@supabase/ssr`'s
 * `detectSessionInUrl` would auto-establish a session from the recovery
 * link's URL fragment before `updateUser()` ever ran. Traced live (while
 * fixing an unrelated registration bug) and confirmed that never happens
 * — `createBrowserClient()` hardcodes PKCE flow, whose auto-detection
 * only recognizes a `?code=` query param, not this project's actual
 * `#access_token=...` fragment delivery. `updateUser()` was therefore
 * always failing with no active session. Now explicitly establishes the
 * session via `establishSessionFromUrlFragment()` (shared with
 * `/auth/confirm`, same root cause) before allowing a password change.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    establishSessionFromUrlFragment(supabase).then(({ error: sessionError }) => {
      if (cancelled) return;
      if (sessionError) {
        setError(sessionError);
        return;
      }
      setSessionReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/auth");
  }

  return (
    <AuthShell title="Reset Password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className={AUTH_INPUT_CLASS}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className={AUTH_INPUT_CLASS}
        />

        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={loading || !sessionReady}
          className={AUTH_BUTTON_CLASS}
        >
          {loading ? "Saving..." : sessionReady ? "Save New Password" : "Confirming link..."}
        </button>
      </form>
    </AuthShell>
  );
}
