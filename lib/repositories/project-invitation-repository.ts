import { createServerSupabaseClient } from "@/supabase/server";
import { createServiceSupabaseClient } from "@/supabase/service";
import type { ProjectInvitation, ProjectInvitationLanding } from "@/lib/types/project-invitation";

function randomInviteCode(): string {
  const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${segment()}-${segment()}`;
}

type InvitationRow = ProjectInvitation & {
  roles: { name: string } | null;
};

/**
 * Real, Supabase-backed repository (Sprint 5.7), matching
 * `FirmRepository`'s exact pattern for `firm_invitations`. Project
 * invitations are a separate table from `firm_invitations` by design
 * (Module 5) — same shape, different scope.
 */
export class ProjectInvitationRepository {
  static async create(params: { projectId: string; inviteeName?: string; email?: string; phone?: string; roleId: string; isMainClientInvite?: boolean; invitedBy: string }): Promise<ProjectInvitation> {
    const supabase = await createServerSupabaseClient();
    const inviteCode = randomInviteCode();

    const { data, error } = await supabase
      .from("project_invitations")
      .insert({
        project_id: params.projectId,
        invitee_name: params.inviteeName?.trim() || null,
        email: params.email?.trim().toLowerCase() || null,
        phone: params.phone?.trim() || null,
        role_id: params.roleId,
        invite_code: inviteCode,
        is_main_client_invite: params.isMainClientInvite ?? false,
        invited_by: params.invitedBy,
      })
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to create invitation.");
    return data;
  }

  /** Used post-auth by `acceptByCode()` — the request-scoped, `authenticated`-RLS client is fine here since the person is already signed in by this point. */
  static async getByCode(code: string): Promise<ProjectInvitation | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("project_invitations")
      .select("*, roles(name)")
      .eq("invite_code", code.trim().toUpperCase())
      .maybeSingle<InvitationRow>();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const { roles, ...invitation } = data;
    return { ...invitation, role_name: roles?.name };
  }

  /**
   * Called from the pre-auth `/invite/[code]` landing page (Module 6:
   * "Registration should happen after invitation") — the requester has no
   * Supabase session yet, so the request-scoped client's `authenticated`
   * RLS policies would deny it. Uses the service-role client deliberately,
   * the same trusted-server-only-bootstrap pattern
   * `ensurePersonForAuthUser()` already established for the equivalent
   * pre-auth read in the registration flow.
   */
  static async getLandingByCode(code: string): Promise<ProjectInvitationLanding | null> {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("project_invitations")
      .select("*, roles(name), people!invited_by(first_name, last_name), projects(name)")
      .eq("invite_code", code.trim().toUpperCase())
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const row = data as unknown as ProjectInvitation & {
      roles: { name: string } | null;
      people: { first_name: string; last_name: string } | null;
      projects: { name: string } | null;
    };

    const { roles, people, projects, ...invitation } = row;

    return {
      invitation: { ...invitation, role_name: roles?.name },
      projectId: invitation.project_id,
      projectName: projects?.name ?? "this project",
      roleName: roles?.name ?? "Team Member",
      invitedByName: people ? `${people.first_name} ${people.last_name}`.trim() : "the project team",
    };
  }

  static async listByProject(projectId: string): Promise<ProjectInvitation[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("project_invitations")
      .select("*, roles(name)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .returns<InvitationRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(({ roles, ...row }) => ({ ...row, role_name: roles?.name }));
  }

  static async markAccepted(id: string): Promise<ProjectInvitation> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("project_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to accept invitation.");
    return data;
  }

  static async acceptByCode(code: string): Promise<ProjectInvitation> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("accept_project_invitation", {
      p_invite_code: code.trim().toUpperCase(),
    });

    const invitation = Array.isArray(data) ? data[0] : data;
    if (error || !invitation) {
      throw new Error(error?.message ?? "Failed to accept invitation.");
    }

    return invitation as ProjectInvitation;
  }

  static async revoke(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("project_invitations").update({ status: "revoked" }).eq("id", id);
    if (error) throw new Error(error.message);
  }
}
