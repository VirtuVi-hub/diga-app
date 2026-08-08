"use server";

import { DocumentRevisionEngine } from "@/lib/services/document-revision-intelligence-service";

/** Sprint 5.7, Module 3: Version N vs N+1 metadata comparison for any document type. Returns null honestly when fewer than 2 revisions exist yet — never fabricated. */
export async function getDocumentRevisionComparison(documentId: string) {
  return DocumentRevisionEngine.compare(documentId);
}
