import { relationshipNodeFromEvidence } from "@/lib/relationship-utils";
import type { Evidence } from "@/types/evidence";
import type { RelationshipNode } from "@/types/relationship";

const MAX_SUGGESTED_RELATIONSHIPS = 5;

/**
 * Maps a detected element type to the kinds of follow-up review a human
 * should consider (Module 9's own examples) — a static, documented lookup,
 * not a fabricated per-instance judgment. This table is the single source
 * both `RevisionOrchestrator` (`suggestedActions`, shown on the `Revision`
 * itself) and the new `reviewRevisionImpactRule`
 * (`lib/recommendations/recommendation-rules.ts`) draw from, so the two can
 * never disagree.
 */
export const REVISION_ACTION_SUGGESTIONS: Record<string, string[]> = {
  door: ["Update door schedule"],
  wall: ["Review fire escape strategy"],
  room: ["Revise area schedule"],
  staircase: ["Notify structural engineer", "Review stair dimensions"],
  entrance: ["Review accessibility requirements"],
  ramp: ["Review accessibility requirements"],
  column: ["Notify structural engineer"],
  dimension: ["Revise area schedule"],
};

function suggestActionsFor(elementType: string): string[] {
  return REVISION_ACTION_SUGGESTIONS[elementType] ?? [];
}

/**
 * Module: Revision Orchestrator. Decides only — never performs the work,
 * matching the Intelligence Engine's own `Orchestrator` (Sprint 4.2)
 * philosophy exactly. Suggested relationships are the real, already-computed
 * `impacts`/`relatedKnowledge` evidence, reshaped into full node references
 * — the same "suggested relationships are evidence, reshaped" precedent the
 * Knowledge Capture Engine established (Sprint 4.4). Nothing here writes to
 * any repository.
 */
export interface RevisionOrchestrator {
  decide(params: { elementType: string; impacts: Evidence[]; relatedKnowledge: Evidence[] }): {
    suggestedRelationships: RelationshipNode[];
    suggestedActions: string[];
  };
}

export class DefaultRevisionOrchestrator implements RevisionOrchestrator {
  decide({ elementType, impacts, relatedKnowledge }: { elementType: string; impacts: Evidence[]; relatedKnowledge: Evidence[] }) {
    const suggestedRelationships = [...impacts, ...relatedKnowledge]
      .map(relationshipNodeFromEvidence)
      .filter((node): node is RelationshipNode => node !== undefined)
      .slice(0, MAX_SUGGESTED_RELATIONSHIPS);

    return {
      suggestedRelationships,
      suggestedActions: suggestActionsFor(elementType),
    };
  }
}

export const revisionOrchestrator: RevisionOrchestrator = new DefaultRevisionOrchestrator();
