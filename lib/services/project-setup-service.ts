import { createDiscussion } from "@/lib/actions/discussion-actions";
import { createKnowledgeObject } from "@/lib/actions/knowledge-object-actions";
import { getAllKnowledgeObjects } from "@/lib/actions/knowledge-object-actions";
import { getProjectDocuments } from "@/lib/actions/document-actions";
import { listProjectTeam } from "@/lib/actions/project-actions";
import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { CLIENT_REPRESENTATIVES_SECTION_ROLES, CONSULTANTS_SECTION_ROLES, DESIGN_TEAM_SECTION_ROLES } from "@/lib/participants/role-categories";
import { ProjectSetupRepository } from "@/lib/repositories/project-setup-repository";
import { ProjectGovernanceRepository } from "@/lib/repositories/project-governance-repository";
import { QuestionnaireRepository } from "@/lib/repositories/questionnaire-repository";
import { SETUP_QUESTIONNAIRE_QUESTIONS } from "@/lib/types/project-setup";
import { createServerSupabaseClient } from "@/supabase/server";
import type { ChecklistItem, ProjectSetup, SetupProgress } from "@/lib/types/project-setup";

/**
 * Sprint 5.7, Modules 12-14: Project Setup orchestration — the direct
 * successor to `OnboardingService`. Each step's REAL data is persisted
 * directly into its own real table (team/consultants/client reps onto
 * `project_team` via existing actions, import via the existing Import
 * Workspace, questionnaire answers onto `project_questionnaire_responses`
 * then into real Knowledge Objects) — `project_setup` only ever records
 * which step to resume at and when each was confirmed done, the same
 * "resumable progress marker, not a data store" discipline
 * `project_onboarding` established.
 */
export class ProjectSetupService {
  static async getOrStart(projectId: string, actorName: string): Promise<ProjectSetup> {
    const existing = await ProjectSetupRepository.get(projectId);
    if (existing) return existing;

    const setup = await ProjectSetupRepository.create(projectId);

    await publishSafely({
      eventType: EVENT_TYPES.PROJECT_SETUP_STEP_COMPLETED,
      actor: { type: "person", id: actorName },
      projectId,
      metadata: { title: "Project Setup started" },
    });

    return setup;
  }

  /**
   * Sprint 5.9.2: Project Activation reflects the real lifecycle of an
   * architectural project — Agreement approved, a Lead Architect, and a
   * Main Client are the ONLY conditions that ever gate anything.
   * Consultants, additional Design Team members, Client Representatives,
   * Import, the Client Questionnaire, and Delta Review are real, optional
   * onboarding: always visible, always actionable, reported here purely
   * as completion status — never a prerequisite for `activateProject()`.
   * Every item is computed live from real state, no manual "Mark Complete."
   */
  static async getProgress(projectId: string): Promise<SetupProgress | null> {
    const setup = await ProjectSetupRepository.get(projectId);
    if (!setup) return null;

    const [team, governance, responses, documents] = await Promise.all([
      listProjectTeam(projectId),
      ProjectGovernanceRepository.get(projectId),
      QuestionnaireRepository.list(projectId),
      getProjectDocuments(projectId),
    ]);

    const agreementApproved = governance.lifecycleStage !== "draft" && governance.lifecycleStage !== "agreement_review";
    const leadArchitectAssigned = team.some((member) => member.role === "Lead Architect" || member.role === "Owner");
    const mainClientAssigned = Boolean(governance.mainClientPersonId);

    const mandatory: ChecklistItem[] = [
      { key: "agreement_approved", label: "Agreement Approved", done: agreementApproved },
      { key: "lead_architect", label: "Lead Architect Assigned", done: leadArchitectAssigned },
      { key: "main_client", label: "Main Client Assigned", done: mainClientAssigned },
    ];
    const readyToActivate = mandatory.every((item) => item.done);

    const questionnaireDone = SETUP_QUESTIONNAIRE_QUESTIONS.every((question) => responses.find((response) => response.question_key === question.key)?.answer_text?.trim());
    const importDone = documents.some((document) => document.document_type_name !== "Agreement");

    const onboarding: ChecklistItem[] = [
      { key: "design_team", label: "Design Team", done: team.some((member) => DESIGN_TEAM_SECTION_ROLES.includes(member.role)) },
      { key: "consultants", label: "Consultants", done: team.some((member) => CONSULTANTS_SECTION_ROLES.includes(member.role)) },
      { key: "client_representatives", label: "Client Representatives", done: team.some((member) => CLIENT_REPRESENTATIVES_SECTION_ROLES.includes(member.role)) },
      { key: "import", label: "Import Existing Project", done: importDone },
      { key: "questionnaire", label: "Client Questionnaire", done: questionnaireDone },
      { key: "review", label: "Delta Review", done: Boolean(setup.review_completed_at) },
    ];
    const onboardingPercentComplete = Math.round((onboarding.filter((item) => item.done).length / onboarding.length) * 100);

    return { setup, mandatory, readyToActivate, onboarding, onboardingPercentComplete };
  }

