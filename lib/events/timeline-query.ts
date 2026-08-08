import { EventService } from "@/lib/services/event-service";
import { TIMELINE_CATEGORY_LABEL, timelineProjection } from "@/lib/events/timeline-projection";
import type { Evidence, ReasoningResult } from "@/types/evidence";
import type { DeltaRelatedResult } from "@/lib/intelligence-engine/delta-query-resolver";

/**
 * Detects whether a (comprehension-normalized) question is asking about
 * project history/change over time, and if so which window. Deliberately a
 * small, narrow keyword match living alongside the Event Engine rather than
 * inside the frozen Comprehension/Intent pipeline — this is "reuse the
 * existing Intelligence and Event architecture," not a separate Timeline AI:
 * detection reuses Comprehension's own translated text, answering reuses the
 * Sprint 4.5 Timeline Projection, and rendering reuses the existing `related`
 * Delta response kind (see `answerTimelineQuery` below).
 */
export type TimelineQuery = {
  heading: string;
  from: number;
  to: number;
  onlyApprovals?: boolean;
};

const DAY_MS = 86_400_000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function detectTimelineQuery(text: string, now: Date = new Date()): TimelineQuery | null {
  const normalized = text.toLowerCase();
  const onlyApprovals = /\bapprov(ed|al)\b/.test(normalized);

  let range: { label: string; from: number; to: number } | null = null;

  if (/\byesterday\b/.test(normalized)) {
    const todayStart = startOfDay(now);
    range = { label: "Yesterday", from: todayStart - DAY_MS, to: todayStart };
  } else if (/\btoday\b/.test(normalized)) {
    const todayStart = startOfDay(now);
    range = { label: "Today", from: todayStart, to: todayStart + DAY_MS };
  } else if (/\b(this week|past week|last week)\b/.test(normalized)) {
    range = { label: "This week", from: now.getTime() - 7 * DAY_MS, to: now.getTime() + DAY_MS };
  } else if (/\b(recently|since the last meeting|what changed|what('| ha)s changed)\b/.test(normalized) || onlyApprovals) {
    // Vaguer temporal cues (and bare "approved"/"approval" mentions) default to a trailing 7-day window.
    range = { label: "Recently", from: now.getTime() - 7 * DAY_MS, to: now.getTime() + DAY_MS };
  }

  if (!range) return null;

  return {
    heading: onlyApprovals ? `${range.label} approved` : range.label,
    from: range.from,
    to: range.to,
    onlyApprovals,
  };
}

export async function answerTimelineQuery(query: TimelineQuery, projectId?: string): Promise<DeltaRelatedResult> {
  const events = await EventService.list(projectId ? { projectId } : undefined);
  const entries = timelineProjection
    .project(events)
    .filter((entry) => {
      const time = new Date(entry.timestamp).getTime();
      return time >= query.from && time < query.to;
    })
    .filter((entry) => !query.onlyApprovals || entry.category === "approvals")
    .slice()
    .reverse();

  const evidence: Evidence[] = entries.map((entry) => ({
    id: entry.id,
    title: entry.summary,
    type: TIMELINE_CATEGORY_LABEL[entry.category],
    relationship: "related",
    relevance: 1,
    confidence: 1,
  }));

  const reasoning: ReasoningResult = {
    found: [],
    missing: [],
    conclusion: entries.length
      ? `${entries.length} event${entries.length === 1 ? "" : "s"} found for ${query.heading.toLowerCase()}.`
      : `No events found for ${query.heading.toLowerCase()}.`,
  };

  return {
    kind: "related",
    heading: query.heading,
    evidence,
    reasoning,
    confidence: entries.length ? "high" : "none",
  };
}
