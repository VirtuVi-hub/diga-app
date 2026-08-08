import Link from "next/link";
import type { ImportCategoryStatus } from "@/lib/types/import";
import type { RecentDrawingItem } from "@/lib/actions/dashboard-actions";

/** Sprint 5.6 (Module 8): reuses `computeImportCategoryStatus()` — the exact same projection the Import Workspace itself renders. No duplicate dashboard logic. */
export function ImportProgressPanel({ projectId, categories, recentDrawings }: { projectId: string; categories: ImportCategoryStatus[]; recentDrawings: RecentDrawingItem[] }) {
  const missing = categories.filter((category) => category.isMissing);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-text-primary">Import Progress</h3>
        <Link
          href={`/projects/${projectId}/import`}
          className="text-[13px] text-accent-primary hover:underline"
        >
          Open Import Workspace →
        </Link>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border-subtle bg-surface-secondary p-4">
          <p className="text-[13px] font-semibold text-text-primary">Recently Imported</p>
          <ul className="mt-2 space-y-1">
            {categories
              .filter((category) => category.importedCount > 0)
              .slice(0, 6)
              .map((category) => (
                <li
                  key={category.key}
                  className="text-[12px] text-text-secondary"
                >
                  {category.label}: {category.importedCount} imported
                </li>
              ))}
            {categories.every((category) => category.importedCount === 0) && <li className="text-[12px] text-text-tertiary">Nothing imported yet.</li>}
          </ul>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-secondary p-4">
          <p className="text-[13px] font-semibold text-text-primary">Missing Categories</p>
          {missing.length === 0 ? (
            <p className="mt-2 text-[12px] text-text-tertiary">Every category has at least one document.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {missing.map((category) => (
                <li
                  key={category.key}
                  className="text-[12px] text-text-secondary"
                >
                  {category.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {recentDrawings.length > 0 && (
        <div className="mt-3 rounded-xl border border-border-subtle bg-surface-secondary p-4">
          <p className="text-[13px] font-semibold text-text-primary">Recent Drawings</p>
          <ul className="mt-2 space-y-1">
            {recentDrawings.map((drawing) => (
              <li
                key={drawing.id}
                className="text-[12px] text-text-secondary"
              >
                {drawing.sheetNumber} — {drawing.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
