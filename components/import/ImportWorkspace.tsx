"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { finishImportSession, importAsset, linkImportedAssetToKnowledge } from "@/lib/actions/import-actions";
import { formatDateTime } from "@/lib/format-time";
import { useUploadAction } from "@/components/shared/useUploadAction";
import { UploadStatusLine } from "@/components/shared/UploadStatusLine";
import type { DocumentListItem } from "@/lib/types/document";
import type { ImportCategoryStatus, ImportSessionSummary } from "@/lib/types/import";
import type { KnowledgeObject } from "@/types/knowledge-object";

function CategoryBadge({ label, count, tone }: { label: string; count: number; tone: "success" | "warning" | "error" | "neutral" }) {
  if (count === 0) return null;
  const toneClass = { success: "bg-success/15 text-success", warning: "bg-warning/15 text-warning", error: "bg-error/15 text-error", neutral: "bg-surface-tertiary text-text-tertiary" }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}>{label}: {count}</span>;
}

/** Sprint 5.8, Module 4: reuses the same upload state machine every upload button in Delta now shares — was its own hand-rolled uploading/error state, with no success confirmation at all. */
function CategoryCard({ projectId, category, importSessionId, onUploaded }: { projectId: string; category: ImportCategoryStatus; importSessionId: string; onUploaded: () => void }) {
  const upload = useUploadAction(importAsset);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("categoryKey", category.key);
    formData.set("importSessionId", importSessionId);
    formData.set("file", file);

    upload.run(formData).then((result) => {
      if (result) onUploaded();
    });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-secondary p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[14px] font-semibold text-text-primary">{category.label}</p>
        {category.isMissing && <span className="rounded-full bg-text-tertiary/15 px-2 py-0.5 text-[11px] font-semibold text-text-tertiary">Missing</span>}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <CategoryBadge label="Imported" count={category.importedCount} tone="success" />
        <CategoryBadge label="Pending" count={category.pendingCount} tone="neutral" />
        <CategoryBadge label="Needs Review" count={category.needsReviewCount} tone="warning" />
        <CategoryBadge label="Failed" count={category.failedCount} tone="error" />
      </div>

      <label className="mt-3 block cursor-pointer rounded-lg border border-dashed border-border-subtle px-3 py-2 text-center text-[12px] text-text-tertiary hover:border-border-strong hover:text-text-secondary aria-disabled:pointer-events-none aria-disabled:opacity-60" aria-disabled={upload.isUploading}>
        {upload.isUploading ? "Importing..." : "Choose a file to import"}
        <input type="file" className="hidden" disabled={upload.isUploading} onChange={handleUpload} />
      </label>

      <UploadStatusLine status={upload.status} error={upload.error} successMessage="Imported." />
    </div>
  );
}

