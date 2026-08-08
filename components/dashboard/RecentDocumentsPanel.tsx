import Link from "next/link";
import { formatDateTime } from "@/lib/format-time";
import type { RecentDocumentItem } from "@/lib/types/dashboard";

/** Module 10: Recent Documents — the same `documents` rows Data (`/projects/[id]/data`) already reads, just the newest few, sorted by upload time. */
export function RecentDocumentsPanel({ documents, projectId }: { documents: RecentDocumentItem[]; projectId: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-text-primary">Recent Documents</h3>
        <Link
          href={`/projects/${projectId}/data`}
          className="text-[13px] text-accent-primary hover:underline"
        >
          View all →
        </Link>
      </div>

      {documents.length === 0 ? (
        <p className="mt-3 text-[13px] text-text-tertiary">No documents uploaded yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border-subtle rounded-xl border border-border-subtle">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex items-center justify-between gap-4 px-4 py-2.5 text-[13px]"
            >
              <span className="truncate text-text-primary">{document.name}</span>
              <span className="flex shrink-0 items-center gap-2 text-[11px] text-text-tertiary">
                {document.documentTypeName ?? "Unknown"}
                {document.uploadedAt && <span>· {formatDateTime(document.uploadedAt)}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
