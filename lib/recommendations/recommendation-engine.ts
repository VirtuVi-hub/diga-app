import { recommendationRepository } from "@/lib/repositories/recommendation-repository";
import { isSameRelationshipNode } from "@/lib/relationship-utils";
import { defaultRecommendationRules, type RecommendationRule } from "./recommendation-rules";
import type { Event } from "@/types/event";
import type { Recommendation } from "@/types/recommendation";

/**
 * Module: Recommendation Engine (Sprint 4.8). Observes Events and produces
 * advisory Recommendations — never mutates project data, never creates
 * Knowledge Objects, never approves anything. Rule-driven and reusable:
 * every collaborator (the rule list) is constructor-injected, matching the
 * exact interface/impl/singleton pattern established since Sprint 4.1.
 */
export interface RecommendationEngine {
  evaluate(event: Event): Promise<Recommendation[]>;
}

function isDuplicateOf(existing: Recommendation, candidate: { recommendationType: string; relatedNodes: Recommendation["relatedNodes"] }): boolean {
  if (existing.recommendationType !== candidate.recommendationType) return false;
  const existingPrimary = existing.relatedNodes[0];
  const candidatePrimary = candidate.relatedNodes[0];
  if (!existingPrimary || !candidatePrimary) return false;
  return isSameRelationshipNode(existingPrimary, candidatePrimary);
}

export class RuleBasedRecommendationEngine implements RecommendationEngine {
  constructor(private readonly rules: RecommendationRule[] = defaultRecommendationRules) {}

  async evaluate(event: Event): Promise<Recommendation[]> {
    // Recommendations are a user-facing capability — "internal" events are
    // system/audit bookkeeping never meant to reach a human (same
    // significance filter `TimelineProjection` applies).
    if (event.visibility !== "project") return [];

    const openRecommendations = await recommendationRepository.list({ status: "open" });
    const created: Recommendation[] = [];

    for (const rule of this.rules) {
      const input = await rule.evaluate(event);
      if (!input) continue;

      const isDuplicate = [...openRecommendations, ...created].some((existing) => isDuplicateOf(existing, input));
      if (isDuplicate) continue;

      const recommendation = await recommendationRepository.create(input);
      created.push(recommendation);
    }

    return created;
  }
}

export const recommendationEngine: RecommendationEngine = new RuleBasedRecommendationEngine();
