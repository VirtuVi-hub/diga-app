import { RECOMMENDATION_TYPES } from "@/lib/recommendations/recommendation-types";
import type { HealthMetric } from "@/lib/types/dashboard";
import type { MissionControlRawData } from "./mission-control-types";

const DAY_MS = 86_400_000;
const RECENT_REVISION_WINDOW_DAYS = 30;

const ONBOARDING_GAP_RECOMMENDATION_TYPES: string[] = [
  RECOMMENDATION_TYPES.INVITE_MISSING_CONSULTANTS,
  RECOMMENDATION_TYPES.UPLOAD_MISSING_AGREEMENT,
  RECOMMENDATION_TYPES.UPLOAD_MISSING_BOQ,
  RECOMMENDATION_TYPES.UPLOAD_MISSING_DRAWINGS,
  // Sprint 5.6: "Specification" joined `KEY_DOCUMENT_TYPES` — this
  // recommendation reflects the exact same gap the "Missing onboarding"
  // Attention Center item (below) already counts, so it's excluded here
  // too, matching the other three missing-document types.
  RECOMMENDATION_TYPES.UPLOAD_MISSING_SPECIFICATIONS,
  RECOMMENDATION_TYPES.COMPLETE_QUESTIONNAIRE,
];

/**
 * Module 3: Project Health. Every value is derived from data another sprint
 * already built and persists nothing new — no hardcoded percentages, and
 * "Not Available" (never a fabricated number) when a metric genuinely can't
 * be computed honestly yet (only Knowledge Coverage, when a project has zero
 * Knowledge Objects: 0/0 is undefined, not 0%).
 *
 * "Pending Approvals" and "Open Validation Requests" are deliberately two
 * distinct, real counts rather than the same signal shown twice: Pending
 * Approvals is the narrower set — `validationState === "pending"` AND a
 * named approver is required (`approvalRequiredFrom` is non-empty) — while
 * Open Validation Requests is the broader set — every Knowledge Object not
 * yet validated at all, regardless of whether anyone specific was asked to.
 */
export function computeProjectHealth(data: MissionControlRawData): HealthMetric[] {
  const { knowledgeObjects, discussions, recommendations, revisions, relationships } = data;

  const openRecommendations = recommendations.filter((recommendation) => recommendation.status === "open");

  const pendingApprovals = knowledgeObjects.filter((object) => object.validationState === "pending" && (object.approvalRequiredFrom?.length ?? 0) > 0);
  const openValidationRequests = knowledgeObjects.filter((object) => object.validationState === "pending");

  const recentCutoff = Date.now() - RECENT_REVISION_WINDOW_DAYS * DAY_MS;
  const recentRevisions = revisions.filter((revision) => new Date(revision.timestamp).getTime() >= recentCutoff);

  const missingOnboardingItems = data.setupGaps.missingRoles.length + data.setupGaps.missingDocumentTypes.length + (data.setupGaps.questionnaireIncomplete ? 1 : 0);

  const connectedNodeIds = new Set<string>();
  for (const relationship of relationships) {
    connectedNodeIds.add(relationship.nodeA.id);
    connectedNodeIds.add(relationship.nodeB.id);
  }
  const connectedKnowledgeObjects = knowledgeObjects.filter((object) => connectedNodeIds.has(object.id));
  const knowledgeCoverage: HealthMetric["value"] = knowledgeObjects.length === 0 ? "Not Available" : Math.round((connectedKnowledgeObjects.length / knowledgeObjects.length) * 100);

  return [
    { key: "knowledgeObjects", label: "Knowledge Objects", value: knowledgeObjects.length, unit: "count", detail: "Requirements, Decisions, Actions, Issues, and Risks raised in this project." },
    { key: "discussions", label: "Discussions", value: discussions.length, unit: "count", detail: "Not yet filtered by project — a pre-existing platform limitation, not new to this sprint." },
    { key: "openRecommendations", label: "Open Recommendations", value: openRecommendations.length, unit: "count", detail: "Advisory suggestions from the Recommendation Engine awaiting a decision." },
    { key: "pendingApprovals", label: "Pending Approvals", value: pendingApprovals.length, unit: "count", detail: "Knowledge Objects with a named approver still waiting to decide." },
    { key: "openValidationRequests", label: "Open Validation Requests", value: openValidationRequests.length, unit: "count", detail: "Every Knowledge Object not yet validated, approved-required or not." },
    { key: "recentRevisions", label: "Recent Revisions", value: recentRevisions.length, unit: "count", detail: `Drawing revisions detected in the last ${RECENT_REVISION_WINDOW_DAYS} days.` },
    { key: "missingOnboardingItems", label: "Missing Onboarding Items", value: missingOnboardingItems, unit: "count", detail: "Core roles, key documents, or the questionnaire still outstanding." },
    { key: "knowledgeCoverage", label: "Knowledge Coverage", value: knowledgeCoverage, unit: "%", detail: "Share of Knowledge Objects connected to at least one other item in the Knowledge Graph." },
  ];
}

export { ONBOARDING_GAP_RECOMMENDATION_TYPES };
