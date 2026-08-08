import { confidenceScorer } from "@/lib/intelligence-engine/confidence-scorer";
import { evidenceEngine } from "@/lib/intelligence-engine/evidence-engine";
import { reasoningEngine } from "@/lib/intelligence-engine/reasoning-engine";
import type { ExtractedEntity } from "@/types/comprehension";
import type { Evidence, ReasoningResult } from "@/types/evidence";
import type { ContextScope } from "@/types/intelligence-engine";

export type DrawingReasoning = {
  evidence: Evidence[];
  reasoning: ReasoningResult;
};

/**
 * Module: Drawing Reasoner. Unlike Revision Intelligence (which splits
 * evidence-gathering into a separate `ImpactAnalyzer`), Drawing Intelligence
 * folds the two together here — the brief's own suggested module list for
 * this sprint does not name a separate analyzer, and a Drawing's evidence
 * gathering is simple enough (one generic `EvidenceEngine` search) not to
 * warrant a second module. Reuses the unmodified `EvidenceEngine`/
 * `ConfidenceScorer`/`ReasoningEngine` directly — never a second reasoning
 * implementation, never a fabricated causal claim.
 *
 * `searchText` should combine the sheet title with its annotation labels
 * (room names, callouts, notes, ...) — Module 7's annotations are
 * architectural information, not inert decoration, so they must feed the
 * same search a bare title would. `title` is kept separate purely for
 * reasoning phrasing ("X is connected to..."), not for matching.
 *
 * Callers MUST include a `{level: "node", node: {id: drawingId, type:
 * "drawing"}}` scope alongside the project scope (not project-only) — this
 * is what lets `EvidenceEngine` correctly exclude the drawing's OWN label
 * from matching against itself when it is already `nodeB` of some
 * pre-existing relationship (e.g. `drawing-a-101`, already referenced by
 * seeded evidence/impact relationships in `data/relationships.ts`).
 * Passing project-scope only, the way Revision Intelligence's
 * `ImpactAnalyzer` does for freshly-detected elements with no prior node
 * identity, would risk a self-referential "match" here, since a Drawing
 * (unlike a detected design change) usually already has a node identity in
 * the graph. `entities: []` is still deliberate (not a single compound-label
 * entity) for the same reason `ImpactAnalyzer` uses it — `EvidenceEngine`'s
 * own significant-word OR-matching fallback, not a new matching strategy.
 */
export interface DrawingReasoner {
  explain(params: { title: string; searchText: string; scopes: ContextScope[] }): Promise<DrawingReasoning>;
}

export class EvidenceBasedDrawingReasoner implements DrawingReasoner {
  async explain({ title, searchText, scopes }: { title: string; searchText: string; scopes: ContextScope[] }): Promise<DrawingReasoning> {
    const evidence = await evidenceEngine.collect({ text: searchText, entities: [], scopes });

    const entities: ExtractedEntity[] = [{ type: "drawing", value: title, confidence: 1 }];
    const evidenceConfidence = confidenceScorer.score(evidence);
    const base = reasoningEngine.explain(entities, evidence, evidenceConfidence);

    const conclusion =
      evidence.length === 0
        ? `"${title}" is not yet connected to any other project knowledge.`
        : `"${title}" is connected to ${evidence.length} related item(s) already in the project.`;

    return { evidence, reasoning: { found: base.found, missing: base.missing, conclusion } };
  }
}

export const drawingReasoner: DrawingReasoner = new EvidenceBasedDrawingReasoner();
