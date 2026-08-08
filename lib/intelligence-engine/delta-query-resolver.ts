import type { ComprehensionContextInput, DeltaIntent, ExtractedEntity } from "@/types/comprehension";
import type { ConfidenceLevel, Evidence, ReasoningResult } from "@/types/evidence";
import type { ContextScope } from "@/types/intelligence-engine";
import type { RelationshipType } from "@/types/relationship";
import { confidenceScorer } from "./confidence-scorer";
import { evidenceEngine } from "./evidence-engine";
import { intelligenceEngine } from "./intelligence-engine";
import { reasoningEngine } from "./reasoning-engine";
import { answerTimelineQuery, detectTimelineQuery } from "@/lib/events/timeline-query";
import { answerApprovalQuestion, detectApprovalQuestion, resolveKnowledgeObjectIdForContext } from "@/lib/knowledge-validation/approval-query";
import { answerRecommendationQuestion, detectRecommendationQuestion } from "@/lib/recommendations/recommendation-query";
import { answerRevisionQuestion, detectRevisionQuestion } from "@/lib/revision-intelligence/revision-query";
import { answerDrawingQuestion, detectDrawingQuestion } from "@/lib/drawing-intelligence/drawing-query";
import { answerGatewayQuestion, detectGatewayQuestion } from "@/lib/project-intelligence-gateway/gateway-query";
import { answerDashboardQuestion, detectDashboardQuestion } from "@/lib/dashboard/dashboard-query";
import { answerImportQuestion, detectImportQuestion } from "@/lib/import/import-query";
import { answerGovernanceQuestion, detectGovernanceQuestion } from "@/lib/governance/governance-query";

export type DeltaAnswerResult = {
  kind: "answer";
  label: string;
  value: string;
  evidence: Evidence[];
  reasoning: ReasoningResult;
  confidence: ConfidenceLevel;
};

export type DeltaComparisonResult = {
  kind: "comparison";
  subjects: { label: string; evidence: Evidence[] }[];
  reasoning: ReasoningResult;
  confidence: ConfidenceLevel;
};

export type DeltaRelatedResult = {
  kind: "related";
  heading: string;
  evidence: Evidence[];
  reasoning: ReasoningResult;
  confidence: ConfidenceLevel;
};

export type DeltaUnknownResult = {
  kind: "unknown";
  message: string;
  evidenceFound: Evidence[];
  missingEvidence: string[];
  confidence: ConfidenceLevel;
};

export type DeltaClarificationResult = {
  kind: "clarification";
  prompt: string;
  options: string[];
};

export type DeltaQueryResult = DeltaAnswerResult | DeltaComparisonResult | DeltaRelatedResult | DeltaUnknownResult | DeltaClarificationResult;

const GRAPH_HEADINGS: Partial<Record<DeltaIntent, string>> = {
  evidence: "Evidence",
  impact: "Potential Impacts",
  related_knowledge: "Related Knowledge",
};

/** Only these three intents map directly onto one specific relationship type — every other intent searches all relationship types generically. */
const INTENT_RELATIONSHIP_TYPE: Partial<Record<DeltaIntent, RelationshipType>> = {
  evidence: "evidence",
  impact: "impact",
  related_knowledge: "related",
};

function intentLabel(intent: DeltaIntent): string {
  return intent.charAt(0).toUpperCase() + intent.slice(1).replace(/_/g, " ");
}

function unknownResult(message: string, confidence: ConfidenceLevel = "none", evidenceFound: Evidence[] = [], missingEvidence: string[] = []): DeltaUnknownResult {
  return { kind: "unknown", message, evidenceFound, missingEvidence, confidence };
}

function dedupeSubjects(
  subjects: { entity: ExtractedEntity; evidence: Evidence[] }[],
): { entity: ExtractedEntity; evidence: Evidence[] }[] {
  const seenSignatures = new Set<string>();
  const result: { entity: ExtractedEntity; evidence: Evidence[] }[] = [];

  for (const subject of subjects) {
    const signature = subject.evidence
      .map((item) => item.id)
      .sort()
      .join(",");
    if (seenSignatures.has(signature)) continue;
    seenSignatures.add(signature);
    result.push(subject);
  }

  return result;
}

/**
 * Comparison degrades honestly to `unknown` when fewer than two entities
 * independently produce distinct, non-empty evidence — no fabricated
 * two-column comparison when the graph doesn't actually support one.
 */
