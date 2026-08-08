import { getProjectMainClient, listProjectTeam, type ProjectTeamMember } from "@/lib/actions/project-actions";

/**
 * Sprint 5.9, Module 1: every recipient is resolved from real, already-
 * existing project data (`project_team`, `projects.main_client_person_id`)
 * — never a fabricated or guessed audience. Shared by
 * `NotificationService.handleEvent()`'s per-type dispatch.
 *
 * Deliberately calls only `"use server"` actions (`listProjectTeam`/
 * `getProjectMainClient`), never `ProjectGovernanceRepository` directly —
 * this module is reachable from a client bundle via
 * `notifications-subscriber.ts` -> `event-publisher.ts` ->
 * `revision-service.ts` -> ... -> `useDeltaPanel.ts`, and the plain
 * repository class depends on `next/headers`. Routing through the
 * existing action instead is the same fix Sprint 5.4 already established
 * for this exact class of bug.
 */

export async function resolveLeadArchitects(projectId: string): Promise<ProjectTeamMember[]> {
  const team = await listProjectTeam(projectId);
  return team.filter((member) => member.role === "Lead Architect" || member.role === "Owner");
}

export async function resolveMainClientPersonId(projectId: string): Promise<string | null> {
  const mainClient = await getProjectMainClient(projectId);
  return mainClient.personId;
}

/** The Lead Architect(s) and the Main Client — the two parties an Agreement clause Discussion is between. */
export async function resolveAgreementParties(projectId: string): Promise<{ leadArchitectIds: string[]; mainClientPersonId: string | null }> {
  const [leadArchitects, mainClientPersonId] = await Promise.all([resolveLeadArchitects(projectId), resolveMainClientPersonId(projectId)]);
  return { leadArchitectIds: leadArchitects.map((member) => member.personId), mainClientPersonId };
}

/** Every active project_team member except the one given (e.g. the person who just joined, or the actor of an action). */
export async function resolveTeamExcluding(projectId: string, excludePersonId: string | null): Promise<ProjectTeamMember[]> {
  const team = await listProjectTeam(projectId);
  return team.filter((member) => member.personId !== excludePersonId);
}
