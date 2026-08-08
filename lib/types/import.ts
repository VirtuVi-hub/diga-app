import { UPLOAD_CATEGORIES, type UploadCategory } from "@/lib/types/onboarding";

/**
 * Sprint 5.6 (Existing Project Import). Reuses Sprint 5.4's own 8 onboarding
 * upload categories verbatim — same keys, same `document_types` names, same
 * Gateway `sourceType`s — and appends exactly one new category ("Meeting
 * Minutes", a `document_types` row that already existed before this sprint,
 * seeded in `20260726113000_seed_document_reference_data.sql`). Sharing the
 * same category `key` namespace as Onboarding's Documents step is what
 * makes a document uploaded during Onboarding and a document imported later
 * through the Import Workspace both count toward the exact same per-category
 * status — one shared vocabulary, not two parallel ones.
 */
export const IMPORT_ASSET_CATEGORIES: UploadCategory[] = [
  ...UPLOAD_CATEGORIES,
  { key: "meeting_minutes", label: "Meeting Minutes", documentTypeName: "Meeting Minutes", sourceType: "meeting" },
];

/**
 * Module 1/10: per-category import status — every count is real and
 * independently true (a category can be simultaneously "2 Imported" and "1
 * Failed"), never collapsed into a single fabricated state. `pendingCount`
 * will typically read 0: every Gateway capability in this codebase runs
 * synchronously today (no background-job/queue system exists, per Sprint
 * 5.2's own documented limitation), so a source rarely lingers in a
 * non-terminal state — this is an honest reflection of that, not a bug.
 */
export type ImportCategoryStatus = {
  key: string;
  label: string;
  documentTypeName: string;
  importedCount: number;
  pendingCount: number;
  needsReviewCount: number;
  failedCount: number;
  isMissing: boolean;
};

/**
 * Module 2: Import Sessions — a pure projection over `Source[]`, grouped by
 * the `importSessionId` tag `import-actions.ts` writes into
 * `Source.metadata` at upload time. No new repository, no new table: a
 * session has no existence of its own beyond "the sources that carry this
 * id," exactly like `TimelineProjection`/`GatewayDashboard` derive their
 * shape entirely from an existing store. "Skipped files" (Module 2) are
 * deliberately NOT part of this type — a file that failed client-side
 * validation before ever reaching `ingestSource()` leaves no persisted
 * trace by definition, so historical sessions honestly cannot report a
 * skipped count; the Import Workspace shows that figure as live, in-memory
 * UI feedback for the CURRENT session only, never fabricated for past ones.
 */
export type ImportSessionSummary = {
  sessionId: string;
  startedAt: string;
  /** `null` while any source in this session is still in a non-terminal processing state. */
  completedAt: string | null;
  importedCount: number;
  needsReviewCount: number;
  failedCount: number;
  totalCount: number;
};
