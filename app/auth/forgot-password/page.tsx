"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth-actions";
import { AuthShell, AUTH_INPUT_CLASS, AUTH_BUTTON_CLASS, AUTH_LINK_CLASS } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    // Deliberately never reveals whether an account exists for this email —
    // the same message shows regardless. Module 1: "Do not implement real
    // email delivery. Architecture only." — this calls Supabase's own
    // resetPasswordForEmail, which sends a real email only if the hosted
    // project's own SMTP is configured; no custom email-sending exists here.
    await requestPasswordReset(email);
    setLoading(false);
    setSent(true);
  }

  return (
    <AuthShell
      title="Forgot Password"
      subtitle={sent ? undefined : "Enter your email and we'll send a reset link."}
      footer={
        <Link href="/auth" className={AUTH_LINK_CLASS}>
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="text-text-secondary">If an account exists for that email, a password reset link has been sent.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={AUTH_INPUT_CLASS}
          />

          <button
            type="submit"
            disabled={loading}
            className={AUTH_BUTTON_CLASS}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
