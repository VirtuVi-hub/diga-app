/**
 * Named constants for the event types this sprint's integrations publish.
 * `Event.eventType` itself stays an open `string` (see `types/event.ts`) —
 * this list is a growable convenience, not a closed enum. Adding a new
 * event type anywhere in the platform is a data change, not an
 * architecture change, matching the same philosophy already established
 * for `EntityExtractor`'s dictionary (Sprint 4.1).
 */
export const EVENT_TYPES = {
  KNOWLEDGE_OBJECT_CREATED: "knowledge_object.created.v1",
  KNOWLEDGE_OBJECT_UPDATED: "knowledge_object.updated.v1",
  RELATIONSHIP_CREATED: "relationship.created.v1",
  RELATIONSHIP_REMOVED: "relationship.removed.v1",
  KNOWLEDGE_DRAFT_APPROVED: "knowledge_draft.approved.v1",
  DISCUSSION_CREATED: "discussion.created.v1",
  /**
   * Knowledge Validation & Approval Intelligence (Sprint 4.7) — a separate
   * "approval." namespace, not "knowledge_object.", so these categorize as
   * "approvals" on the Timeline (see `timeline-projection.ts`) rather than
   * "knowledge", matching how `KNOWLEDGE_DRAFT_APPROVED` above already does.
   */
  APPROVAL_REQUESTED: "approval.requested.v1",
  APPROVAL_GRANTED: "approval.granted.v1",
  APPROVAL_REJECTED: "approval.rejected.v1",
  APPROVAL_REVOKED: "approval.revoked.v1",
  /** Approval Workflow Foundation (Sprint 4.9) — a human explicitly flagging that a decision needs a conversation first. */
  APPROVAL_DISCUSSION_REQUESTED: "approval.discussion_requested.v1",
  /**
   * Recommendation Engine (Sprint 4.8) — deliberately no "recommendation
   * created" event (the brief only asks for lifecycle Events on Accept/
   * Dismiss); creating one for every rule firing would be event-log noise,
   * not a human action worth recording. These fall through `categorize()`'s
   * existing `"intelligence"` fallback with no changes needed there.
   */
  RECOMMENDATION_ACCEPTED: "recommendation.accepted.v1",
  RECOMMENDATION_DISMISSED: "recommendation.dismissed.v1",
  /**
   * Revision Intelligence (Sprint 5.0) — Drawing Revision Uploaded / Design
   * Changes Detected / Revision Reviewed (Module 10). A distinct "revision."
   * namespace, not "knowledge_object.", since the fact being recorded is
   * about the revision pipeline itself, not a generic Knowledge edit — these
   * fall through `categorize()`'s existing `"intelligence"` fallback, the
   * same precedent Recommendation events (Sprint 4.8) already established
   * for needing zero categorization changes.
   */
  REVISION_UPLOADED: "revision.uploaded.v1",
  REVISION_CHANGES_DETECTED: "revision.changes_detected.v1",
  REVISION_REVIEWED: "revision.reviewed.v1",
  /**
   * Drawing Intelligence (Sprint 5.1) — Drawing Uploaded / Drawing
   * Classified. Same "distinct namespace, falls through the existing
   * `"intelligence"` fallback" precedent `REVISION_*`/`RECOMMENDATION_*`
   * already established — see `categorize()` below, deliberately untouched.
   */
  DRAWING_UPLOADED: "drawing.uploaded.v1",
  DRAWING_CLASSIFIED: "drawing.classified.v1",
  /**
   * Project Intelligence Gateway (Sprint 5.2) — the Gateway's own lifecycle
   * events (Module 6). Deliberately does NOT publish "Knowledge Created" /
   * "Relationships Added" / "Recommendations Generated" events of its own —
   * those facts are already published by whichever specialized engine the
   * Gateway delegated to (`knowledge_object.created.v1`,
   * `relationship.created.v1`, ...), and duplicating them here would be
   * exactly the kind of duplicated architecture the brief forbids. Same
   * "distinct namespace, falls through the existing `"intelligence"`
   * fallback" precedent as `REVISION_*`/`DRAWING_*` — see `categorize()`
   * below, deliberately untouched.
   */
  SOURCE_RECEIVED: "source.received.v1",
  SOURCE_CLASSIFIED: "source.classified.v1",
  SOURCE_PROCESSING_STARTED: "source.processing_started.v1",
  SOURCE_PROCESSING_COMPLETED: "source.processing_completed.v1",
  SOURCE_NEEDS_REVIEW: "source.needs_review.v1",
  SOURCE_PROCESSING_FAILED: "source.processing_failed.v1",
  /**
   * Registration, Firm & Project Foundation (Sprint 5.3) — Module 8's own
   * four named events. `USER_REGISTERED`/`FIRM_CREATED`/`MEMBER_INVITED`
   * are firm/account-level facts, not Project-scoped, so `projectId` is
   * correctly omitted on those (same honest-omission precedent as
   * `discussion.created.v1` since Sprint 4.5); `PROJECT_CREATED` is the
   * first event in this codebase published with a `projectId` that is
   * genuinely known from the very first moment the project exists.
   */
  USER_REGISTERED: "user.registered.v1",
  FIRM_CREATED: "firm.created.v1",
  MEMBER_INVITED: "member.invited.v1",
  PROJECT_CREATED: "project.created.v1",
  /** Project Onboarding (Sprint 5.4) — Module 7's own five named events. */
  ONBOARDING_STARTED: "onboarding.started.v1",
  TEAM_ASSIGNED: "onboarding.team_assigned.v1",
  DOCUMENT_UPLOADED: "onboarding.document_uploaded.v1",
  QUESTIONNAIRE_COMPLETED: "onboarding.questionnaire_completed.v1",
  ONBOARDING_COMPLETED: "onboarding.completed.v1",
  /**
   * Existing Project Import (Sprint 5.6) — Module 7's own two events.
   * `ASSET_IMPORTED` is deliberately ONE generic event (not one per asset
   * category), matching every other event type in this codebase's "no
   * per-variant event" philosophy — the category-specific "Agreement
   * Imported"/"Drawing Imported" phrasing the brief asks for comes from
   * `timeline-projection.ts`'s own summary builder reading
   * `metadata.category`, not from a family of near-identical event
   * constants. `IMPORT_SESSION_COMPLETED` is a human-triggered fact (the
   * user explicitly finishes a batch via the Import Workspace), not an
   * automatically inferred one — see `lib/import/import-session-projection.ts`
   * for why a session's real state is derived without needing this event at
   * all; the event exists only to record the moment a person declared it done.
   */
  ASSET_IMPORTED: "import.asset_imported.v1",
  IMPORT_SESSION_COMPLETED: "import.session_completed.v1",
  /**
   * Governance Engine & Project Setup Workflow (Sprint 5.7) — Module 16's
   * own named events. "Discussion Opened" (Module 16) is deliberately NOT
   * a new event type — it reuses `DISCUSSION_CREATED` above, since opening
   * an Agreement clause discussion is still "a discussion was created,"
   * just with `attachedTo`/`clauseRef` metadata now available on the
   * `Discussion` itself. `DISCUSSION_RESOLVED` is new because resolving
   * previously had no event at all. Client Questionnaire completion also
   * reuses the existing `QUESTIONNAIRE_COMPLETED` event, not a new one.
   * No stored "approval required"/"notification sent" events exist:
   * Module 11's Governance Roster is computed live at read time
   * (`lib/governance/governance-roster.ts`), so there is nothing
   * additional to record as a fact — see that file's own doc-comment.
   */
  AGREEMENT_UPLOADED: "agreement.uploaded.v1",
  AGREEMENT_ACCEPTED: "agreement.accepted.v1",
  AGREEMENT_REVISION_UPLOADED: "agreement.revision_uploaded.v1",
  AGREEMENT_REVISION_REQUESTED: "agreement.revision_requested.v1",
  DELEGATION_CREATED: "delegation.created.v1",
  DELEGATION_REVOKED: "delegation.revoked.v1",
  PARTICIPANT_INVITED: "participant.invited.v1",
  PARTICIPANT_JOINED: "participant.joined.v1",
  PROJECT_ACTIVATED: "project.activated.v1",
  DISCUSSION_RESOLVED: "discussion.resolved.v1",
  PROJECT_SETUP_STEP_COMPLETED: "project_setup.step_completed.v1",
  DELTA_REVIEW_CONFIRMED: "project_setup.delta_review_confirmed.v1",
  /**
   * Notification Center (Sprint 5.9, Module 1) — a Discussion reply.
   * Published with `visibility: "internal"` (see `DiscussionService.addMessage()`),
   * so `ChronologicalTimelineProjection`'s existing `visibility === "project"`
   * filter excludes it from the Timeline automatically, preserving
   * `DISCUSSION_CREATED`/`DISCUSSION_RESOLVED`'s own "a message-by-message
   * Timeline would be noise" decision — this event exists only for the
   * Notifications subscriber to react to.
   */
  DISCUSSION_REPLIED: "discussion.replied.v1",
} as const;
