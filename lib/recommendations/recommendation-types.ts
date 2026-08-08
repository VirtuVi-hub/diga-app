/**
 * Named constants for the Recommendation types this sprint's rules produce.
 * `Recommendation.recommendationType` itself stays an open `string` (see
 * `types/recommendation.ts`) — this list is a growable convenience, not a
 * closed enum, matching `lib/events/event-types.ts`'s own `EVENT_TYPES`.
 */
export const RECOMMENDATION_TYPES = {
  NOTIFY_REVIEWERS: "notify_reviewers",
  REVIEW_AFFECTED_KNOWLEDGE: "review_affected_knowledge",
  CHECK_RELATED_DISCUSSIONS: "check_related_discussions",
  GATHER_MORE_EVIDENCE: "gather_more_evidence",
  LINK_RELATED_KNOWLEDGE: "link_related_knowledge",
  EXTRACT_KNOWLEDGE: "extract_knowledge",
  /** Revision Intelligence (Sprint 5.0) — see `reviewRevisionImpactRule`. */
  REVIEW_REVISION_IMPACT: "review_revision_impact",
  /** Project Onboarding (Sprint 5.4, Module 8) — see the five onboarding-gap rules below. */
  INVITE_MISSING_CONSULTANTS: "invite_missing_consultants",
  UPLOAD_MISSING_AGREEMENT: "upload_missing_agreement",
  UPLOAD_MISSING_BOQ: "upload_missing_boq",
  UPLOAD_MISSING_DRAWINGS: "upload_missing_drawings",
  COMPLETE_QUESTIONNAIRE: "complete_questionnaire",
  /** Existing Project Import (Sprint 5.6, Module 11) — see `missingSpecificationsRule`/`drawingMissingRequirementLinkRule` below. */
  UPLOAD_MISSING_SPECIFICATIONS: "upload_missing_specifications",
  DRAWING_MISSING_REQUIREMENT_LINK: "drawing_missing_requirement_link",
} as const;
