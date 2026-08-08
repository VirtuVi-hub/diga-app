import { createServerSupabaseClient } from "@/supabase/server";
import { createServiceSupabaseClient } from "@/supabase/service";
import type { Person } from "@/lib/types/firm";

/**
 * `auth.users -> people -> firm_members -> project_team`
 * (docs/database/schema-review.md's own "Emerging Architecture Decisions").
 * This file is the one place that bridges Supabase Auth identity to the
 * `people` professional-profile row every other domain table hangs off of.
 */

export async function getCurrentAuthUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentPerson(): Promise<Person | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("people").select("*").eq("auth_user_id", user.id).maybeSingle();
  return data;
}

/**
 * Ensures a `people` row (the "professional profile" docs/architecture/002
 * describes) exists for the given auth user, creating one if necessary.
 * Idempotent — safe to call more than once for the same user, thanks to the
 * partial unique index on `people.auth_user_id`.
 *
 * Uses the service-role client deliberately, not the request-scoped one:
 * this runs immediately after `signUp()`, and when the hosted Supabase
 * project requires email confirmation (as this one does — a real
 * constraint discovered during this sprint's own verification, not
 * assumed), `signUp()` returns no session yet, so the request is still
 * Postgres role `anon` and every `people` RLS policy (all scoped to
 * `authenticated`) correctly denies the insert. Creating the professional
 * profile is a trusted, server-only bootstrap step — exactly what
 * `createServiceSupabaseClient()` (present since the Foundation migration,
 * unused until now) exists for.
 */
export async function ensurePersonForAuthUser(params: { userId: string; email: string; fullName: string }): Promise<Person> {
  const supabase = createServiceSupabaseClient();

  const existing = await supabase.from("people").select("*").eq("auth_user_id", params.userId).maybeSingle();
  if (existing.data) return existing.data;

  const trimmedName = params.fullName.trim();
  const [firstName, ...rest] = trimmedName.length > 0 ? trimmedName.split(/\s+/) : [params.email];
  const lastName = rest.join(" ");

  const { data, error } = await supabase
    .from("people")
    .insert({
      auth_user_id: params.userId,
      first_name: firstName,
      last_name: lastName,
      email: params.email,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create professional profile.");
  }

  return data;
}
