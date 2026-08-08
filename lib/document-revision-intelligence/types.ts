import type { Discussion } from "@/types/discussion";

/**
 * Universal Document Revision Intelligence types (Sprint 5.7, Module 3).
 * Scope decision locked with the user before implementation: metadata-level
 * diffing only this sprint (no PDF/DOCX text extraction exists in this
 * codebase) — "what changed" narrative comes from clause Discussions
 * (Module 2), not automated content comparison. See
 * `lib/document-revision-intelligence/document-revision-comparator.ts` and
 * `document-change-analyzers.ts`.
 */

export type DocumentRevisionSnapshot = {
  id: string;
  label: string;
  uploadedAt: string;
  uploadedBy: string | null;
  checksum: string | null;
  fileSize: number | null;
};

export type DocumentRevisionMetadataDiff = {
  changed: boolean;
  previous: DocumentRevisionSnapshot;
  current: DocumentRevisionSnapshot;
};

export type DocumentChangeSummary = DocumentRevisionMetadataDiff & {
  documentId: string;
  projectId: string;
  documentTypeName: string;
  /** Agreement analyzer only — Discussions with a clauseRef opened against this document since the previous revision. Empty for every other document type this sprint. */
  clauseDiscussionsSinceLastVersion: Discussion[];
  /** Honest, per-document-type note about what this comparison can and cannot show yet. */
  analyzerNote: string;
};