  /**
   * Module 13: Client Questionnaire. Direct evolution of
   * `OnboardingService.completeQuestionnaireStep()` — same real
   * `QuestionnaireRepository` + unmodified `KnowledgeObjectService.create()`
   * (via `createKnowledgeObject`), now covering `SETUP_QUESTIONNAIRE_QUESTIONS`'s
   * "constraint"/"preference" destinations alongside "requirement"/"risk".
   * Every created object lands `status: "open"`, `validationState: "pending"`
   * by construction (`KnowledgeObjectService.create()`'s own default) — this
   * IS Module 13's "remain pending until Lead Architect confirms," not new logic.
   *
   * Sprint 5.9, Module 4: no more separate "Mark Complete" click — this now
   * runs after every saved answer (`saveQuestionnaireAnswer()` below).
   * Turning each newly-answered question into a real Knowledge Object is
   * already naturally idempotent (only responses lacking a
   * `knowledge_object_id` are processed); the completion timestamp/event
   * are additionally guarded so they only fire once, the moment every
   * question first becomes answered — never re-fired on a later edit.
   */
  static async processQuestionnaireAnswers(projectId: string, actorName: string): Promise<ProjectSetup> {
    let setup = await ProjectSetupRepository.get(projectId);
    if (!setup) throw new Error("Project Setup has not been started for this project.");

    let discussionId = setup.discussion_id;
    const responses = await QuestionnaireRepository.list(projectId);
    const answered = responses.filter((response) => response.answer_text?.trim() && !response.knowledge_object_id);

    if (answered.length > 0 && !discussionId) {
      const discussion = await createDiscussion({
        title: "Client Questionnaire",
        type: "REQ",
        summary: answered.map((response) => `${response.question_label}: ${response.answer_text}`),
        projectId,
      });
      discussionId = discussion.id;
      setup = await ProjectSetupRepository.update(projectId, { discussion_id: discussionId });
    }

    for (const response of answered) {
      const question = SETUP_QUESTIONNAIRE_QUESTIONS.find((candidate) => candidate.key === response.question_key);
      const knowledgeObject = await createKnowledgeObject({
        projectId,
        discussionId: discussionId!,
        type: question?.knowledgeObjectType ?? "requirement",
        title: response.question_label,
        description: response.answer_text!,
        priority: "medium",
        status: "open",
        relatedTopics: ["Project Setup"],
        createdBy: actorName,
      });
      await QuestionnaireRepository.markKnowledgeObjectId(response.id, knowledgeObject.id);
    }

    const allResponses = await QuestionnaireRepository.list(projectId);
    const allAnswered = SETUP_QUESTIONNAIRE_QUESTIONS.every((question) => allResponses.find((response) => response.question_key === question.key)?.answer_text?.trim());

    if (allAnswered && !setup.questionnaire_completed_at) {
      setup = await ProjectSetupRepository.update(projectId, { current_step: "review", questionnaire_completed_at: new Date().toISOString() });

      await publishSafely({
        eventType: EVENT_TYPES.QUESTIONNAIRE_COMPLETED,
        actor: { type: "person", id: actorName },
        projectId,
        metadata: { title: "Client questionnaire" },
      });
    }

    return setup;
  }

