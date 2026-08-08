import { defaultGatewayCapabilities, type CapabilityRoutingDecision, type IntelligenceCapability } from "./capability-router";
import { SOURCE_TYPES } from "@/types/project-intelligence-gateway";
import type { ProcessingOutcome, Source } from "@/types/project-intelligence-gateway";

/**
 * Module: Processing Coordinator — the ONLY module that actually invokes a
 * specialized Intelligence engine on the Gateway's behalf. This is
 * "coordinate," one of the Gateway's four explicit responsibilities
 * (Identify / Route / Coordinate / Track) — it never performs domain
 * intelligence itself, it only calls out to whichever capability
 * `CapabilityRouter` selected. Wrapped in try/catch for the same reason
 * `publishSafely()`/`recommendationSubscriber` are: a bug inside a
 * delegated engine must never crash the Gateway itself, and must instead
 * surface as an honest `Failed` outcome.
 */
export interface ProcessingCoordinator {
  coordinate(routing: CapabilityRoutingDecision, source: Source): Promise<ProcessingOutcome>;
}

export class DefaultProcessingCoordinator implements ProcessingCoordinator {
  constructor(private readonly capabilities: IntelligenceCapability[] = defaultGatewayCapabilities) {}

  async coordinate(routing: CapabilityRoutingDecision, source: Source): Promise<ProcessingOutcome> {
    if (routing.capabilityId === SOURCE_TYPES.UNKNOWN) {
      return { capabilityId: SOURCE_TYPES.UNKNOWN, success: false, needsReview: true, summary: "No capability is registered for this source type yet." };
    }

    const capability = this.capabilities.find((candidate) => candidate.id === routing.capabilityId);
    if (!capability) {
      return { capabilityId: routing.capabilityId, success: false, summary: `Capability "${routing.capabilityId}" is not registered.` };
    }

    try {
      return await capability.process(source);
    } catch (error) {
      return {
        capabilityId: capability.id,
        success: false,
        summary: error instanceof Error ? error.message : "Processing failed for an unknown reason.",
      };
    }
  }
}

export const processingCoordinator: ProcessingCoordinator = new DefaultProcessingCoordinator();
