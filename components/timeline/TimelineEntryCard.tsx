import Link from "next/link";
import { formatDateTime } from "@/lib/format-time";
import { nodeHref } from "@/lib/relationship-utils";
import { TIMELINE_CATEGORY_LABEL, type TimelineCategory, type TimelineEntry } from "@/lib/events/timeline-projection";

const CATEGORY_BADGE_CLASS: Record<TimelineCategory, string> = {
  knowledge: "bg-accent-primary/15 text-accent-primary",
  relationships: "bg-info/15 text-info",
  discussions: "bg-success/15 text-success",
  approvals: "bg-warning/15 text-warning",
  governance: "bg-agreement/15 text-agreement",
  intelligence: "bg-text-tertiary/15 text-text-tertiary",
};

function relatedHref(projectId: string, entry: TimelineEntry): string | undefined {
  return entry.relatedNode ? nodeHref(projectId, entry.relatedNode) : undefined;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

function CardBody({ entry, nextStep }: { entry: TimelineEntry; nextStep?: string }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] font-semibold text-text-primary">{entry.summary}</p>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CATEGORY_BADGE_CLASS[entry.category]}`}
        >
          {TIMELINE_CATEGORY_LABEL[entry.category]}
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-text-tertiary">
        <span>{formatDateTime(entry.timestamp)}</span>
        {entry.actorId && (
          <>
            <span aria-hidden>·</span>
            <span>{entry.actorId}</span>
          </>
        )}
        {entry.relatedTitle && (
          <>
            <span aria-hidden>·</span>
            <span className="truncate text-text-secondary">{entry.relatedTitle}</span>
          </>
        )}
        {entry.resultingState && (
          <>
            <span aria-hidden>·</span>
            <span>Status: {capitalize(entry.resultingState)}</span>
          </>
        )}
      </div>

      {/* Sprint 4.9 (§6B) — only shown when a real, currently-open Recommendation exists for this entry's related node; never invented. */}
      {nextStep && <p className="mt-1.5 text-[12px] text-accent-primary">→ {nextStep}</p>}
    </>
  );
}

export function TimelineEntryCard({ entry, projectId, nextStep }: { entry: TimelineEntry; projectId: string; nextStep?: string }) {
  const href = relatedHref(projectId, entry);

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg border border-border-subtle bg-surface-primary px-4 py-3 transition hover:border-border-strong"
      >
        <CardBody
          entry={entry}
          nextStep={nextStep}
        />
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-primary px-4 py-3">
      <CardBody
        entry={entry}
        nextStep={nextStep}
      />
    </div>
  );
}
