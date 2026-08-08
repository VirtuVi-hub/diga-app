import type { DocumentRevision } from "@/lib/types/document";
import type { DocumentRevisionMetadataDiff, DocumentRevisionSnapshot } from "./types";

function toSnapshot(revision: DocumentRevision, uploadedByName: string | null): DocumentRevisionSnapshot {
  return {
    id: revision.id,
    label: revision.revision,
    uploadedAt: revision.uploaded_at,
    uploadedBy: uploadedByName,
    checksum: revision.checksum,
    fileSize: revision.file_size,
  };
}

/**
 * Sprint 5.7, Module 3: pure, no-I/O metadata comparison between two
 * `document_revisions` rows. Locked scope decision: this compares
 * checksum/size/label/uploader/timestamp only — there is no PDF/DOCX
 * text-extraction pipeline in this codebase to diff real content against.
 * `changed` is true whenever the checksum differs (or is unavailable and
 * the file size differs) — the only honest signal available without
 * reading file content.
 */
export function compareRevisionMetadata(
  previous: DocumentRevision,
  current: DocumentRevision,
  uploadedByNames: { previous: string | null; current: string | null },
): DocumentRevisionMetadataDiff {
  const changed = previous.checksum && current.checksum ? previous.checksum !== current.checksum : previous.file_size !== current.file_size;

  return {
    changed,
    previous: toSnapshot(previous, uploadedByNames.previous),
    current: toSnapshot(current, uploadedByNames.current),
  };
}
