import type { Revision } from "@/types/revision-intelligence";
import type { ConfidenceLevel, Evidence, ReasoningResult } from "@/types/evidence";
import type { RelationshipNode } from "@/types/relationship";

/**
 * Drawing Intelligence (Sprint 5.1) — the first real-world intelligence
 * capability. This is deliberately NOT "PDF Intelligence": PDF is only the
 * first supported input format. Everything here works against one generic
 * `Drawing` model, never a pixel or a file — the same "never fabricate,
 * never duplicate an existing engine" philosophy `Revision`/`Recommendation`
 * already established (Sprint 5.0/4.8).
 */

/**
 * Open — a dictionary addition (a new CAD API, a new file extension) is a
 * data change, not an architecture change, matching `EVENT_TYPES`/
 * `DESIGN_CHANGE_TYPES`'s own philosophy. `DrawingParser` is the only module
 * that ever looks at this value.
 */
export type DrawingSourceFormat = "pdf" | "dwg" | "dxf" | "ifc" | "revit" | "image" | "cad_api";

/** Open, namespaced-by-convention string — new drawing types are a dictionary addition. */
export type DrawingType = string;

export const DRAWING_TYPES = {
  FLOOR_PLAN: "floor_plan",
  ELEVATION: "elevation",
  SECTION: "section",
  SITE_PLAN: "site_plan",
  SCHEDULE: "schedule",
  DETAIL: "detail",
  PERSPECTIVE: "perspective",
  GENERAL_ARRANGEMENT: "general_arrangement",
} as const;

export type DrawingStatus = "draft" | "issued" | "superseded" | "archived";

/** Module 4: Title Block Intelligence — seeded/extracted, never OCR'd this sprint (the architecture supports OCR later behind the same `TitleBlockExtractor` interface). */
export type TitleBlock = {
  projectName: string;
  drawingNumber: string;
  revision: string;
  date: string;
  discipline: string;
  author: string;
  scale: string;
  sheetTitle: string;
};

/** Module 6: View Intelligence — structural only, never geometry. */
export type DrawingView = {
  id: string;
  label: string;
  viewType: string;
};

/** Module 7: Annotation Intelligence — structural only, never geometry/OCR. */
export type DrawingAnnotationType = "room_name" | "level" | "dimension" | "grid_label" | "callout" | "revision_cloud" | "note";

export type DrawingAnnotation = {
  id: string;
  type: DrawingAnnotationType;
  label: string;
  value?: string;
};

/**
 * The one generic Drawing model (Module 2) — no `PdfDrawing`/`DwgDrawing`,
 * no per-format subclass. `sourceFormat` is the only place a Drawing knows
 * where it came from; nothing else in the pipeline branches on it.
 */
export type Drawing = {
  id: string;
  projectId: string;
  drawingType: DrawingType;
  sheetNumber: string;
  title: string;
  scale: string;
  discipline: string;
  sourceFormat: DrawingSourceFormat;
  titleBlock: TitleBlock;
  views: DrawingView[];
  annotations: DrawingAnnotation[];
  /** Module 10: Revision Integration — the drawing's own latest-known revision labels; full history is composed live from `RevisionService`, never duplicated here. */
  currentRevisionLabel: string;
  previousRevisionLabel?: string;
  confidence: ConfidenceLevel;
  evidence: Evidence[];
  suggestedRelationships: RelationshipNode[];
  reasoning: ReasoningResult;
  status: DrawingStatus;
  createdRelationshipIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
};

/** `id` is caller-supplied (a drawing's identity is its sheet number, not an arbitrary sequence) — unlike `Revision`, where each detected change has no natural stable id of its own. */
export type CreateDrawingInput = Omit<Drawing, "createdAt" | "updatedAt" | "createdRelationshipIds" | "status"> & {
  status?: DrawingStatus;
};

/** What `DrawingIntelligenceEngine.process()` needs to run the pipeline for one drawing/sheet — mirrors `DetectRevisionInput`'s shape. */
export type DrawingUploadInput = {
  projectId: string;
  drawingId: string;
  sourceFormat: DrawingSourceFormat;
  createdBy?: string;
};

/**
 * `DrawingParser`'s output — the format-agnostic intermediate shape every
 * future real parser (DWG/DXF/IFC/Revit/image/CAD API) must produce, exactly
 * as today's seeded mock data already does. Nothing downstream —
 * `DrawingClassifier` onward — needs to know or care which one produced it.
 */
export type RawDrawingData = {
  sourceFormat: DrawingSourceFormat;
  sheetNumber: string;
  sheetTitle: string;
  scale: string;
  discipline: string;
  titleBlock: {
    projectName: string;
    drawingNumber: string;
    revision: string;
    previousRevision?: string;
    date: string;
    author: string;
  };
  rawViews: { label: string; viewType: string }[];
  rawAnnotations: { type: DrawingAnnotationType; label: string; value?: string }[];
};

/**
 * Module 10: Revision Integration. Composed live from the unmodified
 * `RevisionService` (Sprint 5.0) — never a second, competing revision store.
 */
export type DrawingRevisionSummary = {
  currentRevisionLabel: string;
  previousRevisionLabel?: string;
  revisionHistory: Revision[];
  detectedChanges: string[];
};
