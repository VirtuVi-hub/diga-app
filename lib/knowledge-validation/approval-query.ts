import { getKnowledgeObject, getKnowledgeObjects } from "@/lib/actions/knowledge-object-actions";
import { knowledgeValidationEngine } from "./knowledge-validation-engine";
import type { DeltaRelatedResult, DeltaUnknownResult } from "@/lib/intelligence-engine/delta-query-resolver";
import type { ComprehensionContextInput } from "@/types/comprehension";
import type { Evidence } from "@/types/evidence";

/**
 * Delta Integration (Sprint 4.7, goal 7): "Why should this be approved?",
 * "What evidence supports this?", "Who should review this?", "What
 * information is missing?" — answered by reshaping the same
 * `KnowledgeValidation` the Validation Panel itself displays, never a new AI
 * pipeline. Structurally mirrors `lib/events/timeline-query.ts`'s
 * `detectTimelineQuery`/`answerTimelineQuery` (Sprint 4.6): a small, narrow
 * keyword match living alongside the capability it belongs to, wired into
 * `delta-query-resolver.ts` as one additional early-exit branch, gated on
 * `context.knowledgeObjectId` being present so it can never fire for a
 * query outside a Knowledge Object's own page.
 */
export type ApprovalQuestionKind = "reviewers" | "missing" | "reasoning";

/**
 * Sprint 4.9 fix: asking these questions from the Journal (a Discussion
 * context, no `knowledgeObjectId`) previously never reached this branch at
 * all, since `knowledgeObjectId` is only ever set on a Knowledge Object's
 * own page — making these questions "inconsistent" exactly as reported.
 * When only `discussionId` is known, resolve to that discussion's most
 * recently created Knowledge Object (a real lookup, `getKnowledgeObjects`,
 * already used elsewhere) rather than guessing; if the discussion has none,
 * return `undefined` so the caller falls through to the honest normal
 * pipeline instead of fabricating an answer about nothing.
 */
export async function resolveKnowledgeObjectIdForContext(context: ComprehensionContextInput): Promise<string | undefined> {
  if (context.knowledgeObjectId) return context.knowledgeObjectId;
  if (!context.discussionId) return undefined;

  const objects = await getKnowledgeObjects(context.discussionId);
  if (objects.length === 0) return undefined;

  const mostRecent = [...objects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return mostRecent.id;
}

export function detectApprovalQuestion(text: string): ApprovalQuestionKind | null {
  const normalized = text.toLowerCase();

  if (/\breview(er|ers)?\b/.test(normalized) || /\bwho should\b/.test(normalized)) return "reviewers";
  if (/\bmissing\b|\bwhat('| i)s missing\b/.test(normalized)) return "missing";
  if (/\bapprov/.test(normalized) || /\bevidence\b/.test(normalized) || /\bwhy\b/.test(normalized)) return "reasoning";

  return null;
}

function unknownResult(message: string): DeltaUnknownResult {
  return { kind: "unknown", message, evidenceFound: [], missingEvidence: [], confidence: "none" };
}

export async function answerApprovalQuestion(
  knowledgeObjectId: string,
  kind: ApprovalQuestionKind,
): Promise<DeltaRelatedResult | DeltaUnknownResult> {
  const object = await getKnowledgeObject(knowledgeObjectId);
  if (!object) return unknownResult("I couldn't find that knowledge item.");

  const validation = await knowledgeValidationEngine.assemble(object);

  if (kind === "reviewers") {
    const evidence: Evidence[] = validation.suggestedReviewers.map((reviewer) => ({
      id: reviewer.id,
      title: reviewer.name,
      type: "Person",
      relationship: "related",
      relevance: 1,
      confidence: 1,
      excerpt: reviewer.reason,
    }));

    return {
      kind: "related",
      heading: "Suggested Reviewers",
      evidence,
      reasoning: {
        found: evidence.map((item) => `✓ ${item.title} — ${item.excerpt}`),
        missing: [],
        conclusion: evidence.length
          ? `${evidence.length} suggested reviewer${evidence.length === 1 ? "" : "s"} found.`
          : "No reviewers could be suggested — consider assigning one manually.",
      },
      confidence: evidence.length ? "medium" : "none",
    };
  }

  if (kind === "missing") {
    const evidence: Evidence[] = validation.checks.map((check) => ({
      id: check.id,
      title: check.detail,
      type: check.severity === "warning" ? "Warning" : "Info",
      relationship: "related",
      relevance: 1,
      confidence: 1,
    }));

    return {
      kind: "related",
      heading: "What's Missing",
      evidence,
      reasoning: {
        found: [],
        missing: evidence.map((item) => item.title),
        conclusion: evidence.length
          ? `${evidence.length} item${evidence.length === 1 ? "" : "s"} flagged for review — see checks above.`
          : "No issues found — nothing appears to be missing.",
      },
      confidence: evidence.length ? "medium" : "high",
    };
  }

  return {
    kind: "related",
    heading: "Why This Should Be Approved",
    evidence: [...validation.evidence, ...validation.relatedKnowledge],
    reasoning: validation.reasoning,
    confidence: validation.confidence,
  };
}
