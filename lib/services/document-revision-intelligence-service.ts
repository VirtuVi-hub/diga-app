import { DocumentRepository } from "@/lib/repositories/document-repository";
import { PeopleRepository } from "@/lib/repositories/people-repository";
import { compareRevisionMetadata } from "@/lib/document-revision-intelligence/document-revision-comparator";
import { getDocumentChangeAnalyzer } from "@/lib/document-revision-intelligence/document-change-analyzers";
import type { DocumentChangeSummary } from "@/lib/document-revision-intelligence/types";

/**
 * Sprint 5.7, Module 3: Universal Document Revision Intelligence. Named to
 * mirror `RevisionEngine.process()` (the drawing-specific pipeline in
 * `lib/revision-intelligence/`, left entirely unmodified this sprint) but
 * is a genuinely separate module operating on real `document_revisions`
 * rows rather than the mock drawing dictionary — the two share a naming
 * convention, not a forced common interface, since their inputs are
 * structurally different.
 */
export class DocumentRevisionEngine {
  static async compare(documentId: string): Promise<DocumentChangeSummary | null> {
    const document = await DocumentRepository.get(documentId);
    if (!document) return null;

    const revisions = await DocumentRepository.listRevisions(documentId);
    if (revisions.length < 2) return null;

    const [current, previous] = revisions;
    const names = await PeopleRepository.getNamesByIds([current.created_by, previous.created_by]);

    const diff = compareRevisionMetadata(previous, current, {
      previous: previous.created_by ? (names[previous.created_by] ?? null) : null,
      current: current.created_by ? (names[current.created_by] ?? null) : null,
    });

    const analyzer = getDocumentChangeAnalyzer(document.document_type_name ?? "Other");

    return analyzer(diff, {
      documentId,
      projectId: document.project_id,
      documentTypeName: document.document_type_name ?? "Document",
      previousUploadedAt: previous.uploaded_at,
    });
  }
}
