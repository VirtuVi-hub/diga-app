import type { ReactNode } from "react";
import {
  WORKSPACE_ACTION_PANEL_WIDTH_CLASS,
  WORKSPACE_ATTENTION_PANEL_WIDTH_CLASS,
  WORKSPACE_PANEL_GAP_CLASS,
  WORKSPACE_PANEL_PADDING_CLASS,
} from "@/lib/workspace-layout";

/**
 * Shared workspace shell — owns the grid, column widths, panel heights,
 * gaps, overflow, scrolling, and responsive breakpoints for every page that
 * renders the Journal-style workspace (Journal itself, Discussion, …).
 * Pages only provide content for the slots below; the shell never changes
 * per page.
 */
export function WorkspaceLayout({
  leftPrimaryContent,
  attentionPanel,
  actionsPanel,
  updatesPanel,
  contextPanel,
}: {
  leftPrimaryContent: ReactNode;
  attentionPanel?: ReactNode;
  actionsPanel?: ReactNode;
  updatesPanel?: ReactNode;
  contextPanel?: ReactNode;
}) {
  const hasActionRail = Boolean(actionsPanel || updatesPanel || contextPanel);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <main className="min-w-0 flex-1 overflow-y-auto">{leftPrimaryContent}</main>

      {attentionPanel && (
        <aside
          className={`hidden ${WORKSPACE_ATTENTION_PANEL_WIDTH_CLASS} shrink-0 overflow-y-auto border-l border-border-subtle bg-surface-primary ${WORKSPACE_PANEL_PADDING_CLASS} xl:block`}
        >
          {attentionPanel}
        </aside>
      )}

      {hasActionRail && (
        <aside
          className={`hidden ${WORKSPACE_ACTION_PANEL_WIDTH_CLASS} shrink-0 flex-col ${WORKSPACE_PANEL_GAP_CLASS} border-l border-border-subtle bg-surface-primary ${WORKSPACE_PANEL_PADDING_CLASS} xl:flex`}
        >
          {actionsPanel && <div className="shrink-0">{actionsPanel}</div>}
          {updatesPanel && <div className="min-h-0 flex-1 overflow-y-auto">{updatesPanel}</div>}
          {contextPanel && <div className="min-h-0 flex-1 overflow-y-auto">{contextPanel}</div>}
        </aside>
      )}
    </div>
  );
}
