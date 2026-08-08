"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resendVerificationEmail } from "@/lib/actions/auth-actions";
import { AuthShell, AUTH_INPUT_CLASS, AUTH_LINK_CLASS } from "@/components/auth/AuthShell";

/**
 * Module 1: Email Verification (placeholder). Architecture only — this
 * calls Supabase's own `auth.resend()`, which sends a real email only if
 * the hosted project's own SMTP is configured; no custom email delivery is
 * built here.
 */
function VerifyForm() {
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    if (!email.trim()) return;
    setLoading(true);
    await resendVerificationEmail(email, redirectTarget ?? undefined);
    setLoading(false);
    setSent(true);
  }

  return (
    <AuthShell
      title="Verify Your Email"
      subtitle="We've sent a verification link to your email address. Click it to finish signing in — you'll be brought straight back to what you were doing."
      footer={
        <Link href={redirectTarget ? `/auth?redirect=${encodeURIComponent(redirectTarget)}` : "/auth"} className={AUTH_LINK_CLASS}>
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={AUTH_INPUT_CLASS}
        />

        <button
          type="button"
          onClick={handleResend}
          disabled={loading || !email.trim()}
          className="w-full rounded-full border border-accent-primary/40 bg-accent-primary/10 p-3 font-medium text-accent-primary transition hover:bg-accent-primary/20 disabled:opacity-50"
        >
          {loading ? "Sending..." : sent ? "Verification email resent" : "Resend verification email"}
        </button>
      </div>
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
