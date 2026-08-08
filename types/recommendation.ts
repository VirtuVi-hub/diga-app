import type { ConfidenceLevel, Evidence, ReasoningResult } from "@/types/evidence";
import type { RelationshipNodeRef } from "@/types/relationship";

/**
 * The generic Recommendation model (Sprint 4.8). One shape for every kind of
 * recommendation the Recommendation Engine produces — no `RequirementRecommendation`,
 * `DrawingRecommendation`, `IssueRecommendation`, etc. `recommendationType` is
 * an open string (dictionary-driven, like `Event.eventType`), not a closed
 * union, so a new rule never requires a type change here.
 *
 * A Recommendation is advisory only — it is never mutated automatically and
 * never itself changes project data. It is NOT an Event: Events are the
 * append-only fact log that *produces* Recommendations (see
 * `lib/recommendations/recommendation-engine.ts`); a Recommendation is a
 * separate, first-class object with its own lifecycle (`status`).
 */

export type RecommendationStatus = "open" | "dismissed" | "accepted";

/** A bare reference back to the Event that produced this recommendation — never a full snapshot, matching the architecture doc's "never copy content into an event" rule applied here too. */
export type RecommendationSourceEvent = {
  id: string;
  eventType: string;
};

export type Recommendation = {
  id: string;
  /** Optional only because some source Events (e.g. `discussion.created.v1`) don't carry one yet — a pre-existing, documented gap, not introduced here. */
  projectId?: string;
  recommendationType: string;
  title: string;
  description: string;
  confidence: ConfidenceLevel;
  reasoning: ReasoningResult;
  evidence: Evidence[];
  relatedNodes: RelationshipNodeRef[];
  sourceEvent: RecommendationSourceEvent;
  status: RecommendationStatus;
  createdAt: string;
  updatedAt: string;
};

/** What a rule/caller provides — `id`/`createdAt`/`updatedAt` are repository-generated; `status` defaults to `"open"`. */
export type CreateRecommendationInput = Omit<Recommendation, "id" | "createdAt" | "updatedAt" | "status"> & {
  status?: RecommendationStatus;
};
