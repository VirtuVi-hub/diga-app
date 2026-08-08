import type { ConfidenceLevel, Evidence, ReasoningResult } from "@/types/evidence";
import type { RelationshipNode } from "@/types/relationship";

/**
 * Revision Intelligence (Sprint 5.0) — the first module of DIGA's Phase 2.
 * One generic model for every detected design change, regardless of element
 * kind (door/wall/room/staircase/entrance/ramp/column/dimension/...) — no
 * `DoorRevision`/`WallRevision`/`RoomRevision`, matching the exact
 * philosophy `Relationship`/`Event`/`Recommendation` already established.
 * DIGA is not an image-comparison tool: nothing here ever touches pixels,
 * files, or CAD geometry — this module only ever consumes an
 * already-structured diff (today: seeded mock data; tomorrow: a real
 * DWG/Revit/IFC/Computer-Vision parser, behind the exact same shape).
 */

export type RevisionStatus = "detected" | "reviewed" | "accepted" | "dismissed";

/**
 * Open, namespaced string — new element/verb combinations are a dictionary
 * addition, not an architecture change, matching `EVENT_TYPES`/
 * `RECOMMENDATION_TYPES`/`EntityExtractor`'s own dictionary philosophy.
 */
export type DesignChangeType = string;

export const DESIGN_CHANGE_TYPES = {
  DOOR_MOVED: "door.moved",
  WALL_ADDED: "wall.added",
  WALL_REMOVED: "wall.removed",
  ROOM_RESIZED: "room.resized",
  ROOM_RENAMED: "room.renamed",
  ROOM_ADDED: "room.added",
  ROOM_DELETED: "room.deleted",
  STAIRCASE_SHIFTED: "staircase.shifted",
  ENTRANCE_WIDENED: "entrance.widened",
  ENTRANCE_RELOCATED: "entrance.relocated",
  RAMP_MODIFIED: "ramp.modified",
  COLUMN_MOVED: "column.moved",
  DIMENSION_CHANGED: "dimension.changed",
} as const;

/**
 * `RevisionComparator`'s output shape — exactly as a future DWG/Revit/IFC/
 * Computer-Vision parser would emit it (Module 12). Deliberately raw and
 * unclassified: `ChangeExtractor`/`ChangeClassifier` turn this into a fully
 * reasoned `Revision` below.
 */
export type RawDetectedChange = {
  elementType: string;
  elementLabel: string;
  verb: "added" | "removed" | "moved" | "resized" | "renamed" | "modified";
  before?: string;
  after?: string;
};

/** `ChangeExtractor`'s normalized output, one step before classification. */
export type DesignChangeDraft = {
  elementType: string;
  elementLabel: string;
  verb: RawDetectedChange["verb"];
  before?: string;
  after?: string;
};

export type DetectRevisionInput = {
  projectId: string;
  sourceDrawing: RelationshipNode;
  previousRevisionLabel: string;
  currentRevisionLabel: string;
  createdBy?: string;
};

/**
 * The one generic Revision model (Modules 2/3). Each detected design change
 * — a door moved, a room resized, an entrance relocated — is one `Revision`
 * record. `evidence`/`impacts`/`relatedKnowledge` reuse the exact `Evidence`
 * shape `KnowledgeValidation` already uses (never a bespoke revision-only
 * evidence type). `suggestedRelationships` are those same impact/related
 * items, reshaped — the same "suggested relationships are evidence,
 * reshaped" precedent the Knowledge Capture Engine established (Sprint 4.4)
 * — and are created as real `Relationship` rows by `RevisionService`, since
 * no human-review gate exists yet for this pipeline (a documented,
 * deliberate choice — see the Sprint 5.0 doc).
 */
export type Revision = {
  id: string;
  projectId: string;
  sourceDrawing: RelationshipNode;
  previousRevisionLabel: string;
  currentRevisionLabel: string;
  elementType: string;
  elementLabel: string;
  changeType: DesignChangeType;
  detectedChange: string;
  before?: string;
  after?: string;
  confidence: ConfidenceLevel;
  evidence: Evidence[];
  impacts: Evidence[];
  relatedKnowledge: Evidence[];
  suggestedRelationships: RelationshipNode[];
  suggestedActions: string[];
  reasoning: ReasoningResult;
  status: RevisionStatus;
  /** Set once Module 4 (Knowledge Creation) runs. */
  knowledgeObjectId?: string;
  /** Set once Module 4 runs — every detected change from one upload shares one Discussion. */
  discussionId?: string;
  /** Set once Module 5 (Relationship Integration) runs. */
  createdRelationshipIds: string[];
  timestamp: string;
  createdBy?: string;
};

export type CreateRevisionInput = Omit<Revision, "id" | "timestamp" | "status" | "knowledgeObjectId" | "createdRelationshipIds"> & {
  status?: RevisionStatus;
};