function SessionRow({ projectId, session, isCurrent, onFinished }: { projectId: string; session: ImportSessionSummary; isCurrent: boolean; onFinished: () => void }) {
  const [finishing, setFinishing] = useState(false);

  async function handleFinish() {
    setFinishing(true);
    try {
      await finishImportSession(projectId, session.sessionId);
      onFinished();
    } finally {
      setFinishing(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-primary px-4 py-3 text-[13px]">
      <div>
        <p className="text-text-primary">
          Started {formatDateTime(session.startedAt)}
          {session.completedAt && ` · Completed ${formatDateTime(session.completedAt)}`}
        </p>
        <p className="mt-0.5 text-[12px] text-text-tertiary">
          {session.importedCount} imported · {session.needsReviewCount} warning(s) · {session.failedCount} failed
        </p>
      </div>
      {isCurrent && session.totalCount > 0 && (
        <button
          type="button"
          onClick={handleFinish}
          disabled={finishing}
          className="shrink-0 rounded-full border border-border-subtle px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:border-border-strong disabled:opacity-50"
        >
          {finishing ? "Finishing..." : "Finish this session"}
        </button>
      )}
    </li>
  );
}

function KnowledgeLinkRow({ projectId, document, knowledgeObjects, onLinked }: { projectId: string; document: DocumentListItem; knowledgeObjects: KnowledgeObject[]; onLinked: () => void }) {
  const [selectedId, setSelectedId] = useState("");
  const [linking, setLinking] = useState(false);

  async function handleLink() {
    const target = knowledgeObjects.find((object) => object.id === selectedId);
    if (!target) return;

    setLinking(true);
    try {
      await linkImportedAssetToKnowledge({
        projectId,
        documentId: document.id,
        documentName: document.name,
        knowledgeObjectId: target.id,
        knowledgeObjectType: target.type,
        knowledgeObjectTitle: target.title,
      });
      setSelectedId("");
      onLinked();
    } finally {
      setLinking(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px]">
      <div className="min-w-0">
        <p className="truncate text-text-primary">{document.name}</p>
        <p className="text-[11px] text-text-tertiary">
          {document.document_type_name ?? "Unknown"}
          {document.uploaded_at && ` · ${formatDateTime(document.uploaded_at)}`}
          {document.current_status && ` · ${document.current_status}`}
        </p>
      </div>

      {knowledgeObjects.length > 0 && (
        <div className="flex shrink-0 items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-lg border border-border-subtle bg-surface-secondary px-2 py-1.5 text-[12px] text-text-primary outline-none"
          >
            <option value="">Link to knowledge...</option>
            {knowledgeObjects.map((object) => (
              <option key={object.id} value={object.id}>
                {object.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleLink}
            disabled={!selectedId || linking}
            className="rounded-full bg-accent-primary px-3 py-1.5 text-[12px] font-medium text-surface-primary disabled:opacity-50"
          >
            {linking ? "Linking..." : "Link"}
          </button>
        </div>
      )}
    </li>
  );
}

export function ImportWorkspace({
  projectId,
  categories,
  sessions,
  documents,
  knowledgeObjects,
}: {
  projectId: string;
  categories: ImportCategoryStatus[];
  sessions: ImportSessionSummary[];
  documents: DocumentListItem[];
  knowledgeObjects: KnowledgeObject[];
}) {
  const router = useRouter();
  // Module 2: a fresh grouping key generated once per visit to this page —
  // no new storage, carried only in `Source.metadata.importSessionId`
  // (see `import-actions.ts`). Leaving and returning to this page starts a
  // new session, which is exactly the "staged ingestion" boundary the brief
  // asks for.
  const [importSessionId] = useState(() => crypto.randomUUID());

  const refresh = () => router.refresh();

  const currentSession = useMemo(() => sessions.find((session) => session.sessionId === importSessionId), [sessions, importSessionId]);
  const pastSessions = sessions.filter((session) => session.sessionId !== importSessionId);

  const hasAnyDocuments = documents.length > 0;

  return (
    <div className="mt-8 space-y-10">
      <section>
        <h3 className="font-display text-lg font-semibold text-text-primary">Project Documents</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.key}
              projectId={projectId}
              category={category}
              importSessionId={importSessionId}
              onUploaded={refresh}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display text-lg font-semibold text-text-primary">Import Sessions</h3>
        <p className="mt-1 text-[13px] text-text-tertiary">For transparency only — a record of what was imported and when, not a job queue.</p>
        <ul className="mt-3 space-y-2">
          {currentSession && (
            <SessionRow
              projectId={projectId}
              session={currentSession}
              isCurrent
              onFinished={refresh}
            />
          )}
          {pastSessions.map((session) => (
            <SessionRow
              key={session.sessionId}
              projectId={projectId}
              session={session}
              isCurrent={false}
              onFinished={refresh}
            />
          ))}
          {!currentSession && pastSessions.length === 0 && <li className="rounded-lg border border-border-subtle bg-surface-primary px-4 py-3 text-[13px] text-text-tertiary">No import sessions yet — choose a file above to start one.</li>}
        </ul>
      </section>

      <section>
        <h3 className="font-display text-lg font-semibold text-text-primary">Imported Assets</h3>
        {!hasAnyDocuments ? (
          <p className="mt-3 rounded-lg border border-dashed border-border-subtle px-4 py-6 text-center text-[13px] text-text-tertiary">No project documents have been imported yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border-subtle rounded-xl border border-border-subtle">
            {documents.map((document) => (
              <KnowledgeLinkRow
                key={document.id}
                projectId={projectId}
                document={document}
                knowledgeObjects={knowledgeObjects}
                onLinked={refresh}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
