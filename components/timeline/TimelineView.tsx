"use client";

import { useMemo, useState } from "react";
import { groupByRecency } from "@/lib/events/timeline-grouping";
import { TIMELINE_CATEGORY_LABEL, type TimelineCategory, type TimelineEntry } from "@/lib/events/timeline-projection";
import { TimelineEntryCard } from "./TimelineEntryCard";

type Filter = "all" | TimelineCategory;

const FILTERS: Filter[] = ["all", "knowledge", "relationships", "discussions", "intelligence"];

function filterLabel(filter: Filter): string {
  return filter === "all" ? "All" : TIMELINE_CATEGORY_LABEL[filter];
}

export function TimelineView({
  projectId,
  entries,
  nextStepByNodeId,
}: {
  projectId: string;
  entries: TimelineEntry[];
  /** Sprint 4.9 (§6B) — real, currently-open Recommendation titles keyed by related node id; omitted entirely when none exists for an entry. */
  nextStepByNodeId?: Record<string, string>;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(
    () => (filter === "all" ? entries : entries.filter((entry) => entry.category === filter)),
    [entries, filter],
  );

  const groups = useMemo(() => groupByRecency(filtered), [filtered]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
              filter === option
                ? "border-accent-primary bg-accent-muted text-accent-primary"
                : "border-border-subtle text-text-secondary hover:bg-surface-tertiary"
            }`}
          >
            {filterLabel(option)}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="mt-8 text-[14px] text-text-tertiary">
          {entries.length === 0 ? "Nothing has happened on this project yet." : "No events match this filter."}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <section key={group.label}>
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-text-tertiary">{group.label}</h3>
              <div className="mt-3 space-y-2">
                {group.entries.map((entry) => (
                  <TimelineEntryCard
                    key={entry.id}
                    entry={entry}
                    projectId={projectId}
                    nextStep={entry.relatedNode ? nextStepByNodeId?.[entry.relatedNode.id] : undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
