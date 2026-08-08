import { createRelationship } from "@/lib/actions/relationship-actions";
import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { drawingIntelligenceEngine } from "@/lib/drawing-intelligence/drawing-intelligence-engine";
import { drawingReasoner } from "@/lib/drawing-intelligence/drawing-reasoner";
import { drawingOrchestrator } from "@/lib/drawing-intelligence/drawing-orchestrator";
import { drawingRepository, type DrawingFilter } from "@/lib/repositories/drawing-repository";
import { RevisionService } from "@/lib/services/revision-service";
import type { ContextScope } from "@/types/intelligence-engine";
import type { Drawing, DrawingRevisionSummary, DrawingUploadInput } from "@/types/drawing-intelligence";

const SYSTEM_ACTOR = "Delta";

/**
 * Module: Drawing Service — the only layer that actually mutates the
 * Knowledge Graph (Page/Action → Service → Repository, the same layering
 * every other domain in this codebase uses). `DrawingIntelligenceEngine`
 * only computes; this executes Modules 8/9/10 by calling the existing,
 * unmodified `RelationshipService`/`EventPublisher`/`RevisionService` —
 * never a parallel write path.
 */
export class DrawingService {
  static async list(filter?: DrawingFilter): Promise<Drawing[]> {
    return drawingRepository.list(filter);
  }

  static async get(id: string): Promise<Drawing | null> {
    return drawingRepository.get(id);
  }

  /**
   * Runs the full pipeline (Module 1) for one new drawing upload, then
   * creates the suggested Relationships (Module 9) and publishes Events
   * (Timeline/Recommendations pick these up automatically — nothing here
   * calls either directly). A Drawing does NOT get wrapped in a Knowledge
   * Object (Module 8): unlike a Revision's detected change, a Drawing is
   * already a first-class node type in the Relationship Graph
   * (`RelationshipNodeType` has carried `"drawing"` since Sprint 4.0) — so
   * "becoming Knowledge" means existing as that real graph node, connected
   * by real Relationships, not being wrapped in an `Issue`/`Requirement`/
   * etc. it structurally isn't.
   */
  static async ingest(input: DrawingUploadInput): Promise<Drawing | null> {
    await publishSafely({
      eventType: EVENT_TYPES.DRAWING_UPLOADED,
      actor: { type: "person", id: input.createdBy ?? null },
      sourceNode: { id: input.drawingId, type: "drawing" },
      projectId: input.projectId,
      metadata: { drawingId: input.drawingId, sourceFormat: input.sourceFormat },
    });

    const processed = await drawingIntelligenceEngine.process(input);
    if (!processed) return null;

    const drawing = await drawingRepository.create(processed);

    const createdRelationshipIds: string[] = [];
    for (const target of drawing.suggestedRelationships) {
      const relationship = await createRelationship({
        projectId: input.projectId,
        nodeA: { id: drawing.id, type: "drawing", label: drawing.title },
        relationshipType: "related",
        nodeB: target,
        createdBy: SYSTEM_ACTOR,
      });
      createdRelationshipIds.push(relationship.id);
    }

    const finalized = await drawingRepository.update(drawing.id, { createdRelationshipIds });

    await publishSafely({
      eventType: EVENT_TYPES.DRAWING_CLASSIFIED,
      actor: { type: "system", id: null },
      sourceNode: { id: finalized.id, type: "drawing" },
      projectId: input.projectId,
      confidence: finalized.confidence,
      metadata: { title: finalized.title, drawingType: finalized.drawingType, sheetNumber: finalized.sheetNumber },
    });

    return finalized;
  }

  /**
   * Live, on-demand evidence/reasoning for ANY drawing — seeded or freshly
   * ingested — never a stale snapshot. Calls the exact same
   * `DrawingReasoner`/`DrawingOrchestrator` `ingest()` uses, without
   * mutating the stored record; this is what Delta (Module 11) and any
   * future detail view should call for freshness, rather than trusting
   * `Drawing.evidence` as captured at creation/seed time.
   */
  static async analyze(drawingId: string): Promise<{ evidence: Drawing["evidence"]; suggestedRelationships: Drawing["suggestedRelationships"]; reasoning: Drawing["reasoning"] } | null> {
    const drawing = await drawingRepository.get(drawingId);
    if (!drawing) return null;

    const scopes: ContextScope[] = [
      { level: "node", node: { id: drawing.id, type: "drawing" } },
      { level: "project", projectId: drawing.projectId },
    ];
    const searchText = [drawing.title, ...drawing.annotations.map((annotation) => annotation.label)].join(" ");
    const { evidence, reasoning } = await drawingReasoner.explain({ title: drawing.title, searchText, scopes });
    const { suggestedRelationships } = drawingOrchestrator.decide({ evidence });

    return { evidence, suggestedRelationships, reasoning };
  }

  /**
   * Module 10: Revision Integration. Composed live from the unmodified
   * `RevisionService` (Sprint 5.0) — never a second, competing revision
   * store, per the brief's own "Do NOT duplicate Revision Intelligence."
   */
  static async getRevisionSummary(drawingId: string): Promise<DrawingRevisionSummary | null> {
    const drawing = await drawingRepository.get(drawingId);
    if (!drawing) return null;

    const projectRevisions = await RevisionService.list({ projectId: drawing.projectId });
    const revisionHistory = projectRevisions.filter((revision) => revision.sourceDrawing.id === drawingId);

    return {
      currentRevisionLabel: drawing.currentRevisionLabel,
      previousRevisionLabel: drawing.previousRevisionLabel,
      revisionHistory,
      detectedChanges: revisionHistory.map((revision) => revision.detectedChange),
    };
  }
}
