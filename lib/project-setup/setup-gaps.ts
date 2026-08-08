import { getProjectDocuments } from "@/lib/actions/document-actions";
import { getProjectSetupProgress } from "@/lib/actions/project-setup-actions";
import { listProjectTeam } from "@/lib/actions/project-actions";

/**
 * Sprint 5.7: direct successor to `lib/onboarding/onboarding-gaps.ts`
 * (deleted along with the rest of the Onboarding module) — same "single
 * source of truth for project-completeness gaps" role, reused by the
 * Recommendation Engine's gap rules and the Dashboard's Attention Center.
 * Computed live from real project data every time — never cached, never
 * stale, same discipline as its predecessor.
 */
/**
 * Deliberately separate from `lib/participants/role-categories.ts`
 * (Sprint 5.9) — this is a soft "nudge" list feeding the Recommendation
 * Engine (something is *missing*, not gating anything), while
 * `role-categories.ts` is the hard gate Project Setup's own progression
 * uses. The two lists are allowed to diverge (e.g. "Client Representative"
 * is always wanted here but optional there) — do not merge them.
 */
export const CORE_PROJECT_ROLES = ["Lead Architect", "Structural Engineer", "MEP Engineer", "Client Representative"];
export const KEY_DOCUMENT_TYPES = ["Agreement", "BOQ", "Drawing", "Specification"];

export type ProjectSetupGaps = {
  missingRoles: string[];
  filledTeam: { name: string; role: string }[];
  missingDocumentTypes: string[];
  questionnaireIncomplete: boolean;
};

export async function getProjectSetupGaps(projectId: string): Promise<ProjectSetupGaps> {
  const [team, documents, progress] = await Promise.all([listProjectTeam(projectId), getProjectDocuments(projectId), getProjectSetupProgress(projectId)]);

  const filledRoles = new Set(team.map((member) => member.role));
  const missingRoles = CORE_PROJECT_ROLES.filter((role) => !filledRoles.has(role));

  const uploadedTypes = new Set(documents.map((document) => document.document_type_name).filter((name): name is string => Boolean(name)));
  const missingDocumentTypes = KEY_DOCUMENT_TYPES.filter((type) => !uploadedTypes.has(type));

  const questionnaireIncomplete = !progress?.setup.questionnaire_completed_at;

  return {
    missingRoles,
    filledTeam: team.map((member) => ({ name: member.name, role: member.role })),
    missingDocumentTypes,
    questionnaireIncomplete,
  };
}
