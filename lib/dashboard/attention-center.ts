import { nodeHref } from "@/lib/relationship-utils";
import type { AttentionItem } from "@/lib/types/dashboard";
import type { MissionControlRawData } from "./mission-control-types";
import { ONBOARDING_GAP_RECOMMENDATION_TYPES } from "./project-health";

/**
 * Sprint 5.9.2: Project Setup's own onboarding label per item, matching
 * exactly what `ProjectSetupChecklist.tsx`'s "Recommended Next Steps"
 * shows — the Dashboard and the Setup page never invent two different
 * phrasings for the same real gap.
 */
const ONBOARDING_ITEM_LABELS: Record<string, string> = {
  design_team: "Invite Design Team",
  consultants: "Invite Consultants",
  client_representatives: "Invite Client Representatives",
  import: "Import Existing Project",
  questionnaire: "Complete Client Questionnaire",
  review: "Review Delta Understanding",
};

/**
 * Module 4: Attention Center. Aggregates real, already-computed signals from
 * five existing sources into one sorted list — no new detection logic, no
 * new storage. "Avoid duplicates" is handled two ways: onboarding-gap
 * Recommendations (Sprint 5.4) are excluded from the generic Recommendations
 * bucket since the Missing Onboarding item already surfaces that same gap
 * once, not per-role/per-document; and "open discussions" were deliberately
 * NOT included as their own category — `status: "open"` is the default,
 * normal state for nearly every discussion, not a signal that something
 * needs attention, so listing all of them would be noise, not
 * prioritization (documented in the sprint doc's Implementation Notes).
 *
 * "Sort by urgency" is a fixed, documented category ranking (approvals a
 * named person is blocking on, then Gateway review requests, then advisory
 * Recommendations, then onboarding gaps, then newly detected revisions) —
 * never a fabricated per-item score.
 */
const URGENCY: Record<AttentionItem["category"], number> = {
  approval: 1,
  review: 2,
  recommendation: 3,
  onboarding: 4,
  revision: 5,
};

export function computeAttentionCenter(data: MissionControlRawData): AttentionItem[] {
  const { projectId, knowledgeObjects, recommendations, sources, revisions, setupGaps, setupProgress } = data;
  const items: AttentionItem[] = [];

  for (const object of knowledgeObjects) {
    if (object.validationState !== "pending" || (object.approvalRequiredFrom?.length ?? 0) === 0) continue;
    items.push({
      id: `approval-${object.id}`,
      category: "approval",
      categoryLabel: "Pending Approval",
      title: object.title,
      description: `Waiting on approval from ${object.approvalRequiredFrom!.join(", ")}.`,
      href: `/projects/${projectId}/knowledge/${object.id}`,
      urgencyRank: URGENCY.approval,
    });
  }

  for (const source of sources.filter((candidate) => candidate.processingState === "needs_review")) {
    items.push({
      id: `review-${source.id}`,
      category: "review",
      categoryLabel: "Needs Review",
      title: source.filename ?? "An uploaded item",
      description: source.outcomeSummary ?? "No automated capability could process this yet — a person needs to look at it.",
      urgencyRank: URGENCY.review,
    });
  }

  for (const recommendation of recommendations.filter((item) => item.status === "open" && !ONBOARDING_GAP_RECOMMENDATION_TYPES.includes(item.recommendationType))) {
    const href = recommendation.relatedNodes[0] ? nodeHref(projectId, recommendation.relatedNodes[0]) : undefined;
    items.push({
      id: `recommendation-${recommendation.id}`,
      category: "recommendation",
      categoryLabel: "Recommendation",
      title: recommendation.title,
      description: recommendation.description,
      href,
      urgencyRank: URGENCY.recommendation,
    });
  }

  const missingSetupCount = setupGaps.missingRoles.length + setupGaps.missingDocumentTypes.length + (setupGaps.questionnaireIncomplete ? 1 : 0);
  if (missingSetupCount > 0) {
    items.push({
      id: "setup-gaps",
      category: "onboarding",
      categoryLabel: "Project Setup",
      title: "Project Setup has open gaps",
      description: `${missingSetupCount} setup item${missingSetupCount === 1 ? "" : "s"} still outstanding.`,
      href: `/projects/${projectId}/participants`,
      urgencyRank: URGENCY.onboarding,
    });
  }

  /**
   * Sprint 5.9.2: Design Team / Consultants / Client Representatives /
   * Import / Client Questionnaire / Delta Review are real, optional
   * onboarding — never a blocker, before or after activation. The
   * Dashboard recommends them here (one item per incomplete step,
   * matching Project Setup's own "Recommended Next Steps" labels exactly)
   * instead of ever gating the workflow.
   */
  for (const item of setupProgress?.onboarding.filter((candidate) => !candidate.done) ?? []) {
    items.push({
      id: `onboarding-${item.key}`,
      category: "onboarding",
      categoryLabel: "Recommended Next Step",
      title: ONBOARDING_ITEM_LABELS[item.key] ?? item.label,
      description: "Optional onboarding — never required to activate or continue working on this project.",
      href: `/projects/${projectId}/setup`,
      urgencyRank: URGENCY.onboarding,
    });
  }

  for (const revision of revisions.filter((item) => item.status === "detected")) {
    items.push({
      id: `revision-${revision.id}`,
      category: "revision",
      categoryLabel: "New Revision",
      title: revision.detectedChange,
      description: `Detected on ${revision.sourceDrawing.label}, ${revision.previousRevisionLabel} → ${revision.currentRevisionLabel}.`,
      href: revision.knowledgeObjectId ? `/projects/${projectId}/knowledge/${revision.knowledgeObjectId}` : undefined,
      urgencyRank: URGENCY.revision,
    });
  }

  return items.sort((a, b) => a.urgencyRank - b.urgencyRank);
}
