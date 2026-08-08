/**
 * Public shapes for the DIGA Intelligence Engine (Sprint 4.2), the layer
 * every future AI capability (Delta chat, upload intelligence, revision
 * comparison, semantic search, voice/mobile assistants, ...) plugs into.
 * Built on top of the Delta Comprehension Engine (Sprint 4.1,
 * `types/comprehension.ts`) — Module 1 of this engine, unchanged.
 */

import type {
  ClarifyingQuestion,
  ClassifiedIntent,
  ComprehensionConfidence,
  DestinationPrediction,
  ExtractedEntity,
  LanguageResult,
  ResolvedContext,
} from "@/types/comprehension";
import type { RelationshipNodeRef } from "@/types/relationship";

/**
 * An ordered, searchable scope produced by the Context Engine: a specific
 * node (narrowest) or the whole project (widest). Callers search scopes in
 * order, only expanding to the next one when the current one is empty.
 */
export type ContextScope =
  | { level: "node"; node: RelationshipNodeRef }
  | { level: "project"; projectId: string };

/**
 * Where the Orchestrator can route a comprehended message. `upload_pipeline`
 * and `comparison_engine` are reachable destinations in the type for future
 * sprints (upload intelligence, revision comparison) but no rule produces
 * them yet — both are explicitly out of scope for this sprint.
 */
export type RoutingTarget =
  | "knowledge_graph_query"
  | "requirement_workflow"
  | "decision_workflow"
  | "issue_workflow"
  | "action_workflow"
  | "delta_response"
  | "upload_pipeline"
  | "comparison_engine";

export type RoutingDecision = {
  target: RoutingTarget;
  confidence: ComprehensionConfidence;
  rationale: string;
};

export type ResponseLayout = "short_answer" | "comparison" | "revision" | "related_list";

export type ResponseSectionKind =
  | "answer"
  | "description"
  | "evidence"
  | "impacts"
  | "related_knowledge"
  | "comparison"
  | "changes"
  | "affected_knowledge"
  | "related_drawings"
  | "confidence";

export type ResponsePlan = {
  layout: ResponseLayout;
  sections: ResponseSectionKind[];
};

/**
 * Advisory only — "the user always has the final decision." `requiresApproval`
 * is always `true`: the Intelligence Engine proposes, it never executes a
 * workflow (create a Requirement/Decision/Issue/Action) itself.
 */
export type SuggestedNextAction = {
  label: string;
  target: RoutingTarget;
  requiresApproval: boolean;
};

export type IntelligenceEngineConfidence = {
  intent: ComprehensionConfidence;
  entities: ComprehensionConfidence;
  destination: ComprehensionConfidence;
  overall: ComprehensionConfidence;
};

/**
 * The canonical output object of the Intelligence Engine. Future AI services
 * (Delta chat, upload intelligence, revision comparison, semantic search,
 * voice/mobile assistants, ...) should consume this object instead of
 * parsing raw text.
 */
export type IntelligenceEngineResult = {
  originalMessage: string;
  normalizedMessage: string;
  language: LanguageResult;
  intent: ClassifiedIntent;
  entities: ExtractedEntity[];
  context: ResolvedContext;
  contextScopes: ContextScope[];
  destination: DestinationPrediction;
  confidence: IntelligenceEngineConfidence;
  routing: RoutingDecision;
  responsePlan: ResponsePlan;
  suggestedNextAction: SuggestedNextAction;
  needsClarification: boolean;
  clarifyingQuestion?: ClarifyingQuestion;
};