async function buildComparisonResult(
  text: string,
  entities: ExtractedEntity[],
  scopes: ContextScope[],
): Promise<DeltaComparisonResult | DeltaUnknownResult> {
  if (entities.length < 2) {
    return unknownResult("Not enough distinct subjects to compare.");
  }

  const perEntity = await Promise.all(
    entities.map(async (entity) => ({
      entity,
      evidence: await evidenceEngine.collect({ text, entities: [entity], scopes }),
    })),
  );

  const distinctSubjects = dedupeSubjects(perEntity.filter((subject) => subject.evidence.length > 0));

  if (distinctSubjects.length < 2) {
    const only = distinctSubjects[0];
    return unknownResult(
      only ? `Not enough distinct evidence to compare — I only found information about "${only.entity.value}".` : "Not enough distinct evidence to compare.",
      only ? "low" : "none",
      only?.evidence ?? [],
    );
  }

  const allEvidence = distinctSubjects.flatMap((subject) => subject.evidence);
  const confidence = confidenceScorer.score(allEvidence);
  const reasoning = reasoningEngine.explain(entities, allEvidence, confidence);

  return {
    kind: "comparison",
    subjects: distinctSubjects.map((subject) => ({ label: subject.entity.value, evidence: subject.evidence })),
    reasoning,
    confidence,
  };
}

/**
 * Every Delta query flows through the DIGA Intelligence Engine (Sprint 4.2)
 * first, then this evidence-based response pipeline (Sprint 4.3): Evidence
 * Engine collects real `Relationship`-backed evidence (current context
 * first, then project-wide), Confidence Scorer rates it deterministically,
 * Reasoning Engine explains what was found/missing, and the Response
 * Planner's layout (computed since 4.2, now genuinely used) decides the
 * final shape. There is no mock fallback — an honest "unknown" result is
 * the only outcome when evidence is insufficient.
 */
