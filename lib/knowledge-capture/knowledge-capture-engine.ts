import { getDiscussion } from "@/lib/actions/discussion-actions";
import { contextEngine } from "@/lib/intelligence-engine/context-engine";
import { confidenceScorer } from "@/lib/intelligence-engine/confidence-scorer";
import { evidenceEngine } from "@/lib/intelligence-engine/evidence-engine";
import { reasoningEngine } from "@/lib/intelligence-engine/reasoning-engine";
import type { ComprehensionContextInput, ExtractedEntity } from "@/types/comprehension";
import type { Evidence } from "@/types/evidence";
import type { ContextScope } from "@/types/intelligence-engine";
import type { KnowledgeDraft, SuggestedRelationship } from "@/types/knowledge-draft";
import type { KnowledgeObjectType } from "@/types/knowledge-object";

const OBLIGATION_PATTERN = /\b(should|must|shall|needs? to|required to|has to|have to)\b/i;

/**
 * Keyed off the draft's own `type` — the already-decided routing target
 * (Requirement/Decision/Issue/Action), not the separate 17-way intent
 * classifier, which doesn't always agree with it (e.g. "we decided to use
 * marble" classifies destination `new_decision` but intent `material`) and
 * would otherwise silently drop the reasoning line for some drafts.
 */
const CLASSIFICATION_REASON_BY_TYPE: Record<KnowledgeObjectType, string> = {
  requirement: "Detected design requirement language.",
  decision: "Detected decision language.",
  action: "Detected future action language.",
  issue: "Detected issue language.",
  risk: "Detected risk language.",
  constraint: "Detected constraint language.",
  preference: "Detected preference language.",
};

function buildClassificationReasons(type: KnowledgeObjectType, text: string): string[] {
  const reasons = [CLASSIFICATION_REASON_BY_TYPE[type]];
  if (OBLIGATION_PATTERN.test(text)) reasons.push("Detected obligation language.");
  return reasons;
}

/**
 * A simple, honest deterministic heuristic — not paraphrasing. Strips
 * trailing punctuation, one obligation phrase, and a leading article, then
 * title-cases what's left. The result is a reasonable starting point for
 * the user to refine via the review screen's Edit action, not a polished
 * final title — a real language model could do better, but this sprint
 * stays deterministic and never invents wording the input didn't contain.
 */
function toTitle(text: string): string {
  const withoutPunctuation = text.trim().replace(/[.?!]+$/, "");
  const withoutObligation = withoutPunctuation.replace(OBLIGATION_PATTERN, "").replace(/\s{2,}/g, " ").trim();
  const withoutLeadingArticle = withoutObligation.replace(/^(the|a|an)\s+/i, "");
  return withoutLeadingArticle.replace(/\b\w/g, (character) => character.toUpperCase());
}

function toSuggestedRelationship(item: Evidence): SuggestedRelationship {
  return { relationshipType: item.relationship, label: item.title, typeLabel: item.type };
}

function findNodeScope(scopes: ContextScope[]) {
  return scopes.find((scope): scope is Extract<ContextScope, { level: "node" }> => scope.level === "node");
}

/**
 * Every collected `Evidence` item already *is* a suggestion — the current
 * discussion itself (the source of the statement) is added as one more,
 * since it's always relevant "evidence" for a draft born from it. Never
 * creates a `Relationship` row; suggestions only, per Sprint 4.4's brief.
 */
async function buildSuggestedRelationships(scopes: ContextScope[], evidence: Evidence[]): Promise<SuggestedRelationship[]> {
  const suggestions = evidence.map(toSuggestedRelationship);

  const nodeScope = findNodeScope(scopes);
  if (nodeScope?.node.type === "discussion") {
    const discussion = await getDiscussion(nodeScope.node.id);
    const alreadySuggested = discussion && suggestions.some((s) => s.typeLabel === "Discussion" && s.label === discussion.title);
    if (discussion && !alreadySuggested) {
      suggestions.unshift({ relationshipType: "evidence", label: discussion.title, typeLabel: "Discussion" });
    }
  }

  return suggestions;
}

function buildSuggestedParticipants(entities: ExtractedEntity[]): string[] {
  return Array.from(new Set(entities.filter((entity) => entity.type === "participant").map((entity) => entity.value)));
}

/**
 * The Knowledge Capture Engine (Sprint 4.4). One generic pipeline for every
 * Knowledge Object type — Requirement, Decision, Action, Issue, Risk — never
 * a per-type service. Reuses the frozen Context/Evidence/Confidence/
 * Reasoning Engines (Sprints 4.2/4.3) exactly as Delta's own answers do;
 * adds only a title/description heuristic and a classification-reason line
 * on top. Never persists anything — `draft()` only ever returns a proposal.
 */
export interface KnowledgeCaptureEngine {
  draft(params: {
    type: KnowledgeObjectType;
    text: string;
    entities: ExtractedEntity[];
    context: ComprehensionContextInput;
  }): Promise<KnowledgeDraft>;
}

export class RelationshipDrivenKnowledgeCaptureEngine implements KnowledgeCaptureEngine {
  async draft({ type, text, entities, context }: {
    type: KnowledgeObjectType;
    text: string;
    entities: ExtractedEntity[];
    context: ComprehensionContextInput;
  }): Promise<KnowledgeDraft> {
    const scopes = contextEngine.resolveScopes(context);
    const evidence = await evidenceEngine.collect({ text, entities, scopes });
    const confidence = confidenceScorer.score(evidence);
    const currentContextType = context.discussionId ? ("discussion" as const) : undefined;
    const baseReasoning = reasoningEngine.explain(entities, evidence, confidence, currentContextType);
    const classificationReasons = buildClassificationReasons(type, text);
    const suggestedRelationships = await buildSuggestedRelationships(scopes, evidence);

    return {
      type,
      title: toTitle(text),
      description: text.trim(),
      priority: "medium",
      entities,
      evidence,
      confidence,
      suggestedRelationships,
      suggestedParticipants: buildSuggestedParticipants(entities),
      reasoning: { ...baseReasoning, found: [...classificationReasons, ...baseReasoning.found] },
    };
  }
}

export const knowledgeCaptureEngine: KnowledgeCaptureEngine = new RelationshipDrivenKnowledgeCaptureEngine();
