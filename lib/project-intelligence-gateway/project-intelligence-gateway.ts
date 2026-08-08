import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { sourceRepository } from "@/lib/repositories/source-repository";
import { capabilityRouter as defaultCapabilityRouter, type CapabilityRouter } from "./capability-router";
import { gatewayOrchestrator as defaultGatewayOrchestrator, type GatewayOrchestrator } from "./gateway-orchestrator";
import { processingCoordinator as defaultProcessingCoordinator, type ProcessingCoordinator } from "./processing-coordinator";
import { processingTracker as defaultProcessingTracker, type ProcessingTracker } from "./processing-tracker";
import { sourceClassifier as defaultSourceClassifier, type SourceClassifier } from "./source-classifier";
import { SOURCE_TYPES } from "@/types/project-intelligence-gateway";
import type { Source, SourceSubmissionInput } from "@/types/project-intelligence-gateway";

/**
 * Module 1: Project Intelligence Gateway — the one unified entry point
 * every future knowledge source passes through (Journal, Drawing, Revision
 * today; Meeting/Document/Photo/Voice/BIM in future sprints, none of which
 * are built here). Constructor-injected exactly like `IntelligenceEngine`
 * (Sprint 4.2), `RevisionEngine` (Sprint 5.0), and
 * `DrawingIntelligenceEngine` (Sprint 5.1).
 *
 * Unlike those three engines, this class is NOT pure computation — it is
 * the one deliberate exception to that precedent in this codebase, and the
 * reason is structural, not convenience: "Coordinate" and "Track" are two
 * of the Gateway's own four explicit responsibilities (Identify / Route /
 * Coordinate / Track), and coordinating means actually invoking whichever
 * capability was routed to (which itself writes to the Knowledge Graph),
 * while tracking means actually persisting the `Source` record's state as
 * it moves through the pipeline. This mirrors `RecommendationEngine`
 * (Sprint 4.8) more closely than `IntelligenceEngine` — that engine also
 * legitimately owns real persistence (`recommendationRepository.create()`)
 * as its core job, not a "Service" layered on top of a pure engine.
 *
 * It still never performs domain intelligence itself: every actual
 * understanding — classification confidence aside — comes from whichever
 * `IntelligenceCapability` `ProcessingCoordinator` invokes.
 */
export class ProjectIntelligenceGateway {
  constructor(
    private readonly classifier: SourceClassifier = defaultSourceClassifier,
    private readonly router: CapabilityRouter = defaultCapabilityRouter,
    private readonly orchestrator: GatewayOrchestrator = defaultGatewayOrchestrator,
    private readonly coordinator: ProcessingCoordinator = defaultProcessingCoordinator,
    private readonly tracker: ProcessingTracker = defaultProcessingTracker,
  ) {}

  async ingest(input: SourceSubmissionInput): Promise<Source> {
    // Stage 1: Identify (received) — a Source exists the moment it's
    // submitted, before anything is known about it.
    let source = await sourceRepository.create({
      id: input.sourceId,
      projectId: input.projectId,
      sourceType: input.declaredType ?? SOURCE_TYPES.UNKNOWN,
      filename: input.filename,
      declaredType: input.declaredType,
      processingState: "received",
      confidence: "none",
      metadata: input.metadata ?? {},
      createdBy: input.createdBy,
      processingHistory: this.tracker.record([], "received"),
    });

    await publishSafely({
      eventType: EVENT_TYPES.SOURCE_RECEIVED,
      actor: { type: "person", id: input.createdBy ?? null },
      projectId: input.projectId,
      metadata: { sourceId: source.id, title: source.filename ?? source.id },
    });

    // Stage 2: Identify (classify)
    const classification = this.classifier.classify(input);
    source = await sourceRepository.update(source.id, {
      sourceType: classification.sourceType,
      confidence: classification.confidence,
      processingState: "classified",
      processingHistory: this.tracker.record(source.processingHistory, "classified", classification.sourceType),
    });

    await publishSafely({
      eventType: EVENT_TYPES.SOURCE_CLASSIFIED,
      actor: { type: "system", id: null },
      projectId: input.projectId,
      confidence: classification.confidence,
      metadata: { sourceId: source.id, title: source.filename ?? source.id, sourceType: classification.sourceType },
    });

    // Stage 3: Route
    const routing = this.router.route(source);

    // Stage 4: decide whether to proceed automatically or defer to a human
    const decision = this.orchestrator.decide(source, routing);

    if (decision.nextState === "needs_review") {
      const reviewed = await sourceRepository.update(source.id, {
        processingState: "needs_review",
        capabilityId: routing.capabilityId === SOURCE_TYPES.UNKNOWN ? undefined : routing.capabilityId,
        outcomeSummary: decision.rationale,
        processingHistory: this.tracker.record(source.processingHistory, "needs_review", decision.rationale),
      });

      await publishSafely({
        eventType: EVENT_TYPES.SOURCE_NEEDS_REVIEW,
        actor: { type: "system", id: null },
        projectId: input.projectId,
        metadata: { sourceId: source.id, title: source.filename ?? source.id, reason: decision.rationale },
      });

      return reviewed;
    }

    // Stage 5: Coordinate — invoke the routed capability. This is the only
    // step that performs real work; everything above is identification and
    // routing.
    source = await sourceRepository.update(source.id, {
      processingState: "processing",
      capabilityId: routing.capabilityId,
      processingHistory: this.tracker.record(source.processingHistory, "processing", routing.rationale),
    });

    await publishSafely({
      eventType: EVENT_TYPES.SOURCE_PROCESSING_STARTED,
      actor: { type: "system", id: null },
      projectId: input.projectId,
      metadata: { sourceId: source.id, title: source.filename ?? source.id, capabilityId: routing.capabilityId },
    });

    const outcome = await this.coordinator.coordinate(routing, source);

    // Stage 6: Track the outcome.
    const finalState = !outcome.success ? "failed" : outcome.needsReview ? "needs_review" : "completed";
    const finalized = await sourceRepository.update(source.id, {
      processingState: finalState,
      outcomeSummary: outcome.summary,
      processingHistory: this.tracker.record(source.processingHistory, finalState, outcome.summary),
    });

    await publishSafely({
      eventType:
        finalState === "failed"
          ? EVENT_TYPES.SOURCE_PROCESSING_FAILED
          : finalState === "needs_review"
            ? EVENT_TYPES.SOURCE_NEEDS_REVIEW
            : EVENT_TYPES.SOURCE_PROCESSING_COMPLETED,
      actor: { type: "system", id: null },
      projectId: input.projectId,
      metadata: { sourceId: finalized.id, title: finalized.filename ?? finalized.id, capabilityId: outcome.capabilityId, summary: outcome.summary },
    });

    return finalized;
  }
}

export const projectIntelligenceGateway: ProjectIntelligenceGateway = new ProjectIntelligenceGateway();
