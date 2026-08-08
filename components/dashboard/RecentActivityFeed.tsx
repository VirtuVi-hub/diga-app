import Link from "next/link";
import { TimelineEntryCard } from "@/components/timeline/TimelineEntryCard";
import type { TimelineEntry } from "@/lib/events/timeline-projection";

/** Module 6: Recent Activity — reuses `TimelineEntryCard` directly (Sprint 4.6/4.9), the same component the Timeline page itself renders, so click-through to the related object works identically here. */
export function RecentActivityFeed({ entries, projectId }: { entries: TimelineEntry[]; projectId: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-text-primary">Recent Activity</h3>
        <Link
          href={`/projects/${projectId}/timeline`}
          className="text-[13px] text-accent-primary hover:underline"
        >
          View full Timeline →
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="mt-3 text-[13px] text-text-tertiary">Nothing has happened yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {entries.map((entry) => (
            <TimelineEntryCard
              key={entry.id}
              entry={entry}
              projectId={projectId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
