import type { ProjectSetupGaps } from "@/lib/project-setup/setup-gaps";
import type { SetupProgress } from "@/lib/types/project-setup";
import type { Discussion } from "@/types/discussion";
import type { KnowledgeObject } from "@/types/knowledge-object";
import type { Recommendation } from "@/types/recommendation";
import type { Relationship } from "@/types/relationship";
import type { Revision } from "@/types/revision-intelligence";
import type { Source } from "@/types/project-intelligence-gateway";

/**
 * The one raw-data bundle every Mission Control computation (`project-health.ts`,
 * `attention-center.ts`, `generate-briefing.ts`) and Delta's dashboard
 * questions (`dashboard-query.ts`) share — assembled exactly once, by
 * `getMissionControlData()` (`lib/actions/dashboard-actions.ts`), from
 * projections and services every prior sprint already built. Nothing in
 * this file fetches anything; it only describes the shape both the UI and
 * Delta consume, so there is exactly one place gap detection, health, and
 * the briefing are computed — never two.
 */
export type MissionControlRawData = {
  projectId: string;
  /** Already filtered to this project (`KnowledgeObject.projectId === projectId`) — `getAllKnowledgeObjects()` itself is not project-scoped. */
  knowledgeObjects: KnowledgeObject[];
  /** Unfiltered by `projectId` — the same pre-existing `Discussion` gap every other feature in this codebase inherits (no `Discussion.projectId` field exists). */
  discussions: Discussion[];
  recommendations: Recommendation[];
  revisions: Revision[];
  sources: Source[];
  relationships: Relationship[];
  /** Sprint 5.7: successor to `onboardingGaps` — Project Setup's own gap detection (missing roles/documents/questionnaire), reused post-activation as an ongoing project-health signal. */
  setupGaps: ProjectSetupGaps;
  /** Sprint 5.9.2: Project Setup's own 3-mandatory/6-optional-onboarding model (`ProjectSetupService.getProgress()`) — the Attention Center surfaces incomplete onboarding items as recommendations here, never as a blocker (onboarding never gates activation or workspace access). */
  setupProgress: SetupProgress | null;
};
