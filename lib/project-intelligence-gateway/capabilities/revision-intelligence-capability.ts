import { RevisionService } from "@/lib/services/revision-service";
import { SOURCE_TYPES } from "@/types/project-intelligence-gateway";
import type { IntelligenceCapability } from "../capability-router";
import type { ProcessingOutcome, Source } from "@/types/project-intelligence-gateway";

/**
 * Capability adapter for Revision Intelligence (Sprint 5.0). Maps the
 * Gateway's generic `Source.metadata` onto `DetectRevisionInput` and calls
 * the unmodified `RevisionService.detectAndProcess()` directly — every
 * design-change detection, Knowledge creation, Relationship suggestion, and
 * Event publish still happens entirely inside Revision Intelligence.
 *
 * Claims a `"drawing"`-typed source specifically when it DOES carry a
 * `previousRevisionLabel` — checked before `DrawingIntelligenceCapability`
 * in `capability-router.ts`'s registration order, the same "more specific
 * rule first" convention every other classifier/orchestrator in this
 * codebase already uses.
 */
export const revisionIntelligenceCapability: IntelligenceCapability = {
  id: "revision_intelligence",
  label: "Revision Intelligence",

  canHandle(source: Source): boolean {
    return source.sourceType === SOURCE_TYPES.DRAWING && typeof source.metadata.previousRevisionLabel === "string";
  },

  async process(source: Source): Promise<ProcessingOutcome> {
    const drawingId = typeof source.metadata.drawingId === "string" ? source.metadata.drawingId : source.id;
    const drawingLabel = typeof source.metadata.drawingLabel === "string" ? source.metadata.drawingLabel : drawingId;
    const previousRevisionLabel = source.metadata.previousRevisionLabel as string;
    const currentRevisionLabel = typeof source.metadata.currentRevisionLabel === "string" ? source.metadata.currentRevisionLabel : "Latest";

    const revisions = await RevisionService.detectAndProcess({
      projectId: source.projectId,
      sourceDrawing: { id: drawingId, type: "drawing", label: drawingLabel },
      previousRevisionLabel,
      currentRevisionLabel,
      createdBy: source.createdBy,
    });

    if (revisions.length === 0) {
      return { capabilityId: "revision_intelligence", success: false, summary: `No design changes detected between ${previousRevisionLabel} and ${currentRevisionLabel}.` };
    }

    return {
      capabilityId: "revision_intelligence",
      success: true,
      summary: `${revisions.length} design change(s) detected: ${revisions.map((revision) => revision.detectedChange).join("; ")}.`,
      detail: { revisionIds: revisions.map((revision) => revision.id) },
    };
  },
};
