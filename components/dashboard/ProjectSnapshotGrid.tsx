import type { ProjectSnapshot } from "@/lib/types/dashboard";

const ROWS: { key: keyof ProjectSnapshot; label: string }[] = [
  { key: "requirements", label: "Requirements" },
  { key: "decisions", label: "Decisions" },
  { key: "issues", label: "Issues" },
  { key: "actions", label: "Actions" },
  { key: "risks", label: "Risks" },
  { key: "drawings", label: "Drawings" },
  { key: "documents", label: "Documents" },
  { key: "discussions", label: "Discussions" },
  { key: "timelineEvents", label: "Timeline Events" },
  { key: "participants", label: "Participants" },
];

/** Module 5: Project Snapshot — plain totals, straight from the repositories every other page already reads. */
export function ProjectSnapshotGrid({ snapshot }: { snapshot: ProjectSnapshot }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-text-primary">Project Snapshot</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ROWS.map((row) => (
          <div
            key={row.key}
            className="rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3 text-center"
          >
            <p className="text-xl font-semibold text-text-primary">{snapshot[row.key]}</p>
            <p className="mt-0.5 text-[12px] text-text-tertiary">{row.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
