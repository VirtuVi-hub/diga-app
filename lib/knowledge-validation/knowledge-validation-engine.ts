import { getAllKnowledgeObjects } from "@/lib/actions/knowledge-object-actions";
import { getEvents } from "@/lib/actions/event-actions";
import { analyzeNodeImpact } from "@/lib/impact-engine/impact-engine";
import { confidenceScorer } from "@/lib/intelligence-engine/confidence-scorer";
import { reasoningEngine } from "@/lib/intelligence-engine/reasoning-engine";
import { findMatchingKnowledgeObject } from "@/lib/services/knowledge-object-matching";
import { computeApprovalRoster, computeCurrentStage } from "./approval-roster";
import { suggestReviewers } from "./suggested-reviewers";
import { timelineProjection, type TimelineEntry } from "@/lib/events/timeline-projection";
import type { ExtractedEntity } from "@/types/comprehension";
import type { ConfidenceLevel, Evidence } from "@/types/evidence";
import type { KnowledgeObject } from "@/types/knowledge-object";
import type { KnowledgeValidation, SuggestedReviewer, ValidationCheck } from "@/types/knowledge-validation";

const MAX_TIMELINE_ENTRIES = 8;

/**
 * Module: Knowledge Validation Engine (Sprint 4.7). Assembles everything a
 * human needs to decide whether to approve a Knowledge Object, by composing
 * the already-frozen Sprint 4.3 engines (`EvidenceEngine`, `ConfidenceScorer`,
 * `ReasoningEngine`) plus the Sprint 4.5 Event Log — never a new reasoning
 * pipeline, never fabricated content. One generic method works for every
 * Knowledge Object type, matching the interface/impl/singleton pattern every
 * other engine in this codebase follows.
 */
export interface KnowledgeValidationEngine {
  assemble(object: KnowledgeObject): Promise<KnowledgeValidation>;
}

function nodeMatches(event: { sourceNode?: { id: string }; targetNode?: { id: string } }, objectId: string): boolean {
  return event.sourceNode?.id === objectId || event.targetNode?.id === objectId;
}

export class DefaultKnowledgeValidationEngine implements KnowledgeValidationEngine {
  async assemble(object: KnowledgeObject): Promise<KnowledgeValidation> {
    const text = `${object.title} ${object.description}`;
    const entities: ExtractedEntity[] = [{ type: "title", value: object.title, confidence: 1 }];

    const [{ evidence, impacts, relatedKnowledge }, allObjects, events] = await Promise.all([
      analyzeNodeImpact({ id: object.id, type: object.type, projectId: object.projectId, text }),
      getAllKnowledgeObjects(),
      getEvents({ projectId: object.projectId }),
    ]);

    const combinedEvidence: Evidence[] = [...evidence, ...impacts, ...relatedKnowledge];
    const confidence = confidenceScorer.score(combinedEvidence);
    const reasoning = reasoningEngine.explain(entities, combinedEvidence, confidence, object.type);

    // Computed once, reused for both `timeline` (capped, most-recent-first)
    // and the uncapped `approvalRoster` aggregate below — one filter pass,
    // not two separate event fetches.
    const nodeEvents = events.filter((event) => nodeMatches(event, object.id));

    const timeline: TimelineEntry[] = timelineProjection
      .project(nodeEvents)
      .slice()
      .reverse()
      .slice(0, MAX_TIMELINE_ENTRIES);

    const approvalRoster = computeApprovalRoster(object, nodeEvents);
    const currentStage = computeCurrentStage(object, nodeEvents);

    const suggestedReviewers = await suggestReviewers(object);

    const duplicate = findMatchingKnowledgeObject(
      allObjects.filter((candidate) => candidate.id !== object.id),
      { text, entities: [] },
    );

    const checks = this.runChecks({ evidence, impacts, relatedKnowledge, confidence, suggestedReviewers, duplicate });

    return {
      knowledgeObjectId: object.id,
      summary: object.description || object.title,
      evidence,
      relatedKnowledge,
      impacts,
      timeline,
      confidence,
      reasoning,
      suggestedReviewers,
      checks,
      approvalRoster,
      currentStage,
    };
  }

  /**
   * Informational only — never blocks approval. "Conflicting knowledge" from
   * the brief's own examples is deliberately not implemented here: there is
   * no "conflict" relationship type and no conflict detector in the graph,
   * and fabricating one would violate "never fabricate" (§7 of the sprint
   * brief). Every check below traces to a real, already-computed signal.
   */
  private runChecks({
    evidence,
    impacts,
    relatedKnowledge,
    confidence,
    suggestedReviewers,
    duplicate,
  }: {
    evidence: Evidence[];
    impacts: Evidence[];
    relatedKnowledge: Evidence[];
    confidence: ConfidenceLevel;
    suggestedReviewers: SuggestedReviewer[];
    duplicate: KnowledgeObject | null;
  }): ValidationCheck[] {
    const checks: ValidationCheck[] = [];

    if (evidence.length === 0) {
      checks.push({
        id: "missing-evidence",
        label: "Missing Evidence",
        severity: "warning",
        detail: "No evidence is linked to this item yet.",
      });
    }

    if (evidence.length === 0 && impacts.length === 0 && relatedKnowledge.length === 0) {
      checks.push({
        id: "missing-relationships",
        label: "Missing Relationships",
        severity: "warning",
        detail: "This item isn't connected to anything else in the Knowledge Graph.",
      });
    }

    if (confidence === "low" || confidence === "none") {
      checks.push({
        id: "low-confidence",
        label: "Low Confidence",
        severity: "warning",
        detail: `Confidence is ${confidence} — the available evidence may not be enough to decide.`,
      });
    }

    if (duplicate) {
      checks.push({
        id: "duplicate-knowledge",
        label: "Possible Duplicate",
        severity: "warning",
        detail: `"${duplicate.title}" looks similar to this item.`,
      });
    }

    if (suggestedReviewers.length === 0) {
      checks.push({
        id: "missing-participants",
        label: "No Suggested Reviewers",
        severity: "info",
        detail: "No reviewers could be suggested — consider assigning one manually.",
      });
    }

    return checks;
  }
}

export const knowledgeValidationEngine: KnowledgeValidationEngine = new DefaultKnowledgeValidationEngine();
