import { getDiscussionsByAttachedTo } from "@/lib/actions/discussion-actions";
import type { DocumentChangeSummary, DocumentRevisionMetadataDiff } from "./types";

export type DocumentChangeAnalyzerContext = {
  documentId: string;
  projectId: string;
  documentTypeName: string;
  previousUploadedAt: string;
};

export type DocumentChangeAnalyzer = (diff: DocumentRevisionMetadataDiff, ctx: DocumentChangeAnalyzerContext) => Promise<DocumentChangeSummary>;

/**
 * Module 3's "generic comparison engine + document-type-specific
 * analyzers." Only the Agreement analyzer is real this sprint — it pulls
 * clause Discussions opened against this document since the previous
 * revision (Module 2's manual `clauseRef` mechanism), which is the actual
 * "what changed" narrative for Agreements per the locked scope decision.
 * BOQ/Specification/Report/Meeting Minutes fall through to `stubAnalyzer`,
 * honestly stating that content-level comparison isn't built yet — the
 * same "Coming Soon" honesty this codebase already uses for
 * References/Decisions, not a fabricated result.
 */
const agreementAnalyzer: DocumentChangeAnalyzer = async (diff, ctx) => {
  const discussions = await getDiscussionsByAttachedTo({ id: ctx.documentId, type: "document" }, ctx.projectId);
  const clauseDiscussionsSinceLastVersion = discussions.filter(
    (discussion) => discussion.clauseRef && new Date(discussion.createdAt) > new Date(ctx.previousUploadedAt),
  );

  return {
    ...diff,
    documentId: ctx.documentId,
    projectId: ctx.projectId,
    documentTypeName: ctx.documentTypeName,
    clauseDiscussionsSinceLastVersion,
    analyzerNote:
      clauseDiscussionsSinceLastVersion.length > 0
        ? "Clause changes are inferred from Discussions opened against this Agreement since the previous version, not automated text comparison."
        : "No clause Discussions were opened against this Agreement since the previous version. Content-level text comparison is not available yet — open a clause Discussion to record what changed.",
  };
};

const stubAnalyzer: DocumentChangeAnalyzer = async (diff, ctx) => ({
  ...diff,
  documentId: ctx.documentId,
  projectId: ctx.projectId,
  documentTypeName: ctx.documentTypeName,
  clauseDiscussionsSinceLastVersion: [],
  analyzerNote: `Content-level comparison is not yet available for ${ctx.documentTypeName} documents — only version metadata (upload date, uploader, whether the file changed) is shown.`,
});

export const DOCUMENT_CHANGE_ANALYZERS: Record<string, DocumentChangeAnalyzer> = {
  Agreement: agreementAnalyzer,
};

export function getDocumentChangeAnalyzer(documentTypeName: string): DocumentChangeAnalyzer {
  return DOCUMENT_CHANGE_ANALYZERS[documentTypeName] ?? stubAnalyzer;
}
