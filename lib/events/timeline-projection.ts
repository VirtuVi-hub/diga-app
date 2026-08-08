import { EVENT_TYPES } from "@/lib/events/event-types";
import type { ConfidenceLevel } from "@/types/evidence";
import type { Event } from "@/types/event";
import type { RelationshipNodeRef } from "@/types/relationship";

/**
 * The five categories the Timeline UI visually distinguishes (Sprint 4.6).
 * Derived generically from an event's namespace prefix — never from a
 * specific Knowledge Object type — so a brand-new event type is
 * automatically categorized correctly without touching this file.
 */
export type TimelineCategory = "knowledge" | "relationships" | "discussions" | "approvals" | "governance" | "intelligence";

/** Shared display label per category — used by both the Timeline UI and Delta's timeline-question answering. */
export const TIMELINE_CATEGORY_LABEL: Record<TimelineCategory, string> = {
  knowledge: "Knowledge",
  relationships: "Relationships",
  discussions: "Discussions",
  approvals: "Approvals",
  governance: "Governance",
  intelligence: "Intelligence",
};

/**
 * A generic timeline entry — not tied to any Knowledge Object type. Consumed
 * by the Timeline UI (Sprint 4.6) and by Delta's timeline-question answering
 * (`lib/events/timeline-query.ts`). Still produced by one pure transform over
 * `Event[]` — no new persistent store.
 */
export type TimelineEntry = {
  id: string;
  timestamp: string;
  eventType: string;
  category: TimelineCategory;
  summary: string;
  confidence?: ConfidenceLevel;
  actorId?: string | null;
  relatedNode?: RelationshipNodeRef;
  relatedTitle?: string;
  /**
   * Sprint 4.9 (§6B) — the `validationState` that *resulted* from this
   * specific event, already present in `metadata` on every approval event.
   * Deliberately the state at the time of this entry, not a live re-lookup
   * of the object's current state: the log is append-only/immutable, and
   * showing "current" status on an old entry would misrepresent history.
   */
  resultingState?: string;
};

