"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPerson } from "@/lib/auth/current-person";
import { getProjectDocuments } from "@/lib/actions/document-actions";
import { getFirmContext, listFirmMembers } from "@/lib/actions/firm-actions";
import { listProjectTeam } from "@/lib/actions/project-actions";
import { listProjectInvitations } from "@/lib/actions/project-invitation-actions";
import { getDiscussions } from "@/lib/actions/discussion-actions";
import { FirmRepository } from "@/lib/repositories/firm-repository";
import { QuestionnaireRepository } from "@/lib/repositories/questionnaire-repository";
import { ProjectSetupService } from "@/lib/services/project-setup-service";
import { createServerSupabaseClient } from "@/supabase/server";

async function requireActorName(): Promise<string> {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in.");
  return `${person.first_name} ${person.last_name}`.trim();
}

/**
 * Sprint 5.7, Modules 12-14: the direct successor to
 * `getOnboardingContext()` — everything the Project Setup checklist and
 * Delta Review screens need, resumable from wherever the Lead Architect
 * left off.
 */
export async function getProjectSetupContext(projectId: string) {
  const supabase = await createServerSupabaseClient();

  const [{ data: project }, setupProgress, team, projectRoles, firmContext, questionnaire, documents, discussions, invitations] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
    ProjectSetupService.getProgress(projectId),
    listProjectTeam(projectId),
    FirmRepository.getProjectRoles(),
    getFirmContext(),
    QuestionnaireRepository.list(projectId),
    getProjectDocuments(projectId),
    getDiscussions(),
    listProjectInvitations(projectId),
  ]);

  const firmMembers = firmContext.firm ? await listFirmMembers(firmContext.firm.id) : [];
  const outstandingDiscussions = discussions.filter((discussion) => discussion.projectId === projectId && discussion.status === "open");

  return { project, setupProgress, team, projectRoles, firmMembers, questionnaire, documents, outstandingDiscussions, invitations };
}

/** Module 12: lightweight — just the checklist/percentage, reused by the Dashboard's gap detection. */
export async function getProjectSetupProgress(projectId: string) {
  return ProjectSetupService.getProgress(projectId);
}

export async function startProjectSetup(projectId: string) {
  const actorName = await requireActorName();
  return ProjectSetupService.getOrStart(projectId, actorName);
}

/**
 * Sprint 5.9, Module 4: no more separate "Mark Complete" click — saving an
 * answer itself runs `ProjectSetupService.processQuestionnaireAnswers()`,
 * which creates the real Knowledge Objects for any newly-answered question
 * and, the moment every question is answered, marks the step complete
 * (idempotent — never re-fires once already complete).
 */
export async function saveSetupQuestionnaireAnswer(projectId: string, questionKey: string, questionLabel: string, answerText: string) {
  const actorName = await requireActorName();
  const response = await QuestionnaireRepository.upsert(projectId, questionKey, questionLabel, answerText);
  await ProjectSetupService.processQuestionnaireAnswers(projectId, actorName);
  revalidatePath(`/projects/${projectId}/setup`);
  return response;
}

export async function generateProjectUnderstandingDraft(projectId: string) {
  return ProjectSetupService.generateProjectUnderstanding(projectId);
}

export async function confirmDeltaReviewAction(projectId: string, understandingText: string) {
  const actorName = await requireActorName();
  const setup = await ProjectSetupService.confirmDeltaReview(projectId, actorName, understandingText);
  revalidatePath(`/projects/${projectId}/setup/review`);
  return setup;
}

export async function activateProjectAction(projectId: string) {
  const actorName = await requireActorName();
  await ProjectSetupService.activateProject(projectId, actorName);
  revalidatePath(`/projects/${projectId}/setup/review`);
  revalidatePath(`/projects/${projectId}/dashboard`);
  revalidatePath(`/projects/${projectId}`);
}
