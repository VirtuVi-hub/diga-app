import { createServerSupabaseClient } from "@/supabase/server";
import type { CreateFirmInput, Firm, FirmInvitation, FirmInvitationWithRole, FirmMember, FirmMemberWithDetails, OnboardingRole } from "@/lib/types/firm";

function randomInviteCode(): string {
  const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${segment()}-${segment()}`;
}

/**
 * Real, Supabase-backed repository (Sprint 5.3) — matches
 * `DocumentRepository`'s exact pattern (static methods, a fresh
 * `createServerSupabaseClient()` per call, snake_case rows mapped straight
 * to app types). Distinct from the mock in-memory repositories the
 * intelligence-engine sprints use: Firms/People/Roles are real project data
 * with a real database behind them.
 */
export class FirmRepository {
  /** Module 3's exact 7 roles, seeded once under the shared "General" `team_type` (reused by both Firm membership and Project Team assignment). */
  static async getGeneralRoles(): Promise<OnboardingRole[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("roles")
      .select("id, name, abbreviation, sort_order, team_types!inner(name)")
      .eq("team_types.name", "General")
      .order("sort_order");

    if (error) throw new Error(error.message);
    return (data ?? []).map((role) => ({ id: role.id, name: role.name, abbreviation: role.abbreviation }));
  }

  /**
   * Sprint 5.4, Module 2's exact 10 project roles — seeded under the
   * pre-existing "Design Team"/"Client" `team_types` plus a new "Delivery
   * Team" one, deliberately distinct from the "General" Firm-membership
   * roles above (a Project Team role — "Structural Engineer" — is a
   * different concept from a Firm-membership role — "Engineer"). Returns
   * every project role, unfiltered — `lib/participants/role-categories.ts`
   * (Sprint 5.9) slices this same list per Project Setup section (Design
   * Team / Consultants / Client Representatives); do not introduce a
   * second, parallel role-category list here.
   */
  static async getProjectRoles(): Promise<(OnboardingRole & { teamType: string })[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("roles")
      .select("id, name, abbreviation, sort_order, team_types!inner(name)")
      .in("team_types.name", ["Design Team", "Client", "Delivery Team"])
      .order("sort_order");

    if (error) throw new Error(error.message);
    return (data ?? [])
      .map((role) => ({ id: role.id, name: role.name, abbreviation: role.abbreviation, teamType: (role.team_types as unknown as { name: string }).name }))
      .sort((a, b) => a.teamType.localeCompare(b.teamType));
  }

  /**
   * docs/architecture/002-authentication-and-authorization.md is explicit
   * that "a person may belong to multiple Firms" — a real, expected state,
   * not an edge case (confirmed live during this sprint's own testing,
   * when re-running Firm creation for the same person surfaced exactly
   * this). This foundation sprint has no Firm-switcher UI yet, so this
   * returns the earliest membership as "the" current Firm context — a
   * deliberate simplification, not a data-integrity assumption. Never uses
   * `.single()`/`.maybeSingle()` here, since that would throw the moment a
   * person's second membership makes the row count genuinely > 1.
   */
  static async getFirmForPerson(personId: string): Promise<{ firm: Firm; member: FirmMember } | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("firm_members")
      .select("id, firm_id, person_id, role_id, status, invited_by, created_at, updated_at, firms(*)")
      .eq("person_id", personId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) throw new Error(error.message);
    const row = data?.[0];
    if (!row) return null;

    const { firms, ...member } = row as unknown as FirmMember & { firms: Firm };
    return { firm: firms, member };
  }

  static async getFirm(firmId: string): Promise<Firm | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("firms").select("*").eq("id", firmId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  static async createFirm(input: CreateFirmInput, ownerPersonId: string, ownerRoleId: string): Promise<Firm> {
    const supabase = await createServerSupabaseClient();
    const inviteCode = randomInviteCode();

    const { data: firm, error } = await supabase
      .from("firms")
      .insert({ ...input, invite_code: inviteCode })
      .select("*")
      .single();

    if (error || !firm) throw new Error(error?.message ?? "Failed to create firm.");

    const { error: memberError } = await supabase
      .from("firm_members")
      .insert({ firm_id: firm.id, person_id: ownerPersonId, role_id: ownerRoleId, status: "active" });

    if (memberError) throw new Error(memberError.message);

    return firm;
  }

  static async getFirmByInviteCode(code: string): Promise<Firm | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("firms").select("*").eq("invite_code", code.trim().toUpperCase()).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  static async joinFirm(firmId: string, personId: string, roleId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("firm_members")
      .upsert({ firm_id: firmId, person_id: personId, role_id: roleId, status: "active" }, { onConflict: "firm_id,person_id" });

    if (error) throw new Error(error.message);
  }

  static async listMembers(firmId: string): Promise<FirmMemberWithDetails[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("firm_members")
      // `firm_members` has two FKs into `people` (`person_id` and
      // `invited_by`) — PostgREST needs the column hint to know which one
      // "person" should embed, otherwise it fails with "more than one
      // relationship was found" (a real error, caught live during this
      // sprint's own verification).
      .select("id, firm_id, person_id, role_id, status, invited_by, created_at, updated_at, person:people!person_id(id, first_name, last_name, email, phone), role:roles(id, name, abbreviation)")
      .eq("firm_id", firmId)
      .order("created_at");

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as FirmMemberWithDetails[];
  }

  static async listInvitations(firmId: string): Promise<FirmInvitationWithRole[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("firm_invitations")
      .select("id, firm_id, email, role_id, invite_code, status, invited_by, created_at, accepted_at, role:roles(id, name)")
      .eq("firm_id", firmId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as FirmInvitationWithRole[];
  }

  static async createInvitation(params: { firmId: string; email: string; roleId: string; invitedBy: string }): Promise<FirmInvitation> {
    const supabase = await createServerSupabaseClient();
    const inviteCode = randomInviteCode();

    const { data, error } = await supabase
      .from("firm_invitations")
      .insert({ firm_id: params.firmId, email: params.email.trim().toLowerCase(), role_id: params.roleId, invite_code: inviteCode, invited_by: params.invitedBy })
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to create invitation.");
    return data;
  }
}
