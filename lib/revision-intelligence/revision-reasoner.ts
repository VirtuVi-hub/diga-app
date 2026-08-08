import { reasoningEngine } from "@/lib/intelligence-engine/reasoning-engine";
import type { ExtractedEntity } from "@/types/comprehension";
import type { ConfidenceLevel, Evidence, ReasoningResult } from "@/types/evidence";

/**
 * Module 7: Reasoning. Reuses the unmodified Sprint 4.3 `ReasoningEngine`
 * directly for the found/missing summary (never a second, competing
 * reasoning implementation), then layers one revision-specific sentence on
 * top. Deliberately does NOT synthesize a causal narrative like "because the
 * client requested a larger lobby" — no real causal link between a
 * Requirement's approval and a drawing change exists anywhere in this graph,
 * and inventing one would violate the same "never fabricate" rule every
 * other engine in this codebase already honors. What IS honest and real:
 * whether related evidence exists, and whether an approval has been
 * recorded for it — exactly the distinction the brief's own example draws
 * ("Confidence is Medium because related evidence exists but no approval
 * has yet been recorded").
 */
export interface RevisionReasoner {
  explain(params: {
    elementLabel: string;
    detectedChange: string;
    evidence: Evidence[];
    confidence: ConfidenceLevel;
  }): ReasoningResult;
}

export class EvidenceBasedRevisionReasoner implements RevisionReasoner {
  explain({
    elementLabel,
    detectedChange,
    evidence,
    confidence,
  }: {
    elementLabel: string;
    detectedChange: string;
    evidence: Evidence[];
    confidence: ConfidenceLevel;
  }): ReasoningResult {
    const entities: ExtractedEntity[] = [{ type: "element", value: elementLabel, confidence: 1 }];
    const base = reasoningEngine.explain(entities, evidence, confidence);

    const hasApprovalEvidence = evidence.some((item) => /decision/i.test(item.type) || /approved/i.test(item.excerpt ?? ""));

    const conclusion =
      evidence.length === 0
        ? `${detectedChange}. No related evidence was found for this change yet — the reason is unknown.`
        : hasApprovalEvidence
          ? `${detectedChange}. This is consistent with related, decided evidence already found in the project.`
          : `${detectedChange}. Confidence is ${confidence} because related evidence exists, but no approval has yet been recorded for it.`;

    return { found: base.found, missing: base.missing, conclusion };
  }
}

export const revisionReasoner: RevisionReasoner = new EvidenceBasedRevisionReasoner();