  /**
   * Module 14: Delta Project Review. Composes real, already-collected data
   * into a deterministic (never LLM — this codebase has no AI/LLM SDK
   * anywhere) narrative, the direct successor to
   * `generateOnboardingSummary()` but broader per Module 14's own named
   * sections: Project Understanding, Imported Documents, Requirements/
   * Constraints/Preferences/Risks, Missing Information, Outstanding
   * Discussions.
   */
  static async generateProjectUnderstanding(projectId: string): Promise<string> {
    const supabase = await createServerSupabaseClient();
    const [{ data: project }, documents, allObjects] = await Promise.all([
      supabase.from("projects").select("client, location, type").eq("id", projectId).maybeSingle(),
      getProjectDocuments(projectId),
      getAllKnowledgeObjects(),
    ]);

    const objects = allObjects.filter((object) => object.projectId === projectId);
    const countByType = (type: string) => objects.filter((object) => object.type === type).length;

    const buildingType = project?.type?.trim() || "project";
    const clientClause = project?.client?.trim() ? ` for ${project.client.trim()}` : "";
    const locationClause = project?.location?.trim() ? ` located in ${project.location.trim()}` : "";

    const sentences: string[] = [`This is a ${buildingType.toLowerCase()}${clientClause}${locationClause}.`];

    const uploadedCategoryLabels = [...new Set(documents.map((document) => document.document_type_name).filter((name): name is string => Boolean(name)))];
    sentences.push(
      uploadedCategoryLabels.length > 0
        ? `${uploadedCategoryLabels.join(", ")} ${uploadedCategoryLabels.length === 1 ? "has" : "have"} been imported.`
        : "No documents have been imported yet.",
    );

    sentences.push(
      `Delta has captured ${countByType("requirement")} requirement(s), ${countByType("constraint")} constraint(s), ${countByType("preference")} preference(s), and ${countByType("risk")} risk(s) so far, ${objects.filter((object) => object.validationState === "pending").length} of which are still pending confirmation.`,
    );

    return sentences.join(" ");
  }

  static async confirmDeltaReview(projectId: string, actorName: string, understandingText: string): Promise<ProjectSetup> {
    const updated = await ProjectSetupRepository.update(projectId, { review_completed_at: new Date().toISOString(), understanding_text: understandingText, current_step: "completed" });

    await publishSafely({
      eventType: EVENT_TYPES.DELTA_REVIEW_CONFIRMED,
      actor: { type: "person", id: actorName },
      projectId,
    });

    return updated;
  }

  /**
   * Sprint 5.9.2: Project Activation reflects the real lifecycle of an
   * architectural project. Agreement approval, a Lead Architect, and a
   * Main Client are the ONLY conditions — Delta Review, the Client
   * Questionnaire, Consultants, Design Team, Client Representatives, and
   * Import are real onboarding that continues after activation, never a
   * prerequisite for it (a structural/MEP/landscape consultant is
   * routinely appointed well after a project starts; Delta Review
   * confirms understanding of the project's knowledge, it is not project
   * approval and was never meant to gate the collaborative workspace).
   */
  static async activateProject(projectId: string, actorName: string): Promise<void> {
    const progress = await this.getProgress(projectId);
    if (!progress?.readyToActivate) {
      throw new Error("Agreement approval, a Lead Architect, and a Main Client are required before activating the project.");
    }

    await ProjectGovernanceRepository.setLifecycleStage(projectId, "active");

    await publishSafely({
      eventType: EVENT_TYPES.PROJECT_ACTIVATED,
      actor: { type: "person", id: actorName },
      projectId,
    });
  }
}
