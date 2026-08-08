import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { FirmRepository } from "@/lib/repositories/firm-repository";
import { DocumentRepository } from "@/lib/repositories/document-repository";
import { ProjectGovernanceRepository } from "@/lib/repositories/project-governance-repository";
import { ProjectInvitationService } from "@/lib/services/project-invitation-service";
import { createServerSupabaseClient } from "@/supabase/server";
import type { ProjectTeamMember } from "@/lib/actions/project-actions";
import type { ProjectInvitation } from "@/lib/types/project-invitation";

export type AddParticipantInput = {
  projectId: string;
  roleId: string;
  roleName: string;
  isMainClientInvite?: boolean;
  /** Branch A: an already-known Firm member, picked explicitly from the roster. */
  existingPersonId?: string;
  /** Branch B: an external person, not yet a Firm member. */
  inviteeName?: string;
  email?: string;
  phone?: string;
};

export type AddParticipantResult =
  | { branch: "instant_assign"; membership: ProjectTeamMember }
  | { branch: "invited"; invitation: ProjectInvitation };

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Sprint 5.9, Module 3: the ONE invitation engine's single server entry
 * point, with two branches — per the product decision this sprint locked
 * in: "There should still be ONE invitation engine. The engine first
 * determines: Is this person already a Firm member? YES -> internal
 * assignment. NO -> external invitation." Every project participant
 * (Design Team, Consultants, Client Representatives, Main Client,
 * Participants page) calls this one method — no duplicated invite logic
 * anywhere else in the codebase.
 */
export class ParticipantEngineService {
  static async addParticipant(input: AddParticipantInput, actor: { id: string; name: string }): Promise<AddParticipantResult> {
    let existingPersonId = input.existingPersonId;

    // If the caller didn't explicitly pick an existing Firm member but the
    // entered email/phone matches one anyway, silently take Branch A —
    // "the engine first determines," not the UI toggle alone.
    if (!existingPersonId && (input.email || input.phone)) {
      existingPersonId = await this.findMatchingFirmMember(input.projectId, input.email, input.phone);
    }

    if (existingPersonId) {
      const membership = await this.instantAssign(input, existingPersonId, actor);
      return { branch: "instant_assign", membership };
    }

    const invitation = await ProjectInvitationService.invite({
      projectId: input.projectId,
      inviteeName: input.inviteeName,
      email: input.email,
      phone: input.phone,
      roleId: input.roleId,
      roleName: input.roleName,
      isMainClientInvite: input.isMainClientInvite,
      invitedBy: actor.id,
      invitedByName: actor.name,
    });

    return { branch: "invited", invitation };
  }

  /**
   * Case-insensitive email / digit-normalized phone match against the
   * inviting project's own Firm roster. Email-only matching is the honest
   * limit today — `FirmRepository.listMembers()`'s `person` projection now
   * carries `phone` (Sprint 5.9 addition), so both are checked.
   */
  private static async findMatchingFirmMember(projectId: string, email?: string, phone?: string): Promise<string | undefined> {
    if (!email && !phone) return undefined;

    const supabase = await createServerSupabaseClient();
    const { data: project } = await supabase.from("projects").select("firm_id").eq("id", projectId).maybeSingle<{ firm_id: string | null }>();
    if (!project?.firm_id) return undefined;

    const members = await FirmRepository.listMembers(project.firm_id);
    const normalizedEmail = email?.trim().toLowerCase() || null;
    const normalizedPhone = phone ? normalizePhoneDigits(phone) : null;

    const match = members.find((member) => {
      if (member.status !== "active" || !member.person) return false;
      const personEmail = member.person.email?.trim().toLowerCase() || null;
      const personPhone = member.person.phone ? normalizePhoneDigits(member.person.phone) : null;
      return (normalizedEmail && personEmail === normalizedEmail) || (normalizedPhone && personPhone === normalizedPhone);
    });

    return match?.person_id;
  }

  /**
   * Branch A: instant, no accept step — reuses the same `project_team`
   * upsert shape `ProjectInvitationService.acceptByCode()` already uses,
   * and performs the same Main-Client governance side effect
   * (`main_client_person_id` + lifecycle advance) for the rare edge case
   * where the assigned Main Client already happens to be a Firm member.
   */
  private static async instantAssign(input: AddParticipantInput, personId: string, actor: { id: string; name: string }): Promise<ProjectTeamMember> {
    const supabase = await createServerSupabaseClient();

    const { data: memberRow, error } = await supabase
      .from("project_team")
      .upsert(
        { project_id: input.projectId, person_id: personId, role_id: input.roleId, active: true, status: "active", invited_by: actor.id },
        { onConflict: "project_id,person_id,role_id" },
      )
      .select("id, person_id, role_id, people!person_id(first_name, last_name, email), roles(name)")
      .single();

    if (error || !memberRow) throw new Error(error?.message ?? "Failed to add this person to the project.");

    const row = memberRow as unknown as { id: string; person_id: string; role_id: string; people: { first_name: string; last_name: string; email: string | null } | null; roles: { name: string } | null };
    const memberName = [row.people?.first_name, row.people?.last_name].filter(Boolean).join(" ") || "Unnamed";

    if (input.isMainClientInvite) {
      const { error: projectError } = await supabase.from("projects").update({ main_client_person_id: personId }).eq("id", input.projectId);
      if (projectError) throw new Error(projectError.message);

      const documents = await DocumentRepository.list(input.projectId);
      const hasAgreement = documents.some((doc) => doc.document_type_name === "Agreement");
      if (hasAgreement) {
        const { lifecycleStage } = await ProjectGovernanceRepository.get(input.projectId);
        if (lifecycleStage === "draft") {
          await ProjectGovernanceRepository.setLifecycleStage(input.projectId, "agreement_review");
        }
      }
    }

    await publishSafely({
      eventType: EVENT_TYPES.PARTICIPANT_JOINED,
      actor: { type: "person", id: actor.name },
      projectId: input.projectId,
      metadata: { title: memberName, roleName: input.roleName, isMainClientInvite: input.isMainClientInvite ?? false, branch: "instant_assign", personId, invitedBy: actor.id },
    });

    return {
      id: row.id,
      personId: row.person_id,
      roleId: row.role_id,
      name: memberName,
      email: row.people?.email ?? null,
      role: row.roles?.name ?? "Member",
    };
  }
}