function categorize(eventType: string): TimelineCategory {
  if (eventType.startsWith("knowledge_object.")) return "knowledge";
  if (eventType.startsWith("relationship.")) return "relationships";
  if (eventType.startsWith("discussion.")) return "discussions";
  if (eventType.startsWith("knowledge_draft.")) return "approvals";
  if (eventType.startsWith("approval.")) return "approvals";
  // Sprint 5.7: Agreement/Delegation/Participant/Project-Setup facts are
  // governance activity, not raw "intelligence" — Module 17 wants the
  // Timeline to visibly reflect governance, so these get their own
  // category rather than falling into the generic fallback.
  if (eventType.startsWith("agreement.")) return "governance";
  if (eventType.startsWith("delegation.")) return "governance";
  if (eventType.startsWith("participant.")) return "governance";
  if (eventType.startsWith("project_setup.")) return "governance";
  if (eventType === EVENT_TYPES.PROJECT_ACTIVATED) return "governance";
  return "intelligence";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function humanizeEventType(eventType: string): string {
  return capitalize(eventType.replace(/\.v\d+$/, "").replace(/[._]/g, " "));
}

/**
 * Sprint 4.9: builds an actor-first sentence when the event's own
 * `actor.id` is real ("Maya Chen raised a new Requirement: X"), falling
 * back to a passive phrasing when it isn't (`discussion.created.v1` never
 * carries one today — a documented, pre-existing gap) — never inventing a
 * name or role the event doesn't actually carry.
 */
function withActor(event: Event, active: (actor: string) => string, passive: string): string {
  return event.actor.id ? active(event.actor.id) : passive;
}

function knowledgeObjectKind(event: Event, fallback: string): string {
  return typeof event.metadata?.knowledgeObjectType === "string" ? capitalize(event.metadata.knowledgeObjectType) : fallback;
}

/**
 * Known-event-type summary text — humanized, actor-first sentences (Sprint
 * 4.9; "Maya Chen raised a new Requirement," not "Requirement Updated").
 * Unknown/future event types fall back to a humanized version of the raw
 * `eventType` string (see `summarize`) rather than requiring this map to be
 * kept exhaustive.
 */
const SUMMARY_BUILDERS: Partial<Record<string, (event: Event, title?: string) => string>> = {
  [EVENT_TYPES.KNOWLEDGE_OBJECT_CREATED]: (event, title) => {
    const kind = knowledgeObjectKind(event, "knowledge item");
    const subject = title ? `a new ${kind}: ${title}` : `a new ${kind}`;
    return withActor(event, (actor) => `${actor} raised ${subject}`, `${capitalize(subject)} was raised`);
  },
  [EVENT_TYPES.KNOWLEDGE_OBJECT_UPDATED]: (event, title) => {
    const kind = knowledgeObjectKind(event, "knowledge item");
    const subject = title ? `${kind}: ${title}` : kind;
    return withActor(event, (actor) => `${actor} updated ${subject}`, `${capitalize(subject)} was updated`);
  },
  [EVENT_TYPES.RELATIONSHIP_CREATED]: (event) => {
    const relationshipType = typeof event.metadata?.relationshipType === "string" ? event.metadata.relationshipType : "related";
    return withActor(event, (actor) => `${actor} linked a new ${relationshipType} relationship`, `A new ${relationshipType} relationship was added`);
  },
  [EVENT_TYPES.RELATIONSHIP_REMOVED]: (event) => {
    const relationshipType = typeof event.metadata?.relationshipType === "string" ? event.metadata.relationshipType : "related";
    return withActor(event, (actor) => `${actor} removed a ${relationshipType} relationship`, `A ${relationshipType} relationship was removed`);
  },
  [EVENT_TYPES.KNOWLEDGE_DRAFT_APPROVED]: (event, title) => {
    const kind = knowledgeObjectKind(event, "knowledge item");
    const subject = title ? `${kind}: ${title}` : kind;
    return withActor(event, (actor) => `${actor} approved ${subject}`, `${capitalize(subject)} was approved`);
  },
  [EVENT_TYPES.DISCUSSION_CREATED]: (event, title) => {
    const subject = title ? `a discussion: ${title}` : "a discussion";
    return withActor(event, (actor) => `${actor} started ${subject}`, `A new discussion was started${title ? `: ${title}` : ""}`);
  },
  [EVENT_TYPES.APPROVAL_REQUESTED]: (event, title) =>
    withActor(event, (actor) => `${actor} requested approval${title ? ` for ${title}` : ""}`, `Approval was requested${title ? ` for ${title}` : ""}`),
  [EVENT_TYPES.APPROVAL_GRANTED]: (event, title) =>
    withActor(event, (actor) => `${actor} approved${title ? ` ${title}` : " this"}`, title ? `${title} was approved` : "This was approved"),
  [EVENT_TYPES.APPROVAL_REJECTED]: (event, title) =>
    withActor(event, (actor) => `${actor} rejected${title ? ` ${title}` : " this"}`, title ? `${title} was rejected` : "This was rejected"),
  [EVENT_TYPES.APPROVAL_REVOKED]: (event, title) =>
    withActor(event, (actor) => `${actor} revoked approval${title ? ` for ${title}` : ""}`, `Approval was revoked${title ? ` for ${title}` : ""}`),
  [EVENT_TYPES.APPROVAL_DISCUSSION_REQUESTED]: (event, title) =>
    withActor(event, (actor) => `${actor} flagged${title ? ` ${title}` : " this"} for discussion`, `${title ?? "This"} was flagged for discussion`),
  [EVENT_TYPES.RECOMMENDATION_ACCEPTED]: (event, title) =>
    withActor(event, (actor) => `${actor} accepted a recommendation${title ? `: ${title}` : ""}`, `A recommendation was accepted${title ? `: ${title}` : ""}`),
  [EVENT_TYPES.RECOMMENDATION_DISMISSED]: (event, title) =>
    withActor(event, (actor) => `${actor} dismissed a recommendation${title ? `: ${title}` : ""}`, `A recommendation was dismissed${title ? `: ${title}` : ""}`),
  [EVENT_TYPES.REVISION_UPLOADED]: (event, title) =>
    withActor(event, (actor) => `${actor} uploaded a new drawing revision${title ? `: ${title}` : ""}`, `A new drawing revision was uploaded${title ? `: ${title}` : ""}`),
  [EVENT_TYPES.REVISION_CHANGES_DETECTED]: (event, title) =>
    withActor(event, (actor) => `${actor} detected a design change${title ? `: ${title}` : ""}`, `A design change was detected${title ? `: ${title}` : ""}`),
  [EVENT_TYPES.REVISION_REVIEWED]: (event, title) =>
    withActor(event, (actor) => `${actor} reviewed a revision${title ? `: ${title}` : ""}`, `A revision was reviewed${title ? `: ${title}` : ""}`),
  [EVENT_TYPES.DRAWING_UPLOADED]: (event, title) =>
    withActor(event, (actor) => `${actor} uploaded a new drawing${title ? `: ${title}` : ""}`, `A new drawing was uploaded${title ? `: ${title}` : ""}`),
  [EVENT_TYPES.DRAWING_CLASSIFIED]: (event, title) =>
    withActor(event, (actor) => `${actor} classified a drawing${title ? `: ${title}` : ""}`, `A drawing was classified${title ? `: ${title}` : ""}`),
  [EVENT_TYPES.SOURCE_RECEIVED]: (event, title) =>
    withActor(event, (actor) => `${actor} submitted a new source${title ? `: ${title}` : ""}`, `A new source was submitted${title ? `: ${title}` : ""}`),
  [EVENT_TYPES.SOURCE_CLASSIFIED]: (event, title) => {
    const sourceType = typeof event.metadata?.sourceType === "string" ? event.metadata.sourceType.replace(/_/g, " ") : undefined;
    return `${title ? `"${title}"` : "A source"} was classified${sourceType ? ` as ${sourceType}` : ""}`;
  },
  [EVENT_TYPES.SOURCE_PROCESSING_STARTED]: (event, title) => `Processing started${title ? ` for "${title}"` : ""}`,
  [EVENT_TYPES.SOURCE_PROCESSING_COMPLETED]: (event, title) => `Processing completed${title ? ` for "${title}"` : ""}`,
  [EVENT_TYPES.SOURCE_NEEDS_REVIEW]: (event, title) => `${title ? `"${title}"` : "A source"} needs human review`,
  [EVENT_TYPES.SOURCE_PROCESSING_FAILED]: (event, title) => `Processing failed${title ? ` for "${title}"` : ""}`,
  [EVENT_TYPES.USER_REGISTERED]: (_event, title) => `${title ? `"${title}"` : "A new user"} registered`,
  [EVENT_TYPES.FIRM_CREATED]: (event, title) =>
    withActor(event, (actor) => `${actor} created a new Firm${title ? `: ${title}` : ""}`, `A new Firm was created${title ? `: ${title}` : ""}`),
  [EVENT_TYPES.MEMBER_INVITED]: (event, title) =>
    withActor(event, (actor) => `${actor} invited ${title ?? "a new member"} to the Firm`, `${title ?? "A new member"} was invited to the Firm`),
  [EVENT_TYPES.PROJECT_CREATED]: (event, title) =>
    withActor(event, (actor) => `${actor} created a new project${title ? `: ${title}` : ""}`, `A new project was created${title ? `: ${title}` : ""}`),
  [EVENT_TYPES.ONBOARDING_STARTED]: (event) => withActor(event, (actor) => `${actor} started project onboarding`, "Project onboarding started"),
  [EVENT_TYPES.TEAM_ASSIGNED]: (event) => withActor(event, (actor) => `${actor} assigned the project team`, "The project team was assigned"),
  [EVENT_TYPES.DOCUMENT_UPLOADED]: (event, title) =>
    withActor(event, (actor) => `${actor} uploaded ${title ?? "a document"}`, `${title ?? "A document"} was uploaded`),
  [EVENT_TYPES.QUESTIONNAIRE_COMPLETED]: (event) => withActor(event, (actor) => `${actor} completed the client questionnaire`, "The client questionnaire was completed"),
  [EVENT_TYPES.ONBOARDING_COMPLETED]: (event) => withActor(event, (actor) => `${actor} completed project onboarding`, "Project onboarding was completed"),
  [EVENT_TYPES.ASSET_IMPORTED]: (event) => {
    const category = typeof event.metadata?.category === "string" ? event.metadata.category : "Document";
    const filename = typeof event.metadata?.filename === "string" ? event.metadata.filename : undefined;
    const subject = filename ? `${category}: ${filename}` : category;
    return withActor(event, (actor) => `${actor} imported ${subject}`, `${subject} was imported`);
  },
  [EVENT_TYPES.IMPORT_SESSION_COMPLETED]: (event) => {
    const imported = typeof event.metadata?.importedCount === "number" ? event.metadata.importedCount : 0;
    return withActor(event, (actor) => `${actor} finished an import session (${imported} file(s) imported)`, `An import session was completed (${imported} file(s) imported)`);
  },
  [EVENT_TYPES.AGREEMENT_UPLOADED]: (event) =>
    withActor(event, (actor) => `${actor} uploaded the Agreement`, "The Agreement was uploaded"),
  [EVENT_TYPES.AGREEMENT_ACCEPTED]: (event) =>
    withActor(event, (actor) => `${actor} accepted the Agreement`, "The Agreement was accepted"),
  [EVENT_TYPES.AGREEMENT_REVISION_UPLOADED]: (event, title) =>
    withActor(event, (actor) => `${actor} uploaded a revised Agreement${title ? ` (${title})` : ""}`, `A revised Agreement was uploaded${title ? ` (${title})` : ""}`),
  [EVENT_TYPES.AGREEMENT_REVISION_REQUESTED]: (event) =>
    withActor(event, (actor) => `${actor} requested a revision to the Agreement`, "A revision to the Agreement was requested"),
  [EVENT_TYPES.DELEGATION_CREATED]: (event, title) =>
    withActor(event, (actor) => `${actor} delegated approval authority${title ? ` to ${title}` : ""}`, `Approval authority was delegated${title ? ` to ${title}` : ""}`),
  [EVENT_TYPES.DELEGATION_REVOKED]: (event, title) =>
    withActor(event, (actor) => `${actor} revoked a delegation${title ? ` from ${title}` : ""}`, `A delegation was revoked${title ? ` from ${title}` : ""}`),
  [EVENT_TYPES.PARTICIPANT_INVITED]: (event, title) =>
    withActor(event, (actor) => `${actor} invited ${title ?? "a new participant"} to the project`, `${title ?? "A new participant"} was invited to the project`),
  [EVENT_TYPES.PARTICIPANT_JOINED]: (event, title) =>
    withActor(event, (actor) => `${title ?? actor} joined the project`, `${title ?? "A new participant"} joined the project`),
  [EVENT_TYPES.PROJECT_ACTIVATED]: (event) =>
    withActor(event, (actor) => `${actor} activated the project`, "The project was activated"),
  [EVENT_TYPES.DISCUSSION_RESOLVED]: (event, title) =>
    withActor(event, (actor) => `${actor} resolved a discussion${title ? `: ${title}` : ""}`, `A discussion was resolved${title ? `: ${title}` : ""}`),
  [EVENT_TYPES.PROJECT_SETUP_STEP_COMPLETED]: (event, title) =>
    withActor(event, (actor) => `${actor} completed a Project Setup step${title ? `: ${title}` : ""}`, `A Project Setup step was completed${title ? `: ${title}` : ""}`),
  [EVENT_TYPES.DELTA_REVIEW_CONFIRMED]: (event) =>
    withActor(event, (actor) => `${actor} confirmed Delta's understanding of the project`, "Delta's understanding of the project was confirmed"),
};

function summarize(event: Event): string {
  const title = typeof event.metadata?.title === "string" ? event.metadata.title : undefined;
  const builder = SUMMARY_BUILDERS[event.eventType];
  if (builder) return builder(event, title);
  return event.reason ?? humanizeEventType(event.eventType);
}

function toTimelineEntry(event: Event): TimelineEntry {
  return {
    id: event.id,
    timestamp: event.timestamp,
    eventType: event.eventType,
    category: categorize(event.eventType),
    summary: summarize(event),
    confidence: event.confidence,
    actorId: event.actor.id,
    relatedNode: event.sourceNode,
    relatedTitle: typeof event.metadata?.title === "string" ? event.metadata.title : undefined,
    resultingState: typeof event.metadata?.validationState === "string" ? event.metadata.validationState : undefined,
  };
}

/**
 * Converts ordered events into timeline entries. Deliberately stateless —
 * no new persistent store. The Event repository already holds the
 * chronological log; this only filters to what's user-facing
 * (`visibility: "project"` — matches `01_PRODUCT.md`'s "only meaningful
 * knowledge milestones appear," a significance filter, not a raw event
 * firehose) and sorts/shapes it.
 */
export interface TimelineProjection {
  project(events: Event[]): TimelineEntry[];
}

export class ChronologicalTimelineProjection implements TimelineProjection {
  project(events: Event[]): TimelineEntry[] {
    return events
      .filter((event) => event.visibility === "project")
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(toTimelineEntry);
  }
}

export const timelineProjection: TimelineProjection = new ChronologicalTimelineProjection();
