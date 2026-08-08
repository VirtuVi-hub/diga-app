import { RevisionService } from "@/lib/services/revision-service";
import type { DeltaRelatedResult } from "@/lib/intelligence-engine/delta-query-resolver";
import type { Evidence } from "@/types/evidence";

/**
 * Module 11: Delta Integration. Structurally mirrors
 * `recommendation-query.ts` (Sprint 4.8) and `timeline-query.ts` (Sprint
 * 4.6): a small keyword match, checked before Comprehension runs, answered
 * by listing real, already-persisted `Revision` records — never a new AI
 * pipeline, never a second reasoning implementation. One unified answer
 * covers every trigger phrase below; Revision Intelligence is a foundation
 * this sprint, not a deep per-phrase NLU system, so every phrase
 * deliberately routes to the same honest, evidence-backed listing rather
 * than a fabricated, differently-worded reply per exact phrasing.
 */
/**
 * Sprint 5.5 fix (found via this sprint's own live testing, not assumed
 * away): "what changed" bare is ambiguous and correctly favors this
 * Revision Intelligence answer, but "What changed *since yesterday*?" (a
 * Mission Control dashboard question, Module 12) was being hijacked by the
 * same pattern before `timeline-query.ts`'s own "what changed" handling
 * (Sprint 4.6, checked later in `delta-query-resolver.ts` since it needs
 * Comprehension's translated text) ever ran — silently returning "no
 * revisions detected" instead of the intended recent-activity answer. A
 * phrase carrying an explicit temporal window is unambiguously a Timeline
 * question, not a Revision one, so it's excluded here rather than by
 * reordering the two branches (which would require moving the timeline
 * check earlier for reasons unrelated to this bug).
 */
const TEMPORAL_QUALIFIER = /\b(yesterday|today|this week|past week|last week|since)\b/;

/**
 * Sprint 5.7 fix (found via this sprint's own live testing, same bug class
 * as the Sprint 5.5 fix above): "What changed in this agreement?" was
 * being hijacked by the same bare `what changed` pattern before
 * `governance-query.ts`'s own, more specific "what changed in (the|this)
 * agreement" handling (checked later in `delta-query-resolver.ts`) ever
 * ran — silently returning "no revisions detected" instead of the
 * Document Revision Intelligence answer. An explicit mention of the
 * Agreement or one of its clauses is unambiguously a Governance/Document
 * Revision question, not a Drawing Revision one — excluded here rather
 * than by reordering the two branches, for the exact same reason the
 * Sprint 5.5 fix gives.
 */
const AGREEMENT_QUALIFIER = /\bagreement\b|\bclause\b/;

export function detectRevisionQuestion(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  if (TEMPORAL_QUALIFIER.test(normalized)) return false;
  if (AGREEMENT_QUALIFIER.test(normalized)) return false;

  return (
    /\bwhat(?:'s| has)?\s+changed\b/.test(normalized) ||
    /\bwhy (did|has|would) (it|this) change/.test(normalized) ||
    /\bwhich drawings?\b.*\baffected\b/.test(normalized) ||
    /\bwhich requirements?\b.*\bchang/.test(normalized) ||
    /\bwhat should i review\b/.test(normalized) ||
    /\bwhat recommendations?\b.*\bgenerated\b/.test(normalized) ||
    /\bwho should be notified\b/.test(normalized) ||
    /\bwhat approvals?\b.*\baffected\b/.test(normalized) ||
    /\b(revision|design) changes?\b/.test(normalized)
  );
}

/**
 * `RevisionService.list()` is deliberately filtered by `projectId` (unlike
 * `getRecommendations()`/`getTimeline()`) — every `Revision` this sprint's
 * pipeline creates always carries a real `projectId` (Module 1's own input
 * requires it), so there is no pre-existing gap to work around here.
 */
export async function answerRevisionQuestion(projectId: string): Promise<DeltaRelatedResult> {
  const revisions = await RevisionService.list({ projectId });

  const evidence: Evidence[] = revisions.map((revision) => ({
    id: revision.id,
    title: revision.detectedChange,
    type: "Revision",
    relationship: "related",
    relevance: 1,
    confidence: 1,
    excerpt: [revision.reasoning.conclusion, revision.suggestedActions.length ? `Suggested: ${revision.suggestedActions.join("; ")}` : undefined]
      .filter(Boolean)
      .join(" "),
  }));

  return {
    kind: "related",
    heading: "Revision Changes",
    evidence,
    reasoning: {
      found: evidence.map((item) => `✓ ${item.title}`),
      missing: [],
      conclusion: revisions.length
        ? `${revisions.length} detected revision${revisions.length === 1 ? "" : "s"}.`
        : "No revisions have been detected yet.",
    },
    confidence: revisions.length ? "medium" : "high",
  };
}
