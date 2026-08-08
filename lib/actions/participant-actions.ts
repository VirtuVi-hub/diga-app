"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPerson } from "@/lib/auth/current-person";
import { requireAgreementRole } from "@/lib/permissions/agreement-role";
import { ParticipantEngineService, type AddParticipantInput, type AddParticipantResult } from "@/lib/services/participant-engine-service";

function displayName(person: { first_name: string; last_name: string }): string {
  return `${person.first_name} ${person.last_name}`.trim();
}

/**
 * The One Invitation Engine's single write path — every project
 * participant is added through this action, never a second, duplicated
 * form. Role filtering per Project Setup section happens client-side in
 * `AddParticipantFlow` via the pure, I/O-free
 * `lib/participants/role-categories.ts` over the caller's already-fetched
 * `firmMembers`/`projectRoles`.
 *
 * Preserves the one real, pre-existing authorization check this
 * consolidation could otherwise have silently dropped: only the Lead
 * Architect may invite the Main Client (previously enforced in the
 * now-superseded `inviteAgreementMainClient()`).
 */
export async function addParticipant(input: AddParticipantInput): Promise<AddParticipantResult> {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to add a project participant.");

  if (input.isMainClientInvite) {
    await requireAgreementRole(input.projectId, ["lead_architect"], "Only the Lead Architect may invite the Main Client.");
  }

  const result = await ParticipantEngineService.addParticipant(input, { id: person.id, name: displayName(person) });

  revalidatePath(`/projects/${input.projectId}/setup`);
  revalidatePath(`/projects/${input.projectId}/participants`);
  revalidatePath(`/projects/${input.projectId}/agreement`);

  return result;
}
