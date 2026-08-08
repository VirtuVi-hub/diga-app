import Link from "next/link";
import { formatDateTime } from "@/lib/format-time";
import { knowledgeObjectStatusBadgeClass, knowledgeObjectStatusLabels } from "@/lib/knowledge-object-types";
import type { KnowledgeObject } from "@/types/knowledge-object";

export function KnowledgeObjectCard({
  object,
  projectId,
}: {
  object: KnowledgeObject;
  projectId: string;
}) {
  return (
    <Link
      href={`/projects/${projectId}/knowledge/${object.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-primary px-4 py-3 transition hover:border-border-strong"
    >
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-text-primary">{object.title}</p>
        <p className="mt-0.5 text-[12px] text-text-tertiary">{formatDateTime(object.createdAt)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[11px] font-medium text-text-tertiary">Rev {object.revisions.length}</span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${knowledgeObjectStatusBadgeClass[object.status]}`}
        >
          {knowledgeObjectStatusLabels[object.status]}
        </span>
      </div>
    </Link>
  );
}
