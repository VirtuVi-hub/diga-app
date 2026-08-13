import { createBrowserClient } from "@supabase/ssr";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Post-launch fix: traced live against the hosted Supabase project (not
 * guessed) — every magic-link-style email this project sends (signup
 * confirmation, password recovery) delivers the session as a URL fragment
 * (`#access_token=...&refresh_token=...`). `@supabase/ssr`'s
 * `createBrowserClient()` hardcodes `flowType: "pkce"` and does not allow
 * overriding it (verified by reading its own source), so its built-in
 * `detectSessionInUrl` auto-detection — which only recognizes a `?code=`
 * query param, PKCE's own delivery mechanism — never fires for this
 * project's implicit-style links. `reset-password/page.tsx` had exactly
 * this same latent bug already (it only ever called `updateUser()`,
 * trusting auto-detection to have already established a session) —
 * fixed here too, not just in the new `/auth/confirm` page, since it's
 * the identical root cause.
 *
 * This function is the one place that manually parses the fragment and
 * establishes the session via the documented `setSession()` API, which —
 * unlike auto-detection — works regardless of configured `flowType`,
 * since it's just "here are two tokens, trust them," not a
 * flow-specific exchange.
 */
export async function establishSessionFromUrlFragment(supabase: SupabaseClient): Promise<{ error: string | null; session: Session | null }> {
  if (typeof window === "undefined") {
    return { error: "Not running in a browser.", session: null };
  }

  // TEMPORARY DEBUG INSTRUMENTATION — remove after diagnosing the stuck
  // "Confirming..." report. No logic below was changed to add these.
  console.log("[invite-debug] establishSessionFromUrlFragment: parsing hash");

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);

  const errorDescription = params.get("error_description");
  if (errorDescription) {
    console.log("[invite-debug] establishSessionFromUrlFragment: hash carried error_description", errorDescription);
    return { error: errorDescription.replace(/\+/g, " "), session: null };
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  console.log(
    "[invite-debug] establishSessionFromUrlFragment: extracted access_token",
    accessToken ? `present (len=${accessToken.length}, prefix=${accessToken.slice(0, 8)}...)` : "MISSING",
  );
  console.log(
    "[invite-debug] establishSessionFromUrlFragment: extracted refresh_token",
    refreshToken ? `present (len=${refreshToken.length}, prefix=${refreshToken.slice(0, 8)}...)` : "MISSING",
  );
  if (!accessToken || !refreshToken) {
    return { error: "That link is invalid or has expired.", session: null };
  }

  try {
    console.log("[invite-debug] establishSessionFromUrlFragment: calling supabase.auth.setSession()");
    const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    console.log("[invite-debug] establishSessionFromUrlFragment: setSession resolved", {
      hasSession: !!data?.session,
      userId: data?.session?.user?.id ?? null,
      errorMessage: error?.message ?? null,
    });

    if (error) {
      console.log("[invite-debug] establishSessionFromUrlFragment: setSession error", error);
      return { error: error.message, session: null };
    }

    // Drop the tokens from the visible URL/browser history now that the session is established.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    return { error: null, session: data?.session ?? null };
  } catch (err) {
    console.log("[invite-debug] establishSessionFromUrlFragment: setSession threw", err);
    throw err;
  }
}
