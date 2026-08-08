import type { KnowledgeObjectType } from "@/types/knowledge-object";

/**
 * Project Setup types (Sprint 5.7, Modules 12-14) — the direct successor
 * to `lib/types/onboarding.ts`, same snake_case-mirrors-schema convention,
 * new step vocabulary matching the `project_setup` table's CHECK
 * constraint.
 */

export type ProjectSetupStep =
  | "team"
  | "consultants"
  | "client_representatives"
  | "import"
  | "questionnaire"
  | "review"
  | "completed";

export type ProjectSetup = {
  id: string;
  project_id: string;
  current_step: ProjectSetupStep;
  team_completed_at: string | null;
  consultants_completed_at: string | null;
  client_representatives_completed_at: string | null;
  import_completed_at: string | null;
  questionnaire_completed_at: string | null;
  review_completed_at: string | null;
  discussion_id: string | null;
  understanding_text: string | null;
  created_at: string;
  updated_at: string;
};

export type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
};

/**
 * Sprint 5.9.2: Project Activation reflects the real lifecycle of an
 * architectural project — Agreement approved, a Lead Architect, and a
 * Main Client are the ONLY mandatory conditions. Everything else
 * (Design Team, Consultants, Client Representatives, Import, Client
 * Questionnaire, Delta Review) is real, optional onboarding: always
 * visible, always actionable, never gating — it only ever reports
 * completion status, both before and after activation. Every item is
 * still computed live from real state, never a manually-clicked "Mark
 * Complete."
 */
export type SetupProgress = {
  setup: ProjectSetup;
  /** Exactly 3: Agreement Approved, Lead Architect, Main Client — the only conditions Project Activation ever checks. */
  mandatory: ChecklistItem[];
  /** All 3 `mandatory` items are done — the sole trigger for showing "Activate Project." */
  readyToActivate: boolean;
  /** Design Team / Consultants / Client Representatives / Import / Client Questionnaire / Delta Review — informational only, never gates anything, before or after activation. */
  onboarding: ChecklistItem[];
  onboardingPercentComplete: number;
};

/**
 * Module 13's exact dimensions: Requirements/Constraints/Preferences/Risks.
 * Direct evolution of the Sprint 5.4 QUESTIONNAIRE_QUESTIONS — budget and
 * schedule sensitivity now map to "constraint" (not "requirement"), and
 * two new "preference"-typed questions were added, so all four
 * KnowledgeObjectType destinations Module 13 names are actually produced.
 */
export type QuestionnaireQuestion = {
  key: string;
  label: string;
  placeholder: string;
  knowledgeObjectType: KnowledgeObjectType;
};

export const SETUP_QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = [
  { key: "project_goals", label: "Project goals", placeholder: "What is this project trying to achieve?", knowledgeObjectType: "requirement" },
  { key: "client_priorities", label: "Client priorities", placeholder: "What matters most to the client?", knowledgeObjectType: "requirement" },
  { key: "budget_sensitivity", label: "Budget sensitivity", placeholder: "How flexible is the budget?", knowledgeObjectType: "constraint" },
  { key: "schedule_sensitivity", label: "Schedule sensitivity", placeholder: "Are there fixed dates or milestones?", knowledgeObjectType: "constraint" },
  { key: "future_expansion", label: "Future expansion", placeholder: "Should the design allow for future growth?", knowledgeObjectType: "requirement" },
  { key: "accessibility_needs", label: "Accessibility needs", placeholder: "Any specific accessibility requirements?", knowledgeObjectType: "requirement" },
  { key: "sustainability_aspirations", label: "Sustainability aspirations", placeholder: "Any sustainability or environmental goals?", knowledgeObjectType: "requirement" },
  { key: "special_requirements", label: "Special requirements", placeholder: "Anything else the design must account for?", knowledgeObjectType: "requirement" },
  { key: "material_preferences", label: "Material preferences", placeholder: "Any preferred materials, finishes, or palettes?", knowledgeObjectType: "preference" },
  { key: "style_preferences", label: "Style preferences", placeholder: "Any preferred architectural style or precedent?", knowledgeObjectType: "preference" },
  { key: "risks_or_concerns", label: "Risks or concerns", placeholder: "What could go wrong, or what worries the client?", knowledgeObjectType: "risk" },
  { key: "additional_comments", label: "Additional comments", placeholder: "Anything else worth capturing?", knowledgeObjectType: "requirement" },
];
