import { getDiscussion } from "@/lib/actions/discussion-actions";
import type { KnowledgeObject } from "@/types/knowledge-object";
import type { SuggestedReviewer } from "@/types/knowledge-validation";

/**
 * Recommendations only, never auto-assigned — every candidate traces to a
 * real field (`raisedTo`, `approvalRequiredFrom`) or a real linked
 * Discussion's participant list. `notify` is deliberately excluded: that's a
 * Notifications concern, out of scope.
 *
 * Extracted out of `KnowledgeValidationEngine` (Sprint 4.7) in Sprint 4.8 so
 * the Recommendation Engine's `notify_reviewers` rule can reuse the exact
 * same resolution logic instead of duplicating it — behavior-preserving
 * extraction, not a rewrite.
 */
export async function suggestReviewers(object: KnowledgeObject): Promise<SuggestedReviewer[]> {
  const reviewers = new Map<string, SuggestedReviewer>();

  if (object.raisedTo) {
    reviewers.set(object.raisedTo, {
      id: object.raisedTo,
      name: object.raisedTo,
      reason: `Raised to on this ${object.type}.`,
    });
  }

  for (const name of object.approvalRequiredFrom ?? []) {
    if (!reviewers.has(name)) {
      reviewers.set(name, { id: name, name, reason: `Listed as a required approver on this ${object.type}.` });
    }
  }

  const discussions = await Promise.all(object.relatedDiscussions.map((id) => getDiscussion(id)));
  for (const discussion of discussions) {
    if (!discussion) continue;
    for (const participant of discussion.participants) {
      if (!reviewers.has(participant.name)) {
        reviewers.set(participant.name, {
          id: participant.id,
          name: participant.name,
          reason: `Participant in linked discussion "${discussion.title}".`,
        });
      }
    }
  }

  return [...reviewers.values()];
}
