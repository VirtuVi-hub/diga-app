import { SOURCE_TYPES } from "@/types/project-intelligence-gateway";
import { drawingIntelligenceCapability } from "./capabilities/drawing-intelligence-capability";
import { journalIntelligenceCapability } from "./capabilities/journal-intelligence-capability";
import { revisionIntelligenceCapability } from "./capabilities/revision-intelligence-capability";
import type { ConfidenceLevel } from "@/types/evidence";
import type { ProcessingOutcome, Source } from "@/types/project-intelligence-gateway";

/**
 * What a specialized intelligence engine implements to plug into the
 * Gateway. This is the whole point of Module 10's "Future engines must
 * register themselves with the Gateway rather than modifying it": adding
 * Meeting/Document/Photo/Voice/BIM Intelligence later means writing one new
 * file implementing this interface and appending it to
 * `defaultGatewayCapabilities` below — `CapabilityRouter`,
 * `ProcessingCoordinator`, and `ProjectIntelligenceGateway` itself never
 * change.
 */
export interface IntelligenceCapability {
  id: string;
  label: string;
  /** Full `Source`, not just its type — lets a capability inspect `metadata` too (e.g. Revision Intelligence claiming a "drawing" source specifically when it carries revision fields). */
  canHandle(source: Source): boolean;
  process(source: Source): Promise<ProcessingOutcome>;
}

/**
 * Module 4: Capability Routing — initially Journal / Drawing / Revision
 * Intelligence, per the brief. Registration order encodes priority, the
 * same convention every ordered-rule module in this codebase already uses
 * (`IntentClassifier`, `DrawingClassifier`'s `CLASSIFICATION_RULES`):
 * Revision Intelligence is checked before Drawing Intelligence, since a
 * "drawing" source carrying a `previousRevisionLabel` is more specifically
 * a revision than a first-time upload.
 */
export const defaultGatewayCapabilities: IntelligenceCapability[] = [
  revisionIntelligenceCapability,
  drawingIntelligenceCapability,
  journalIntelligenceCapability,
];

export type CapabilityRoutingDecision = {
  capabilityId: string;
  confidence: ConfidenceLevel;
  rationale: string;
};

/**
 * Module: Capability Router. Decides which registered capability should
 * handle a classified `Source` — it never performs the work itself
 * (`ProcessingCoordinator` does that), matching the Orchestrator's
 * "decide, don't perform" role established since Sprint 4.2.
 */
export interface CapabilityRouter {
  route(source: Source): CapabilityRoutingDecision;
}

export class RegistryCapabilityRouter implements CapabilityRouter {
  constructor(private readonly capabilities: IntelligenceCapability[] = defaultGatewayCapabilities) {}

  route(source: Source): CapabilityRoutingDecision {
    const match = this.capabilities.find((capability) => capability.canHandle(source));

    if (!match) {
      return {
        capabilityId: SOURCE_TYPES.UNKNOWN,
        confidence: "none",
        rationale: `No registered capability handles source type "${source.sourceType}" yet.`,
      };
    }

    return {
      capabilityId: match.id,
      confidence: source.confidence,
      rationale: `Routed to ${match.label} based on source type "${source.sourceType}".`,
    };
  }
}

export const capabilityRouter: CapabilityRouter = new RegistryCapabilityRouter();
