import { relationshipNodeFromEvidence } from "@/lib/relationship-utils";
import type { Evidence } from "@/types/evidence";
import type { RelationshipNode } from "@/types/relationship";

const MAX_SUGGESTED_RELATIONSHIPS = 5;

/**
 * Module: Drawing Orchestrator. Decides only — never performs the work,
 * matching the Intelligence Engine's own `Orchestrator` (Sprint 4.2) and
 * Revision Intelligence's `RevisionOrchestrator` (Sprint 5.0) exactly.
 * `suggestedRelationships` are the real, already-computed evidence from
 * `DrawingReasoner`, reshaped into full node references via the shared
 * `relationshipNodeFromEvidence()` helper (`lib/relationship-utils.ts`,
 * extracted from `RevisionOrchestrator` for this exact reuse) — the same
 * "suggested relationships are evidence, reshaped" precedent the Knowledge
 * Capture Engine established (Sprint 4.4). Nothing here writes to any
 * repository.
 */
export interface DrawingOrchestrator {
  decide(params: { evidence: Evidence[] }): { suggestedRelationships: RelationshipNode[] };
}

export class DefaultDrawingOrchestrator implements DrawingOrchestrator {
  decide({ evidence }: { evidence: Evidence[] }) {
    const suggestedRelationships = evidence
      .map(relationshipNodeFromEvidence)
      .filter((node): node is RelationshipNode => node !== undefined)
      .slice(0, MAX_SUGGESTED_RELATIONSHIPS);

    return { suggestedRelationships };
  }
}

export const drawingOrchestrator: DrawingOrchestrator = new DefaultDrawingOrchestrator();
