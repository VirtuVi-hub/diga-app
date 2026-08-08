import { formatDateTime } from "@/lib/format-time";
import { TIMELINE_CATEGORY_LABEL, type TimelineEntry } from "@/lib/events/timeline-projection";
import { DeltaMark } from "./DeltaMark";

/**
 * Sprint 4.9 (§6D): real Event-derived data, not a static fixture — the
 * same `TimelineEntry` shape and `summarize()`/`TIMELINE_CATEGORY_LABEL`
 * output the Timeline page itself renders (`components/timeline/
 * TimelineEntryCard.tsx`), just the newest few. Timeline, Notifications, and
 * Project Updates are different projections of the same Event stream, per
 * the brief — this panel does no computation of its own beyond formatting.
 */
export function ProjectUpdatesPanel({ entries }: { entries: TimelineEntry[] }) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <DeltaMark size={17} />
        <h2 className="font-display text-[21px] font-semibold text-text-primary">Delta Project Updates</h2>
      </div>

      {entries.length === 0 ? (
        <p className="mt-3 text-[13px] text-text-tertiary">Nothing has happened on this project yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-lg border border-border-subtle bg-surface-secondary px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-accent-muted px-2 py-0.5 text-[10px] font-semibold text-accent-primary">{TIMELINE_CATEGORY_LABEL[entry.category]}</span>
                <time className="text-[11px] text-text-tertiary">{formatDateTime(entry.timestamp)}</time>
              </div>
              <p className="mt-1.5 text-[13px] leading-5 text-text-secondary">{entry.summary}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