export async function resolveDeltaQuery(text: string, context?: ComprehensionContextInput): Promise<DeltaQueryResult> {
  // Sprint 4.7: on a Knowledge Object's own page, questions about why it
  // should be approved / who should review it / what's missing are answered
  // from the Knowledge Validation Engine instead of the generic Comprehension
  // → Evidence pipeline below. Checked first, ahead of comprehension/
  // clarification entirely — unlike the timeline branch below, these are a
  // fixed set of page-scoped trigger phrases (the Validation Panel's own
  // preset buttons) with no real ambiguity to clarify, and several of them
  // ("Who should review this?", "What's missing?") don't match any
  // dictionary-driven `DeltaIntent` confidently enough to survive the
  // Comprehension Engine's own clarification gate otherwise. Still narrowly
  // gated on `knowledgeObjectId`/`discussionId` context so this can never
  // fire for a query with neither, and reuses raw `text` since translation
  // hasn't run yet at this point (acceptable — these presets are always
  // English). Sprint 4.9: asking from the Journal (a Discussion context, no
  // `knowledgeObjectId`) previously fell through silently — now resolved to
  // that discussion's most recent Knowledge Object when one exists (see
  // `resolveKnowledgeObjectIdForContext`), never guessed when none does.
  if (context?.knowledgeObjectId || context?.discussionId) {
    const approvalQuestion = detectApprovalQuestion(text);
    if (approvalQuestion) {
      const resolvedId = await resolveKnowledgeObjectIdForContext(context);
      if (resolvedId) {
        return answerApprovalQuestion(resolvedId, approvalQuestion);
      }
    }
  }

  // Sprint 5.5: "What needs my attention?" is deliberately intercepted HERE,
  // before the Sprint 4.8 branch below, and rerouted to the fuller Mission
  // Control Attention Center — a strict superset of Sprint 4.8's plain
  // open-Recommendations list (open Recommendations are one of its five
  // categories). "How healthy is this project?" and "What approvals are
  // pending?" are genuinely new phrasings with no prior branch. See
  // `lib/dashboard/dashboard-query.ts` for why "What changed since
  // yesterday?" and "What recommendations are open?" are deliberately NOT
  // duplicated here — existing branches already answer them correctly.
  if (context?.projectId) {
    const dashboardQuestionKind = detectDashboardQuestion(text);
    if (dashboardQuestionKind) {
      return answerDashboardQuestion(context.projectId, dashboardQuestionKind, text);
    }
  }

  // Sprint 4.8: "What should I do next?" / "What requires attention?" /
  // "What recommendations do you have?" are answered from the Recommendation
  // Engine, same rationale and placement as the Sprint 4.7 branch above —
  // checked before comprehension, on raw `text`, gated on `projectId` (broad,
  // but the trigger phrases are anchored/distinctive enough to avoid
  // regressing genuine evidence questions — see `detectRecommendationQuestion`).
  if (context?.projectId && detectRecommendationQuestion(text)) {
    return answerRecommendationQuestion();
  }

  // Sprint 5.0: "What changed?"/"Why did it change?"/"What should I
  // review?" and similar revision-shaped questions are answered from the
  // Revision Intelligence pipeline instead of the relationship-based
  // evidence pipeline below — same placement/rationale as the Sprint 4.8
  // branch directly above.
  if (context?.projectId && detectRevisionQuestion(text)) {
    return answerRevisionQuestion(context.projectId);
  }

  // Sprint 5.1: "What drawings exist?"/"Which is the latest revision?"/
  // "Which drawings relate to X?" and similar drawing-shaped questions are
  // answered from the Drawing Intelligence pipeline instead of the
  // relationship-based evidence pipeline below — same placement/rationale as
  // the Sprint 5.0 branch directly above.
  if (context?.projectId && detectDrawingQuestion(text)) {
    return answerDrawingQuestion(context.projectId, text);
  }

  // Sprint 5.2: "What has recently been uploaded?"/"What is currently
  // processing?"/"Which sources failed?" and similar Gateway-shaped
  // questions are answered from the Project Intelligence Gateway's own
  // Source records instead of the relationship-based evidence pipeline
  // below — same placement/rationale as the Sprint 5.0/5.1 branches above.
  const gatewayQuestionKind = context?.projectId ? detectGatewayQuestion(text) : null;
  if (context?.projectId && gatewayQuestionKind) {
    return answerGatewayQuestion(context.projectId, gatewayQuestionKind);
  }

  // Sprint 5.6: "What documents have been imported?"/"What documents are
  // still missing?"/"Has the agreement been uploaded?"/"What reports
  // exist?" are answered from real, imported project assets instead of the
  // relationship-based evidence pipeline below — same placement/rationale
  // as the branches above.
  const importQuestionKind = context?.projectId ? detectImportQuestion(text) : null;
  if (context?.projectId && importQuestionKind) {
    return answerImportQuestion(context.projectId, importQuestionKind);
  }

  // Sprint 5.7: "Who still needs to approve?"/"Who has delegated
  // authority?"/"Why is this waiting?"/"What changed in this
  // agreement?"/"Which clause changed?"/"Why was Version 2
  // uploaded?"/"Who has been notified?" are answered from the Governance
  // Engine (Governance Roster, Delegations, Document Revision
  // Intelligence) instead of the relationship-based evidence pipeline
  // below — same placement/rationale as the branches above.
  const governanceQuestionKind = context?.projectId ? detectGovernanceQuestion(text) : null;
  if (context?.projectId && governanceQuestionKind) {
    return answerGovernanceQuestion(context.projectId, governanceQuestionKind, context);
  }

  const result = intelligenceEngine.process({ text, context });

  if (result.needsClarification && result.clarifyingQuestion) {
    return {
      kind: "clarification",
      prompt: result.clarifyingQuestion.prompt,
      options: result.clarifyingQuestion.options,
    };
  }

  const { routing, responsePlan, intent, entities, contextScopes, context: resolvedContext, language } = result;

  // Sprint 4.6: timeline-shaped questions ("What happened yesterday?", "What
  // was recently approved?") are answered from the Event Log instead of the
  // relationship-based evidence pipeline below — relationship evidence isn't
  // relevant to "what changed recently." Narrow keyword detection only; see
  // `lib/events/timeline-query.ts` for why this isn't a separate Timeline AI.
  const timelineQuery = detectTimelineQuery(language.translatedText);
  if (timelineQuery) {
    return answerTimelineQuery(timelineQuery, context?.projectId);
  }

  if (routing.target !== "knowledge_graph_query" && routing.target !== "delta_response") {
    return unknownResult("This looks like it should become a workflow item rather than a question Delta can answer directly.");
  }

  if (responsePlan.layout === "revision") {
    return unknownResult("Revision comparison isn't available yet.");
  }

  if (responsePlan.layout === "comparison") {
    return buildComparisonResult(language.translatedText, entities, contextScopes);
  }

  const relationshipType = INTENT_RELATIONSHIP_TYPE[intent.intent];
  const evidence = await evidenceEngine.collect({ text: language.translatedText, entities, scopes: contextScopes, relationshipType });
  const confidence = confidenceScorer.score(evidence);
  const currentContextType = resolvedContext.discussionId ? ("discussion" as const) : undefined;
  const reasoning = reasoningEngine.explain(entities, evidence, confidence, currentContextType);

  if (responsePlan.layout === "related_list") {
    return {
      kind: "related",
      heading: GRAPH_HEADINGS[intent.intent] ?? "Related Knowledge",
      evidence,
      reasoning,
      confidence,
    };
  }

  if (confidence === "high" || confidence === "medium") {
    return {
      kind: "answer",
      label: entities[0]?.value ?? intentLabel(intent.intent),
      value: evidence[0].title,
      evidence,
      reasoning,
      confidence,
    };
  }

  // Sprint 4.9: reuses `reasoning.conclusion` (already computed just above,
  // now wording-improved in `reasoning-engine.ts`) instead of a separate,
  // always-generic hardcoded string — the two were saying the same thing in
  // worse words.
  return unknownResult(reasoning.conclusion, confidence, evidence, reasoning.missing);
}
