"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPerson } from "@/lib/auth/current-person";
import { DelegationService } from "@/lib/services/delegation-service";
import type { CreateDelegationInput } from "@/lib/types/delegation";

function displayName(person: { first_name: string; last_name: string }): string {
  return `${person.first_name} ${person.last_name}`.trim();
}

/** Sprint 5.7, Module 8/9: creating a delegation. The UI is responsible for showing the "before delegation, display a confirmation explaining the implications" step (Module 9) before calling this. */
export async function createDelegation(input: Omit<CreateDelegationInput, "createdBy" | "createdByName">, delegatePersonName: string) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to delegate approval authority.");

  const delegation = await DelegationService.delegate({ ...input, createdBy: person.id, createdByName: displayName(person) }, delegatePersonName);
  revalidatePath(`/projects/${input.projectId}/participants`);
  return delegation;
}

export async function revokeDelegation(id: string, projectId: string, reason?: string) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to revoke a delegation.");

  const delegation = await DelegationService.revoke(id, person.id, displayName(person), reason);
  revalidatePath(`/projects/${projectId}/participants`);
  return delegation;
}

export async function listProjectDelegations(projectId: string) {
  return DelegationService.listByProject(projectId);
}
