import { EVENT_TYPES } from "@/lib/events/event-types";
import type { Event } from "@/types/event";
import type { KnowledgeObject, ValidationState } from "@/types/knowledge-object";
import type { ApprovalRoster } from "@/types/knowledge-validation";

/**
 * "Current Stage" (Sprint 4.9, §4A/§5) — a presentation-only lens on
 * `validationState`, not a stored field. 4 of 5 `ValidationState` values map
 * straight across; `"pending"` splits into `"raised"` (no `approval.
 * requested` event yet) vs `"under_review"` (one exists) using event data
 * `knowledgeValidationEngine.assemble()` already fetches — no new query.
 */
export type WorkflowStage = "raised" | "under_review" | "approved" | "rejected" | "revoked" | "needs_discussion";

export function computeCurrentStage(object: KnowledgeObject, events: Event[]): WorkflowStage {
  if (object.validationState !== "pending") {
    return object.validationState as Exclude<ValidationState, "pending">;
  }
  const hasBeenRequested = events.some((event) => event.eventType === EVENT_TYPES.APPROVAL_REQUESTED);
  return hasBeenRequested ? "under_review" : "raised";
}

function distinctActors(events: Event[], eventType: string): string[] {
  const ids = events
    .filter((event) => event.eventType === eventType)
    .map((event) => event.actor.id)
    .filter((id): id is string => Boolean(id));
  return [...new Set(ids)];
}

/**
 * Approval Workflow Foundation (Sprint 4.9). Pure aggregation over the
 * Event Log — no new store, no gating. `events` should already be filtered
 * to the ones touching this object (`knowledge-validation-engine.ts` does
 * this once and reuses the result for both this and the `timeline` field).
 */
export function computeApprovalRoster(object: KnowledgeObject, events: Event[]): ApprovalRoster {
  const requiredReviewers = object.approvalRequiredFrom ?? [];
  const approvedBy = distinctActors(events, EVENT_TYPES.APPROVAL_GRANTED);
  const rejectedBy = distinctActors(events, EVENT_TYPES.APPROVAL_REJECTED);
  const pendingReviewers = requiredReviewers.filter((name) => !approvedBy.includes(name) && !rejectedBy.includes(name));
  const discussionRequested = events.some((event) => event.eventType === EVENT_TYPES.APPROVAL_DISCUSSION_REQUESTED);

  return { requiredReviewers, approvedBy, rejectedBy, pendingReviewers, discussionRequested };
}
