import { createServerSupabaseClient } from "@/supabase/server";
import { createServiceSupabaseClient } from "@/supabase/service";
import type { Person } from "@/lib/types/firm";
import type { User } from "@supabase/supabase-js";

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
  if (data) return data;

  // Authenticated-but-no-profile-yet is not just a registration-time state.
  // Any auth method that establishes a session without going through
  // registerUser() (Supabase's native invite links today; any future
  // provider) reaches here with a real user and no `people` row.
  // getCurrentPerson() is the one chokepoint every caller in the app
  // already uses to resolve "who is the signed-in person" (see this file's
  // own header comment), so it's the single place that can guarantee the
  // invariant for every path at once instead of requiring each auth entry
  // point to remember to call ensurePersonForAuthUser() itself.
  return ensurePersonForAuthUser(user);
}

/**
 * Ensures a `people` row (the "professional profile" docs/architecture/002
 * describes) exists for the given auth user, creating one if necessary.
 * Idempotent — safe to call more than once, and safe to call concurrently,
 * for the same user, thanks to the partial unique index on
 * `people.auth_user_id`: see the unique-violation handling below.
 *
 * Takes the Supabase `User` object itself (not pre-extracted fields) so
 * this is the one place that knows how a `people` profile is derived from
 * an Auth user's shape — `email`, and `user_metadata.full_name` falling
 * back to `email` when absent (e.g. an invite with no name attached; see
 * `registerUser()`'s `signUp({ options: { data: { full_name } } })`, which
 * is what makes `full_name` present at all for a normal registration).
 *
 * Called both right after `registerUser()`'s `signUp()` (still Postgres
 * role `anon` when the hosted project requires email confirmation, so
 * `people`'s `authenticated`-scoped RLS policies would deny the insert) and
 * now, self-healingly, from `getCurrentPerson()` for any already-verified
 * session that reaches it with no profile yet (e.g. an invite link).
 * Uses the service-role client deliberately in both cases: creating the
 * professional profile is a trusted, server-only bootstrap step — exactly
 * what `createServiceSupabaseClient()` exists for.
 */
export async function ensurePersonForAuthUser(authUser: User): Promise<Person> {
  const supabase = createServiceSupabaseClient();

  const existing = await supabase.from("people").select("*").eq("auth_user_id", authUser.id).maybeSingle();
  if (existing.data) return existing.data;

  const email = authUser.email ?? "";
  const fullName = typeof authUser.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : "";
  const trimmedName = fullName.trim();
  const [firstName, ...rest] = trimmedName.length > 0 ? trimmedName.split(/\s+/) : [email];
  const lastName = rest.join(" ");

  const { data, error } = await supabase
    .from("people")
    .insert({
      auth_user_id: authUser.id,
      first_name: firstName,
      last_name: lastName,
      email,
    })
    .select("*")
    .single();

  if (error) {
    // Two concurrent calls (e.g. sibling Server Components both resolving
    // the current person in the same render) can both pass the existence
    // check above and race to insert. The partial unique index on
    // auth_user_id lets exactly one succeed; the loser gets a
    // unique-violation, not a real failure — the row it wanted already
    // exists, so fetch and return it instead of throwing.
    if (error.code === "23505") {
      const { data: raceWinner } = await supabase.from("people").select("*").eq("auth_user_id", authUser.id).maybeSingle();
      if (raceWinner) return raceWinner;
    }
    throw new Error(error.message ?? "Failed to create professional profile.");
  }
  if (!data) {
    throw new Error("Failed to create professional profile.");
  }

  return data;
}
