import { evidenceNodeTypeOrder, relationshipNodeTypeConfig, relationshipTypeLabels } from "@/lib/relationship-types";
import type { ExtractedEntity } from "@/types/comprehension";
import type { ConfidenceLevel, Evidence, ReasoningResult } from "@/types/evidence";
import type { RelationshipNodeType } from "@/types/relationship";

const MAX_FOUND_LINES = 5;
const MAX_MISSING_LINES = 4;

/**
 * Sprint 4.9: replaces the old generic "Unable to verify X — insufficient
 * evidence" with wording that explains WHY, reusing signals this function
 * already has (confidence, and whether any evidence was found at all) — no
 * new engine logic, no change to what `EvidenceEngine` matches, purely a
 * better sentence built from the same computed values. Distinguishes "some
 * evidence exists but doesn't confirm this" from "nothing related exists
 * yet", since those are genuinely different situations for a user deciding
 * what to do next.
 */
function buildConclusion(confidence: ConfidenceLevel, entityPhrase: string | undefined, hasEvidence: boolean): string {
  const subject = entityPhrase ? `"${entityPhrase}"` : "this";

  if (confidence === "high") {
    return `Evidence confirms ${subject}.`;
  }
  if (confidence === "medium") {
    return `Evidence supports ${subject}, though not conclusively.`;
  }
  if (hasEvidence) {
    return `I found related information, but nothing directly confirms ${subject}.`;
  }
  return `I couldn't find anything connected to ${subject} in this project yet — this appears to be new.`;
}

/**
 * Module: Reasoning Engine. Explains WHY Delta reached a conclusion by
 * summarising factual findings — it never invents a semantic claim the
 * evidence can't support (e.g. "confirms the width is 4 feet"), only states
 * that a relationship exists and what kind it is.
 */
export interface ReasoningEngine {
  explain(
    entities: ExtractedEntity[],
    evidence: Evidence[],
    confidence: ConfidenceLevel,
    currentContextType?: RelationshipNodeType,
  ): ReasoningResult;
}

export class DeterministicReasoningEngine implements ReasoningEngine {
  explain(
    entities: ExtractedEntity[],
    evidence: Evidence[],
    confidence: ConfidenceLevel,
    currentContextType?: RelationshipNodeType,
  ): ReasoningResult {
    const entityPhrase = entities.length > 0 ? entities.map((entity) => entity.value).join(" and ") : undefined;

    const found = evidence
      .slice(0, MAX_FOUND_LINES)
      .map((item) => `✓ ${item.type} "${item.title}" is linked as ${relationshipTypeLabels[item.relationship]}.`);

    const foundTypeLabels = new Set(evidence.map((item) => item.type));
    const currentContextLabel = currentContextType ? relationshipNodeTypeConfig[currentContextType].label : undefined;

    const missing = evidenceNodeTypeOrder
      .map((nodeType) => relationshipNodeTypeConfig[nodeType])
      .filter((config) => config.label !== currentContextLabel && !foundTypeLabels.has(config.label))
      .slice(0, MAX_MISSING_LINES)
      .map((config) => `✗ No ${config.pluralLabel.toLowerCase()} found.`);

    return {
      found,
      missing,
      conclusion: buildConclusion(confidence, entityPhrase, evidence.length > 0),
    };
  }
}

export const reasoningEngine: ReasoningEngine = new DeterministicReasoningEngine();
