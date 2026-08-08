import Link from "next/link";
import { AlertTriangle, CalendarCheck, CircleHelp, FileX, Handshake, ListPlus, ScanSearch } from "lucide-react";

// Temporary placeholder cards. These represent the approved Attention
// examples until the Conversation Architecture / topic system exists to
// generate and link real items.
const placeholderItems = [
  { id: "requirement-detected", icon: ListPlus, title: "Requirement detected", description: "A new requirement was found in project evidence and needs review." },
  { id: "decision-awaiting-approval", icon: Handshake, title: "Decision awaiting approval", description: "A proposed decision is ready for sign-off." },
  { id: "missing-information", icon: CircleHelp, title: "Missing information", description: "Additional context is needed before this item can proceed." },
  { id: "conflict-detected", icon: AlertTriangle, title: "Conflict detected", description: "Two knowledge objects appear to contradict each other." },
  { id: "drawing-superseded", icon: FileX, title: "Drawing superseded", description: "A newer revision has replaced a referenced drawing." },
  { id: "meeting-summary-ready", icon: CalendarCheck, title: "Meeting summary ready", description: "A meeting summary is ready to review." },
  { id: "knowledge-extraction-pending", icon: ScanSearch, title: "Knowledge extraction pending", description: "Delta is preparing knowledge suggestions from recent evidence." },
];

export function AttentionPanelContent({ projectId }: { projectId: string }) {
  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-primary">Attention</p>

      <div className="mt-4 space-y-3">
        {placeholderItems.map(({ id, icon: Icon, title, description }) => (
          <Link
            key={id}
            href={`/projects/${projectId}`}
            className="block rounded-xl border border-border-subtle bg-surface-secondary p-4 transition hover:bg-surface-tertiary"
          >
            <div className="flex items-center gap-2">
              <Icon
                size={16}
                className="shrink-0 text-accent-primary"
              />
              <p className="text-[13px] font-semibold text-text-primary">{title}</p>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-text-secondary">{description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
