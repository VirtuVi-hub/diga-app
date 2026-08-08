import type { ConfidenceLevel, Evidence } from "@/types/evidence";

/**
 * `Evidence.confidence` is already tier-weighted (tier weight × relevance —
 * see `evidence-engine.ts`): node tier 1.0, linked-knowledge-object tier
 * 0.75, project tier 0.5. Every combination of "found at node or linked-KO
 * tier" AND "relevance ≥ 0.7" produces a tier-weighted confidence ≥ 0.525,
 * and no project-tier or low-relevance combination reaches that value — so
 * this single numeric threshold on the already-computed field is an exact,
 * simpler proxy for "current context, strong match," with no separate tier
 * field needed on `Evidence` itself.
 */
const CURRENT_CONTEXT_STRONG_THRESHOLD = 0.525;

/**
 * Deterministic, no AI: High requires multiple direct (relationship type
 * "evidence") sources in the current context; Medium is one such source, or
 * any indirect (impact/related) relationship still in the current context;
 * Low is anything weaker (project-wide only, or low relevance); None is no
 * evidence at all.
 */
export interface ConfidenceScorer {
  score(evidence: Evidence[]): ConfidenceLevel;
}

export class TieredConfidenceScorer implements ConfidenceScorer {
  score(evidence: Evidence[]): ConfidenceLevel {
    if (evidence.length === 0) return "none";

    const strongDirect = evidence.filter(
      (item) => item.relationship === "evidence" && item.confidence >= CURRENT_CONTEXT_STRONG_THRESHOLD,
    );
    if (strongDirect.length >= 2) return "high";
    if (strongDirect.length === 1) return "medium";

    const strongIndirect = evidence.some(
      (item) => item.relationship !== "evidence" && item.confidence >= CURRENT_CONTEXT_STRONG_THRESHOLD,
    );
    if (strongIndirect) return "medium";

    return "low";
  }
}

export const confidenceScorer: ConfidenceScorer = new TieredConfidenceScorer();
