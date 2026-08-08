import { SOURCE_TYPES } from "@/types/project-intelligence-gateway";
import type { CapabilityRoutingDecision } from "./capability-router";
import type { ProcessingState, Source } from "@/types/project-intelligence-gateway";

export type GatewayDecision = {
  nextState: ProcessingState;
  rationale: string;
};

/**
 * Module: Gateway Orchestrator. Decides only — never performs the work,
 * matching the Intelligence Engine's own `Orchestrator` (Sprint 4.2) and
 * Revision/Drawing Intelligence's own orchestrators exactly. Given a
 * classified `Source` and a routing decision, decides whether the Gateway
 * should attempt automatic processing or send the source straight to human
 * review — never invokes anything itself.
 */
export interface GatewayOrchestrator {
  decide(source: Source, routing: CapabilityRoutingDecision): GatewayDecision;
}

export class DefaultGatewayOrchestrator implements GatewayOrchestrator {
  decide(source: Source, routing: CapabilityRoutingDecision): GatewayDecision {
    if (routing.capabilityId === SOURCE_TYPES.UNKNOWN) {
      return { nextState: "needs_review", rationale: `No registered capability handles source type "${source.sourceType}" — a future Intelligence engine may claim it.` };
    }

    if (source.confidence === "low" || source.confidence === "none") {
      return { nextState: "needs_review", rationale: `Classification confidence is "${source.confidence}" — routed to human review instead of automatic processing.` };
    }

    return { nextState: "processing", rationale: routing.rationale };
  }
}

export const gatewayOrchestrator: GatewayOrchestrator = new DefaultGatewayOrchestrator();
