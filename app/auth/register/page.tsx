"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { registerUser } from "@/lib/actions/auth-actions";
import { AuthShell, AUTH_INPUT_CLASS, AUTH_BUTTON_CLASS, AUTH_LINK_CLASS } from "@/components/auth/AuthShell";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await registerUser({ email, password, fullName, redirectTo: redirectTarget ?? undefined });

      // Post-launch fix: this hosted project genuinely requires email
      // confirmation (confirmed live — `hasSession` is never true for a
      // real signup here), so this branch is the common case, not the
      // exception. `redirectTarget` (e.g. `/invite/CODE`) now survives
      // into `/auth/verify` and — via `registerUser()`'s new
      // `emailRedirectTo` — into the confirmation email itself, so
      // clicking it lands back here signed in instead of nowhere.
      if (result.needsEmailVerification) {
        router.push(redirectTarget ? `/auth/verify?redirect=${encodeURIComponent(redirectTarget)}` : "/auth/verify");
        return;
      }

      router.push(redirectTarget || "/firm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Registration creates your account and professional profile only — no Firm or Project access yet."
      footer={
        <>
          Already have an account?{" "}
          <Link href={redirectTarget ? `/auth?redirect=${encodeURIComponent(redirectTarget)}` : "/auth"} className={AUTH_LINK_CLASS}>
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className={AUTH_INPUT_CLASS}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={AUTH_INPUT_CLASS}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className={AUTH_INPUT_CLASS}
        />

        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={AUTH_BUTTON_CLASS}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
