import { getMissionControlData } from "@/lib/actions/dashboard-actions";
import { answerTimelineQuery, detectTimelineQuery } from "@/lib/events/timeline-query";
import type { DeltaRelatedResult } from "@/lib/intelligence-engine/delta-query-resolver";
import type { Evidence } from "@/types/evidence";

/**
 * Module 12: Delta Integration. Structurally mirrors every prior sprint's
 * own Delta query file (`onboarding-query.ts`, `revision-query.ts`,
 * `gateway-query.ts`): a small, anchored keyword match, checked before
 * Comprehension runs, answered from `getMissionControlData()` — the exact
 * same aggregator the Dashboard page itself renders — never a new AI
 * pipeline, never a second computation of health/attention.
 *
 * "What recommendations are open?" is deliberately NOT duplicated here — it
 * is already answered correctly by `recommendation-query.ts` (Sprint 4.8),
 * and Module 7/"Do NOT create new recommendation logic" asks this sprint to
 * reuse that, not re-implement it.
 *
 * "What needs my attention?" IS deliberately intercepted here even though
 * Sprint 4.8 already claims that exact phrase for a plain open-
 * Recommendations list — this sprint's Attention Center is a strict
 * superset of that (open Recommendations are one of its five categories,
 * alongside pending approvals, Gateway review requests, onboarding gaps,
 * and new revisions), so the richer answer wins by being checked earlier in
 * `delta-query-resolver.ts`, not by editing Sprint 4.8's own frozen file.
 *
 * "What changed since yesterday?" turned out to need a real fix, found via
 * this sprint's own live testing: Sprint 5.0's `detectRevisionQuestion()`
 * also matches bare "what changed" and runs earlier in the resolver chain,
 * so it hijacked this phrase into an unhelpful "no revisions detected"
 * answer (fixed narrowly in `revision-query.ts` — see its own comment).
 * Once unblocked, the phrase still never reached `timeline-query.ts`'s own
 * handling, because that branch runs *after* the Comprehension Engine's
 * clarification gate, and "what changed since yesterday" doesn't classify
 * confidently enough to survive it — a pre-existing Comprehension
 * limitation, not something this sprint may fix (that pipeline is frozen).
 * The honest, narrow fix is to reuse `timeline-query.ts`'s own
 * `detectTimelineQuery`/`answerTimelineQuery` directly from here, checked
 * before Comprehension runs at all — same reuse, just earlier, matching
 * exactly how every Sprint 4.7+ branch above already avoids that gate.
 */
export type DashboardQueryKind = "attention" | "health" | "pending_approvals" | "recent_changes";

export function detectDashboardQuestion(text: string): DashboardQueryKind | null {
  const normalized = text.toLowerCase().trim();

  if (/\b(requires?|needs?)( my)? attention\b/.test(normalized)) return "attention";
  if (/\bhow healthy\b/.test(normalized) || /\bproject health\b/.test(normalized) || /\bhealth of (this|the) project\b/.test(normalized)) return "health";
  if (/\bpending approvals?\b/.test(normalized) || (/\bwhat approvals?\b/.test(normalized) && /\bpending\b/.test(normalized))) return "pending_approvals";
  if (/\bwhat(?:'s| has)?\s+changed\b/.test(normalized) && /\b(yesterday|today|this week|past week|last week|recently|since)\b/.test(normalized)) return "recent_changes";

  return null;
}

function toEvidence(id: string, title: string, type: string, excerpt: string): Evidence {
  return { id, title, type, relationship: "related", relevance: 1, confidence: 1, excerpt };
}

export async function answerDashboardQuestion(projectId: string, kind: DashboardQueryKind, rawText: string): Promise<DeltaRelatedResult> {
  if (kind === "recent_changes") {
    const query = detectTimelineQuery(rawText);
    if (query) return answerTimelineQuery(query, projectId);
  }

  const data = await getMissionControlData(projectId);

  if (!data) {
    return {
      kind: "related",
      heading: "Dashboard",
      evidence: [],
      reasoning: { found: [], missing: [], conclusion: "This project could not be found." },
      confidence: "none",
    };
  }

  if (kind === "attention") {
    const evidence = data.attention.map((item) => toEvidence(item.id, item.title, item.categoryLabel, item.description));
    return {
      kind: "related",
      heading: "What Needs Your Attention",
      evidence,
      reasoning: {
        found: evidence.map((item) => `✓ ${item.title}`),
        missing: [],
        conclusion: evidence.length ? `${evidence.length} item(s) need attention, most urgent first.` : "Nothing needs your attention right now.",
      },
      confidence: evidence.length ? "medium" : "high",
    };
  }

  if (kind === "pending_approvals") {
    const items = data.attention.filter((item) => item.category === "approval");
    const evidence = items.map((item) => toEvidence(item.id, item.title, item.categoryLabel, item.description));
    return {
      kind: "related",
      heading: "Pending Approvals",
      evidence,
      reasoning: {
        found: evidence.map((item) => `✓ ${item.title}`),
        missing: [],
        conclusion: evidence.length ? `${evidence.length} item(s) waiting on a named approver.` : "Nothing is waiting on a named approver right now.",
      },
      confidence: evidence.length ? "medium" : "high",
    };
  }

  // "health", and the defensive fallback for "recent_changes" in the
  // unreachable case `detectTimelineQuery` doesn't recognize a phrase
  // `detectDashboardQuestion` already matched with the same keyword set.
  const evidence = data.health.map((metric) => toEvidence(metric.key, metric.label, "Health Metric", `${metric.value}${metric.unit === "%" ? "%" : ""} — ${metric.detail}`));
  const attentionCount = data.attention.length;

  return {
    kind: "related",
    heading: "Project Health",
    evidence,
    reasoning: {
      found: evidence.map((item) => `✓ ${item.title}`),
      missing: [],
      conclusion: attentionCount ? `${attentionCount} item(s) currently need attention — see the metrics for detail.` : "No open attention items — this project is in good shape.",
    },
    confidence: "high",
  };
}
