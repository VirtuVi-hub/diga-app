import { DrawingService } from "@/lib/services/drawing-service";
import { SOURCE_TYPES } from "@/types/project-intelligence-gateway";
import type { DrawingSourceFormat } from "@/types/drawing-intelligence";
import type { IntelligenceCapability } from "../capability-router";
import type { ProcessingOutcome } from "@/types/project-intelligence-gateway";
import type { Source } from "@/types/project-intelligence-gateway";

/**
 * Capability adapter for Drawing Intelligence (Sprint 5.1). A thin
 * translation layer only — it maps the Gateway's generic `Source.metadata`
 * onto `DrawingUploadInput` and calls the unmodified `DrawingService.ingest()`
 * directly. All real understanding (classification, title block, views,
 * annotations, evidence, suggested relationships) still happens entirely
 * inside Drawing Intelligence — the Gateway never re-implements any of it.
 *
 * Claims a `"drawing"`-typed source only when it does NOT carry
 * `previousRevisionLabel` — a drawing source that does is a revision of an
 * existing sheet, which `RevisionIntelligenceCapability` claims first (see
 * registration order in `capability-router.ts`).
 */
export const drawingIntelligenceCapability: IntelligenceCapability = {
  id: "drawing_intelligence",
  label: "Drawing Intelligence",

  canHandle(source: Source): boolean {
    return source.sourceType === SOURCE_TYPES.DRAWING && typeof source.metadata.previousRevisionLabel !== "string";
  },

  async process(source: Source): Promise<ProcessingOutcome> {
    const drawingId = typeof source.metadata.drawingId === "string" ? source.metadata.drawingId : source.id;
    const sourceFormat: DrawingSourceFormat = typeof source.metadata.sourceFormat === "string" ? (source.metadata.sourceFormat as DrawingSourceFormat) : "pdf";

    const drawing = await DrawingService.ingest({ projectId: source.projectId, drawingId, sourceFormat, createdBy: source.createdBy });

    if (!drawing) {
      return { capabilityId: "drawing_intelligence", success: false, summary: `No parseable drawing data found for "${drawingId}".` };
    }

    return {
      capabilityId: "drawing_intelligence",
      success: true,
      summary: `Classified as ${drawing.drawingType.replace(/_/g, " ")}, sheet ${drawing.sheetNumber} — "${drawing.title}".`,
      detail: { drawingId: drawing.id, drawingType: drawing.drawingType, sheetNumber: drawing.sheetNumber },
    };
  },
};
