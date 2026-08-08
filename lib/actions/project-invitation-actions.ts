"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPerson } from "@/lib/auth/current-person";
import { ProjectInvitationService } from "@/lib/services/project-invitation-service";

function displayName(person: { first_name: string; last_name: string }): string {
  return `${person.first_name} ${person.last_name}`.trim();
}

/** Sprint 5.7, Module 6: invites a person onto a project by role. Returns the invite code/record for the caller to share via WhatsApp/Copy Link/SMS/Email — no real delivery infrastructure this sprint, same scope as Firm invitations. */
export async function inviteProjectMember(params: { projectId: string; inviteeName?: string; email?: string; phone?: string; roleId: string; roleName: string; isMainClientInvite?: boolean }) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to invite a project member.");

  const invitation = await ProjectInvitationService.invite({ ...params, invitedBy: person.id, invitedByName: displayName(person) });
  revalidatePath(`/projects/${params.projectId}/participants`);
  return invitation;
}

/** Pre-auth safe read for the `/invite/[code]` landing page. */
export async function getProjectInvitationLanding(code: string) {
  return ProjectInvitationService.getLandingByCode(code);
}

export async function acceptProjectInvitationByCode(code: string) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to accept a project invitation.");

  const result = await ProjectInvitationService.acceptByCode(code, person.id, displayName(person));
  revalidatePath(`/projects/${result.invitation.project_id}`);
  return result;
}

export async function listProjectInvitations(projectId: string) {
  return ProjectInvitationService.listByProject(projectId);
}

export async function revokeProjectInvitation(id: string, projectId: string) {
  await ProjectInvitationService.revoke(id);
  revalidatePath(`/projects/${projectId}/participants`);
}
