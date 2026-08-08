import { CONFIDENCE_THRESHOLD, DeltaComprehensionService, deltaComprehensionService } from "@/lib/comprehension/delta-comprehension-service";
import type { ComprehensionRequest } from "@/types/comprehension";
import type { IntelligenceEngineResult, RoutingTarget } from "@/types/intelligence-engine";
import { contextEngine as defaultContextEngine, type ContextEngine } from "./context-engine";
import { orchestrator as defaultOrchestrator, type Orchestrator } from "./orchestrator";
import { responsePlanner as defaultResponsePlanner, type ResponsePlanner } from "./response-planner";

const ROUTING_LABELS: Record<RoutingTarget, string> = {
  knowledge_graph_query: "Show results from the Knowledge Graph",
  requirement_workflow: "Create a Requirement",
  decision_workflow: "Log a Decision",
  issue_workflow: "Raise an Issue",
  action_workflow: "Create an Action",
  delta_response: "Answer via Delta",
  upload_pipeline: "Process uploaded file",
  comparison_engine: "Run comparison",
};

/**
 * The DIGA Intelligence Engine: User → Comprehension → Context → Orchestrator
 * → Response Planner. Every collaborator is a constructor parameter
 * (defaulting to the deterministic singleton below), so a future stage —
 * including swapping the entire Comprehension Engine for an LLM-backed one —
 * can replace any module without touching this class or any other, exactly
 * as `DeltaComprehensionService` already does for its own six collaborators.
 *
 * Produces the canonical `IntelligenceEngineResult`: the one object every
 * future AI service (upload intelligence, revision comparison, semantic
 * search, voice/mobile assistants, ...) should consume instead of parsing
 * raw text.
 */
export class IntelligenceEngine {
  constructor(
    private readonly comprehensionService: DeltaComprehensionService = deltaComprehensionService,
    private readonly contextEngine: ContextEngine = defaultContextEngine,
    private readonly orchestrator: Orchestrator = defaultOrchestrator,
    private readonly responsePlanner: ResponsePlanner = defaultResponsePlanner,
  ) {}

  process(request: ComprehensionRequest): IntelligenceEngineResult {
    const comprehension = this.comprehensionService.comprehend(request);
    const contextScopes = this.contextEngine.resolveScopes(comprehension.context);
    const routing = this.orchestrator.route(comprehension.intent, comprehension.destination);
    const responsePlan = this.responsePlanner.plan(comprehension.intent);

    const entitiesConfidence =
      comprehension.entities.length > 0 ? Math.min(...comprehension.entities.map((entity) => entity.confidence)) : 1;
    const overall = Math.min(
      comprehension.intent.confidence,
      comprehension.destination.confidence,
      entitiesConfidence,
      routing.confidence,
    );
    const needsClarification = comprehension.needsClarification || routing.confidence < CONFIDENCE_THRESHOLD;

    return {
      originalMessage: request.text,
      normalizedMessage: comprehension.normalization.normalized,
      language: comprehension.language,
      intent: comprehension.intent,
      entities: comprehension.entities,
      context: comprehension.context,
      contextScopes,
      destination: comprehension.destination,
      confidence: {
        intent: comprehension.intent.confidence,
        entities: entitiesConfidence,
        destination: comprehension.destination.confidence,
        overall,
      },
      routing,
      responsePlan,
      suggestedNextAction: {
        label: ROUTING_LABELS[routing.target],
        target: routing.target,
        requiresApproval: true,
      },
      needsClarification,
      clarifyingQuestion: needsClarification ? comprehension.clarifyingQuestion : undefined,
    };
  }
}

export const intelligenceEngine = new IntelligenceEngine();
