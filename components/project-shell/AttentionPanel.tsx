import { WORKSPACE_ATTENTION_PANEL_WIDTH_CLASS, WORKSPACE_PANEL_PADDING_CLASS } from "@/lib/workspace-layout";
import { AttentionPanelContent } from "./AttentionPanelContent";

export function AttentionPanel({ projectId }: { projectId: string }) {
  return (
    <aside
      className={`hidden ${WORKSPACE_ATTENTION_PANEL_WIDTH_CLASS} shrink-0 overflow-y-auto border-l border-border-subtle bg-surface-primary ${WORKSPACE_PANEL_PADDING_CLASS} xl:block`}
    >
      <AttentionPanelContent projectId={projectId} />
    </aside>
  );
}
