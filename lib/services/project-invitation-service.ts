import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { ProjectInvitationRepository } from "@/lib/repositories/project-invitation-repository";
import { DocumentRepository } from "@/lib/repositories/document-repository";
import { ProjectGovernanceRepository } from "@/lib/repositories/project-governance-repository";
import { createServerSupabaseClient } from "@/supabase/server";
import type { ProjectInvitation, ProjectInvitationLanding } from "@/lib/types/project-invitation";
import type { ProjectTeamMember } from "@/lib/actions/project-actions";

/**
 * Sprint 5.7, Modules 5-6: Project Invitations, separate from Firm
 * invitations. Registration happens AFTER invitation — this service is the
 * only way a person is offered project access; there is no "browse
 * projects" surface.
 */
export class ProjectInvitationService {
  static async invite(params: { projectId: string; inviteeName?: string; email?: string; phone?: string; roleId: string; roleName: string; isMainClientInvite?: boolean; invitedBy: string; invitedByName: string }): Promise<ProjectInvitation> {
    const invitation = await ProjectInvitationRepository.create(params);

    await publishSafely({
      eventType: EVENT_TYPES.PARTICIPANT_INVITED,
      actor: { type: "person", id: params.invitedByName },
      projectId: params.projectId,
      metadata: { title: params.inviteeName ?? params.email ?? params.phone ?? params.roleName, roleName: params.roleName, isMainClientInvite: params.isMainClientInvite ?? false },
    });

    return invitation;
  }

  static async getLandingByCode(code: string): Promise<ProjectInvitationLanding | null> {
    return ProjectInvitationRepository.getLandingByCode(code);
  }

  /**
   * Module 9: accepting a Main Client invitation sets
   * `projects.main_client_person_id` and, if an Agreement has already been
   * uploaded, advances the project from `draft` to `agreement_review` —
   * the moment the Main Client is actually able to review it. Every
   * acceptance upserts `project_team` (Module 5's Project Membership),
   * regardless of role.
   */
  static async acceptByCode(code: string, personId: string, personName: string): Promise<{ invitation: ProjectInvitation; membership: ProjectTeamMember }> {
    // The RPC validates and consumes the capability code before creating the
    // membership. This preserves RLS for ordinary project-team writes.
    const acceptedInvitation = await ProjectInvitationRepository.acceptByCode(code);
    const invitation = await ProjectInvitationRepository.getByCode(code) ?? acceptedInvitation;
    const supabase = await createServerSupabaseClient();

    const { data: memberRow, error: memberError } = await supabase
      .from("project_team")
      .select("id, person_id, role_id, people!person_id(first_name, last_name, email), roles(name)")
      .eq("project_id", invitation.project_id)
      .eq("person_id", personId)
      .eq("role_id", invitation.role_id)
      .eq("active", true)
      .single();

    if (memberError || !memberRow) throw new Error(memberError?.message ?? "Failed to add project membership.");

    if (invitation.is_main_client_invite) {
      const { error: projectError } = await supabase
        .from("projects")
        .update({ main_client_person_id: personId })
        .eq("id", invitation.project_id);
      if (projectError) throw new Error(projectError.message);

      const documents = await DocumentRepository.list(invitation.project_id);
      const hasAgreement = documents.some((doc) => doc.document_type_name === "Agreement");

      if (hasAgreement) {
        const { lifecycleStage } = await ProjectGovernanceRepository.get(invitation.project_id);
        if (lifecycleStage === "draft") {
          await ProjectGovernanceRepository.setLifecycleStage(invitation.project_id, "agreement_review");
        }
      }
    }

    await publishSafely({
      eventType: EVENT_TYPES.PARTICIPANT_JOINED,
      actor: { type: "person", id: personName },
      projectId: invitation.project_id,
      // Sprint 5.9, Module 1: `personId`/`invitedBy` (real UUIDs) added
      // alongside the existing display-name-as-actor-id convention, so the
      // Notifications subscriber can resolve real recipients (the new
      // member to exclude from "team member joined," the inviter to
      // notify for "invitation accepted") without guessing from a name.
      metadata: { title: personName, roleName: invitation.role_name, isMainClientInvite: invitation.is_main_client_invite, personId, invitedBy: invitation.invited_by },
    });

    const row = memberRow as unknown as { id: string; person_id: string; role_id: string; people: { first_name: string; last_name: string; email: string | null } | null; roles: { name: string } | null };

    return {
      invitation,
      membership: {
        id: row.id,
        personId: row.person_id,
        roleId: row.role_id,
        name: [row.people?.first_name, row.people?.last_name].filter(Boolean).join(" ") || personName,
        email: row.people?.email ?? null,
        role: row.roles?.name ?? "Member",
      },
    };
  }

  static async listByProject(projectId: string): Promise<ProjectInvitation[]> {
    return ProjectInvitationRepository.listByProject(projectId);
  }

  static async revoke(id: string): Promise<void> {
    return ProjectInvitationRepository.revoke(id);
  }
}
