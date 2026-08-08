import { RecommendationService } from "@/lib/services/recommendation-service";
import type { DeltaRelatedResult } from "@/lib/intelligence-engine/delta-query-resolver";
import type { Evidence } from "@/types/evidence";

/**
 * Delta Integration (Sprint 4.8, goal 7): "What should I do next?", "What
 * requires attention?", "What recommendations do you have?" — answered by
 * listing real, open Recommendations, never a new AI pipeline. Structurally
 * mirrors `lib/knowledge-validation/approval-query.ts` (Sprint 4.7): a small
 * keyword match, checked before Comprehension runs, wired into
 * `delta-query-resolver.ts` as one additional early-exit branch.
 *
 * Trigger phrases are deliberately narrow. `"what's missing"`/`"what is
 * missing"` only matches the ENTIRE trimmed question (anchored), not as a
 * substring — otherwise a genuine evidence question like "What's missing
 * from the accessibility report?" would be wrongly hijacked into a generic
 * recommendations listing instead of running the normal evidence pipeline.
 */
export function detectRecommendationQuestion(text: string): boolean {
  const normalized = text.toLowerCase().trim();

  return (
    /\bwhat should i do next\b/.test(normalized) ||
    /\bwhat('| i)s next\b/.test(normalized) ||
    /\b(requires?|needs?)( my)? attention\b/.test(normalized) ||
    /\brecommendations?\b/.test(normalized) ||
    /^what('| i)s missing\??$/.test(normalized)
  );
}

/** `getRecommendations()` is deliberately unfiltered by `projectId` — same rationale as `getTimeline()` (Sprint 4.6): Discussion-sourced recommendations can't carry one yet (`Discussion` has no `projectId` field). */
export async function answerRecommendationQuestion(): Promise<DeltaRelatedResult> {
  const recommendations = await RecommendationService.list({ status: "open" });

  const evidence: Evidence[] = recommendations.map((recommendation) => ({
    id: recommendation.id,
    title: recommendation.title,
    type: "Recommendation",
    relationship: "related",
    relevance: 1,
    confidence: 1,
    excerpt: recommendation.description,
  }));

  return {
    kind: "related",
    heading: "Recommendations",
    evidence,
    reasoning: {
      found: evidence.map((item) => `✓ ${item.title}`),
      missing: [],
      conclusion: recommendations.length
        ? `${recommendations.length} open recommendation${recommendations.length === 1 ? "" : "s"}.`
        : "No open recommendations right now.",
    },
    confidence: recommendations.length ? "medium" : "high",
  };
}
