import type { TimelineEntry } from "@/lib/events/timeline-projection";

/**
 * Day-bucketing for the Timeline UI (Sprint 4.6). Deliberately kept separate
 * from `timeline-projection.ts` — grouping-by-recency is a page-level
 * presentational concern, not part of the core `Event[] -> TimelineEntry[]`
 * projection contract (other consumers, e.g. Delta's timeline-question
 * answering, want a flat list instead).
 */
export type TimelineGroupLabel = "Today" | "Yesterday" | "Earlier";

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function labelFor(timestamp: string, now: Date): TimelineGroupLabel {
  const dayMs = 86_400_000;
  const entryStart = startOfDay(new Date(timestamp));
  const todayStart = startOfDay(now);

  if (entryStart === todayStart) return "Today";
  if (entryStart === todayStart - dayMs) return "Yesterday";
  return "Earlier";
}

/**
 * Groups entries into Today/Yesterday/Earlier buckets, newest group first.
 * Expects `entries` newest-first; preserves that order within each bucket.
 */
export function groupByRecency(entries: TimelineEntry[], now: Date = new Date()): { label: TimelineGroupLabel; entries: TimelineEntry[] }[] {
  const buckets: Record<TimelineGroupLabel, TimelineEntry[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  for (const entry of entries) {
    buckets[labelFor(entry.timestamp, now)].push(entry);
  }

  return (["Today", "Yesterday", "Earlier"] as const)
    .map((label) => ({ label, entries: buckets[label] }))
    .filter((group) => group.entries.length > 0);
}
