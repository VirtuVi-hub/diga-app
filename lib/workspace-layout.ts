/**
 * Shared column widths, padding, gaps, and breakpoints for the project
 * workspace's multi-column layout, consumed by `components/workspace/WorkspaceLayout`.
 * The Journal (project Home) page is the reference layout — other pages that
 * reuse its columns (e.g. Discussion) render inside that same layout
 * component instead of hardcoding their own values, so the pages stay in
 * sync.
 */

export const WORKSPACE_TIMELINE_WIDTH_CLASS = "w-[40px]";

export const WORKSPACE_FEED_MAX_WIDTH_CLASS = "max-w-6xl";
export const WORKSPACE_FEED_PADDING_CLASS = "px-6 pt-3 pb-8";

export const WORKSPACE_ATTENTION_PANEL_WIDTH_CLASS = "w-[300px]";
export const WORKSPACE_ACTION_PANEL_WIDTH_CLASS = "w-[340px]";
export const WORKSPACE_PANEL_PADDING_CLASS = "px-6 py-6";
export const WORKSPACE_PANEL_GAP_CLASS = "gap-6";
