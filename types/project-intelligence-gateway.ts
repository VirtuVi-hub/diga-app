import type { ConfidenceLevel } from "@/types/evidence";

/**
 * Project Intelligence Gateway (Sprint 5.2) — the one unified entry point
 * every future knowledge source passes through. The Gateway never performs
 * domain intelligence itself: it identifies, routes, coordinates, and
 * tracks, then delegates entirely to a specialized engine (Journal
 * Intelligence, Drawing Intelligence, Revision Intelligence today; Meeting/
 * Document/Photo/Voice/BIM Intelligence in future sprints — none of which
 * are built here). `Source` is deliberately NOT added to
 * `RelationshipNodeType` (`types/relationship.ts`) — a Source is a
 * processing record ABOUT an input, not domain knowledge itself; the real
 * graph nodes (a `Drawing`, a `Revision`'s Knowledge Object, ...) are
 * created by whichever specialized engine actually handled it, exactly as
 * before this sprint.
 */

/**
 * Open, growable dictionary (Module 2's own explicit list) — a new source
 * type is a data change, not an architecture change, matching every other
 * open-string dictionary in this codebase (`EVENT_TYPES`, `DRAWING_TYPES`,
 * `DESIGN_CHANGE_TYPES`).
 */
export type SourceType = string;

export const SOURCE_TYPES = {
  DRAWING: "drawing",
  DOCUMENT: "document",
  MEETING: "meeting",
  PHOTO: "photo",
  VIDEO: "video",
  VOICE: "voice",
  EMAIL: "email",
  CHAT: "chat",
  SPREADSHEET: "spreadsheet",
  PRESENTATION: "presentation",
  SPECIFICATION: "specification",
  SCHEDULE: "schedule",
  SITE_REPORT: "site_report",
  UNKNOWN: "unknown",
} as const;

/**
 * Module 5: Processing Tracker. `"queued"` exists for forward compatibility
 * (a future real background-job system) but is never actually reached this
 * sprint — every capability here runs synchronously, in-process, exactly
 * like every other engine in this codebase ("no background jobs" has been
 * explicitly out of scope since Sprint 4.5). This is architectural only, per
 * the brief — it does not yet power a real upload-progress UI.
 */
export type ProcessingState = "received" | "classified" | "queued" | "processing" | "completed" | "needs_review" | "failed";

export type ProcessingHistoryEntry = {
  state: ProcessingState;
  timestamp: string;
  detail?: string;
};

/**
 * The one generic Source model (Module 2) — no `PdfSource`/`MeetingSource`.
 * `capabilityId` records which registered capability ultimately handled it
 * (or claimed it), `undefined` when none did.
 */
export type Source = {
  id: string;
  projectId: string;
  sourceType: SourceType;
  filename?: string;
  declaredType?: SourceType;
  capabilityId?: string;
  processingState: ProcessingState;
  processingHistory: ProcessingHistoryEntry[];
  /** Classification confidence — see `SourceClassifier`. */
  confidence: ConfidenceLevel;
  /** Free-form, capability-specific input (e.g. `drawingId`, `previousRevisionLabel`, `text`) — deliberately untyped, since each capability owns interpreting its own fields, never the Gateway. */
  metadata: Record<string, unknown>;
  outcomeSummary?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
};

/** What a caller submits to the Gateway — mirrors `DetectRevisionInput`/`DrawingUploadInput`'s own shape. */
export type SourceSubmissionInput = {
  projectId: string;
  sourceId: string;
  filename?: string;
  declaredType?: SourceType;
  metadata?: Record<string, unknown>;
  createdBy?: string;
};

/**
 * What a capability's `process()` reports back to the Gateway.
 * `needsReview` is distinct from `success: false` — Journal Intelligence,
 * for example, always succeeds at classification but never writes to the
 * Knowledge Graph itself (Knowledge Capture requires a human Approve step,
 * per Sprint 4.4's own architecture), so it always reports
 * `needsReview: true` rather than a fabricated `completed`.
 */
export type ProcessingOutcome = {
  capabilityId: string;
  success: boolean;
  needsReview?: boolean;
  summary: string;
  detail?: Record<string, unknown>;
};

/**
 * Module 7: Gateway Dashboard Model — a pure projection, exactly like
 * `TimelineProjection` (Sprint 4.6): no new store, no UI this sprint. What a
 * future dashboard page would render.
 */
export type GatewayDashboard = {
  recentSources: Source[];
  countsByState: Record<ProcessingState, number>;
  countsBySourceType: Record<string, number>;
  pendingReview: Source[];
  failed: Source[];
};
