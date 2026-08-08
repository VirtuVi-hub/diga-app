import type { ClassifiedIntent, DeltaDestination, DestinationPrediction } from "@/types/comprehension";
import type { RoutingDecision, RoutingTarget } from "@/types/intelligence-engine";

const GRAPH_INTENTS = new Set(["evidence", "impact", "related_knowledge"]);

/** Exhaustive by construction — TypeScript errors if a `DeltaDestination` is ever added and left unmapped. */
const DESTINATION_TARGETS: Record<DeltaDestination, RoutingTarget> = {
  delta_query: "delta_response",
  new_discussion: "delta_response",
  new_requirement: "requirement_workflow",
  new_decision: "decision_workflow",
  new_issue: "issue_workflow",
  new_action: "action_workflow",
};

/**
 * Module 3 — Orchestrator. Decides what should happen next; it never
 * performs the work itself, only returns a routing decision. Two-tier
 * resolution: intents that map directly onto the Knowledge Graph
 * (Evidence/Impact/Related Knowledge) always route there regardless of the
 * predicted destination; everything else routes by destination. Reachable
 * targets this sprint are `knowledge_graph_query` and `delta_response` plus
 * the four workflow targets (advisory metadata only — no workflow is
 * actually created by this sprint, per "the user always has the final
 * decision"). `upload_pipeline`/`comparison_engine` exist in `RoutingTarget`
 * for future sprints; no rule here produces them yet.
 */
export interface Orchestrator {
  route(intent: ClassifiedIntent, destination: DestinationPrediction): RoutingDecision;
}

export class RuleBasedOrchestrator implements Orchestrator {
  route(intent: ClassifiedIntent, destination: DestinationPrediction): RoutingDecision {
    if (GRAPH_INTENTS.has(intent.intent)) {
      return {
        target: "knowledge_graph_query",
        confidence: intent.confidence,
        rationale: `Intent "${intent.intent}" maps directly onto the Knowledge Graph.`,
      };
    }

    const target = DESTINATION_TARGETS[destination.destination];
    return {
      target,
      confidence: destination.confidence,
      rationale: `Destination "${destination.destination}" routes to "${target}".`,
    };
  }
}

export const orchestrator: Orchestrator = new RuleBasedOrchestrator();
