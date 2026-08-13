"use server";

import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { ensurePersonForAuthUser } from "@/lib/auth/current-person";
import { createServerSupabaseClient } from "@/supabase/server";

/**
 * Module 1: Authentication. Register/Login/Logout are real, live Supabase
 * Auth calls — that is not "email delivery," it's identity. Forgot
 * Password / Reset Password / Email Verification are architecture-only
 * placeholders per the brief ("Do not implement real email delivery"):
 * they call the real Supabase Auth methods that would trigger an email if
 * the hosted project's own SMTP is configured, but this sprint builds no
 * custom email-sending of its own.
 */

export type RegisterResult = {
  hasSession: boolean;
  needsEmailVerification: boolean;
};

/**
 * Post-launch fix: `signUp()` previously had no `emailRedirectTo` at all.
 * This hosted project genuinely requires email confirmation (confirmed
 * live — `signUp()` returns `session: null` for every real signup, not a
 * guess), and traced live: the confirmation link delivers the session as
 * a URL fragment (`#access_token=...`), the same implicit-style delivery
 * `reset-password/page.tsx` already handles for recovery links — never a
 * `?code=` a server route could exchange. `app/auth/confirm/page.tsx`
 * (new) is the client-side landing page that actually consumes it,
 * mirroring that existing precedent. `redirectTo` (usually
 * `/invite/[code]` when registering from an invitation) is threaded all
 * the way through so confirming your email lands you back where you were
 * trying to go, signed in, instead of nowhere — the confirmed root cause
 * of "registration loops back to Create Account."
 */
export async function registerUser(params: { email: string; password: string; fullName: string; redirectTo?: string }): Promise<RegisterResult> {
  const supabase = await createServerSupabaseClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const callbackUrl = appUrl ? `${appUrl}/auth/confirm${params.redirectTo ? `?redirect=${encodeURIComponent(params.redirectTo)}` : ""}` : undefined;

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { full_name: params.fullName }, emailRedirectTo: callbackUrl },
  });

  if (error) {
    // Post-launch fix: found live during two-real-browser-session
    // verification — Supabase's own confirmation-email rate limit is real
    // and easy to hit under actual multi-user testing (several people
    // registering in a short window). Passing the raw "email rate limit
    // exceeded" message through read, to a real user, as if registration
    // silently failed for no reason — indistinguishable from the reported
    // "loops back to Create Account" symptom. Same account was not
    // created if this fires (Supabase rejects before creating the user).
    if (error.message.toLowerCase().includes("rate limit")) {
      throw new Error("Too many registration attempts right now — please wait a few minutes and try again.");
    }
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error("Registration did not return a user.");
  }

  await ensurePersonForAuthUser(data.user);

  await publishSafely({
    eventType: EVENT_TYPES.USER_REGISTERED,
    // `actor.id` is the person's display name, not their auth UUID — see
    // `FirmService.createFirm()`'s own comment for why: every existing
    // Timeline summary builder inserts `actor.id` directly into a
    // human-readable sentence.
    actor: { type: "person", id: params.fullName || params.email },
    metadata: { title: params.fullName || params.email },
  });

  return {
    hasSession: data.session !== null,
    // Supabase returns a user with an empty `identities` array when the
    // email is already registered but unconfirmed — not distinguishable
    // from "confirmation required" here without a second lookup this
    // sprint doesn't add. Absence of a session is treated as "needs
    // verification," which is true in the common case.
    needsEmailVerification: data.session === null,
  };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // Errors are deliberately swallowed into the same honest, non-revealing
  // message the UI always shows ("If an account exists for that email...")
  // — never confirming or denying whether an account exists.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: appUrl ? `${appUrl}/auth/reset-password` : undefined,
  });
}

export async function resendVerificationEmail(email: string, redirectTo?: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const callbackUrl = appUrl ? `${appUrl}/auth/confirm${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}` : undefined;

  await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: callbackUrl } });
}
