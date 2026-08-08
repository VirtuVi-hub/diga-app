import { createDiscussion } from "@/lib/actions/discussion-actions";
import { createKnowledgeObject } from "@/lib/actions/knowledge-object-actions";
import { createRelationship } from "@/lib/actions/relationship-actions";
import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { revisionRepository, type RevisionFilter } from "@/lib/repositories/revision-repository";
import { revisionEngine } from "@/lib/revision-intelligence/revision-engine";
import type { DetectRevisionInput, Revision, RevisionStatus } from "@/types/revision-intelligence";

const SYSTEM_ACTOR = "Delta";

/**
 * Module: Revision Service — the only layer that actually mutates the
 * Knowledge Graph (Page/Action → Service → Repository, the same layering as
 * every other domain in this codebase). `RevisionEngine` only computes; this
 * executes Modules 4/5/10 by calling the existing, unmodified
 * `KnowledgeObjectService`/`DiscussionService`/`RelationshipService`/
 * `EventPublisher` — never a parallel write path.
 */
export class RevisionService {
  static async list(filter?: RevisionFilter): Promise<Revision[]> {
    return revisionRepository.list(filter);
  }

  static async get(id: string): Promise<Revision | null> {
    return revisionRepository.get(id);
  }

  /**
   * Runs the full pipeline (Module 1) for one drawing-revision upload, then
   * turns every detected change into real Knowledge (Module 4), creates the
   * suggested Relationships (Module 5), and publishes Events (Module 10) so
   * Recommendations (Module 9), Timeline, and Delta (Module 11) all update
   * automatically — no direct calls to any of those three from here.
   *
   * Relationships are created directly this sprint rather than held back for
   * human review — Revision Intelligence has no review-gate UI yet, unlike
   * Knowledge Drafts (Sprint 4.4), which do. Every relationship still traces
   * back to a real, already-computed `ImpactAnalyzer` match — never
   * fabricated — so this is a scope decision (immediate vs. gated), not a
   * "never fabricate" violation. See the Sprint 5.0 doc for the honest
   * trade-off this implies.
   */
  static async detectAndProcess(input: DetectRevisionInput): Promise<Revision[]> {
    await publishSafely({
      eventType: EVENT_TYPES.REVISION_UPLOADED,
      actor: { type: "person", id: input.createdBy ?? null },
      sourceNode: { id: input.sourceDrawing.id, type: input.sourceDrawing.type },
      projectId: input.projectId,
      metadata: {
        title: input.sourceDrawing.label,
        previousRevisionLabel: input.previousRevisionLabel,
        currentRevisionLabel: input.currentRevisionLabel,
      },
    });

    const detected = await revisionEngine.process(input);
    if (detected.length === 0) return [];

    // One Discussion per upload — every detected change from this revision
    // shares it, mirroring how a real revision review would be one
    // conversation about several changes. `KnowledgeObject.discussionId` is
    // required by the existing architecture (Sprint 3.6A); Revision
    // Intelligence deliberately reuses it rather than loosening it. Reuses
    // the pre-existing "REV" (Review) discussion type code rather than
    // adding a new dictionary entry.
    const discussion = await createDiscussion({
      title: `Revision: ${input.sourceDrawing.label} — ${input.previousRevisionLabel} → ${input.currentRevisionLabel}`,
      type: "REV",
      summary: detected.map((change) => change.detectedChange),
    });

    const revisions: Revision[] = [];

    for (const change of detected) {
      const revision = await revisionRepository.create({ ...change, discussionId: discussion.id });

      // Module 4: every detected revision becomes Knowledge — never stops at
      // "drawing changed." Reuses the unmodified `KnowledgeObjectService`
      // exactly as every other Knowledge-creating flow in this codebase
      // does. Modeled as an Issue: a flagged item that arose and needs
      // review, the closest existing fit among the five closed
      // `KnowledgeObjectType`s (this sprint does not add a "Revision" type
      // to that union — Module 12 says build on top, not redesign).
      const knowledgeObject = await createKnowledgeObject({
        projectId: input.projectId,
        discussionId: discussion.id,
        type: "issue",
        title: change.detectedChange,
        description: `${change.detectedChange}. Detected from ${input.sourceDrawing.label}, ${input.previousRevisionLabel} → ${input.currentRevisionLabel}.`,
        priority: change.confidence === "high" ? "high" : "medium",
        status: "open",
        relatedTopics: [change.elementType],
        createdBy: SYSTEM_ACTOR,
      });

      // Module 5: automatically suggest — and here, create — relationships.
      // Every target traces back to a real, already-computed impact/
      // related-knowledge match from `ImpactAnalyzer` — never fabricated.
      const createdRelationshipIds: string[] = [];
      for (const target of change.suggestedRelationships) {
        const relationship = await createRelationship({
          projectId: input.projectId,
          nodeA: { id: knowledgeObject.id, type: knowledgeObject.type, label: knowledgeObject.title },
          relationshipType: "impact",
          nodeB: target,
          createdBy: SYSTEM_ACTOR,
        });
        createdRelationshipIds.push(relationship.id);
      }

      const finalized = await revisionRepository.update(revision.id, {
        knowledgeObjectId: knowledgeObject.id,
        createdRelationshipIds,
      });
      revisions.push(finalized);

      // Module 10: a distinct event per detected change — Recommendations
      // (Module 9, via the existing Event subscriber) and Timeline both pick
      // this up automatically; nothing here calls either directly.
      await publishSafely({
        eventType: EVENT_TYPES.REVISION_CHANGES_DETECTED,
        actor: { type: "system", id: null },
        sourceNode: { id: knowledgeObject.id, type: knowledgeObject.type },
        projectId: input.projectId,
        confidence: change.confidence,
        metadata: {
          title: knowledgeObject.title,
          changeType: change.changeType,
          suggestedActions: change.suggestedActions,
          revisionId: finalized.id,
        },
      });
    }

    return revisions;
  }

  /** The human-triggered "Revision Reviewed" fact (Module 10) — no UI wires this yet; see the Sprint 5.0 doc's Completion Notes. */
  static async review(id: string, actorId: string, status: Extract<RevisionStatus, "reviewed" | "accepted" | "dismissed">): Promise<Revision> {
    const revision = await revisionRepository.update(id, { status });

    await publishSafely({
      eventType: EVENT_TYPES.REVISION_REVIEWED,
      actor: { type: "person", id: actorId },
      sourceNode: revision.knowledgeObjectId ? { id: revision.knowledgeObjectId, type: "issue" } : undefined,
      projectId: revision.projectId,
      metadata: { title: revision.detectedChange, status },
    });

    return revision;
  }
}
