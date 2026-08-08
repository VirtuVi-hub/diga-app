import { WORKSPACE_ACTION_PANEL_WIDTH_CLASS, WORKSPACE_PANEL_GAP_CLASS, WORKSPACE_PANEL_PADDING_CLASS } from "@/lib/workspace-layout";
import { ProjectUpdatesPanel } from "./ProjectUpdatesPanel";
import { QuickActions } from "./QuickActions";

export function ActionPanel({
  showUpdates = true,
  onAddRequirement,
}: {
  showUpdates?: boolean;
  onAddRequirement?: () => void;
}) {
  return (
    <aside
      className={`hidden ${WORKSPACE_ACTION_PANEL_WIDTH_CLASS} shrink-0 flex-col ${WORKSPACE_PANEL_GAP_CLASS} border-l border-border-subtle bg-surface-primary ${WORKSPACE_PANEL_PADDING_CLASS} xl:flex`}
    >
      <div className="shrink-0">
        <QuickActions onAddRequirement={onAddRequirement} />
      </div>

      {showUpdates && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* `/review` is the legacy static demo with no real Event Log behind it (Sprint 4.9) — an empty list correctly renders the panel's own "nothing has happened yet" state instead of fabricated fixture data. */}
          <ProjectUpdatesPanel entries={[]} />
        </div>
      )}
    </aside>
  );
}
