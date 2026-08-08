import { getImportWorkspaceData } from "@/lib/actions/import-actions";
import type { DeltaRelatedResult } from "@/lib/intelligence-engine/delta-query-resolver";
import type { Evidence } from "@/types/evidence";

/**
 * Module 9: Delta Integration. Structurally mirrors every prior sprint's
 * own Delta query file — a small, anchored keyword match, checked before
 * Comprehension runs, answered from `getImportWorkspaceData()` (the exact
 * same aggregator the Import Workspace page renders) — never a new AI
 * pipeline, never a second query engine. "Which drawings are available?"
 * is deliberately NOT answered here — it's a drawing question best answered
 * by Drawing Intelligence's own real `Drawing` records, so it was added as
 * one more trigger phrase on the existing `drawing-query.ts` (Sprint 5.1)
 * instead of duplicated against raw Gateway `Source`/`documents` data here.
 */
export type ImportQueryKind = "imported_documents" | "missing_documents" | "agreement_status" | "reports_available";

export function detectImportQuestion(text: string): ImportQueryKind | null {
  const normalized = text.toLowerCase().trim();

  if (/\bhas the agreement been uploaded\b/.test(normalized)) return "agreement_status";
  if (/\bwhat reports exist\b/.test(normalized)) return "reports_available";
  if (/\bwhat documents (are )?(still )?missing\b/.test(normalized)) return "missing_documents";
  if (/\bwhat documents (have been |were )?imported\b/.test(normalized)) return "imported_documents";

  return null;
}

function toEvidence(id: string, title: string, type: string, excerpt: string): Evidence {
  return { id, title, type, relationship: "related", relevance: 1, confidence: 1, excerpt };
}

export async function answerImportQuestion(projectId: string, kind: ImportQueryKind): Promise<DeltaRelatedResult> {
  const { categories, documents } = await getImportWorkspaceData(projectId);

  if (kind === "agreement_status") {
    const agreementCategory = categories.find((category) => category.documentTypeName === "Agreement");
    const uploaded = (agreementCategory?.importedCount ?? 0) > 0;
    return {
      kind: "related",
      heading: "Agreement Status",
      evidence: uploaded ? documents.filter((document) => document.document_type_name === "Agreement").map((document) => toEvidence(document.id, document.name, "Document", "Agreement")) : [],
      reasoning: {
        found: uploaded ? ["✓ Agreement has been uploaded."] : [],
        missing: uploaded ? [] : ["✗ No Agreement document has been uploaded yet."],
        conclusion: uploaded ? "Yes — the Agreement has been uploaded." : "No — the Agreement has not been uploaded yet.",
      },
      confidence: "high",
    };
  }

  if (kind === "reports_available") {
    const reports = documents.filter((document) => document.document_type_name === "Report");
    const evidence = reports.map((document) => toEvidence(document.id, document.name, "Document", document.current_status ?? "Active"));
    return {
      kind: "related",
      heading: "Reports",
      evidence,
      reasoning: {
        found: evidence.map((item) => `✓ ${item.title}`),
        missing: [],
        conclusion: reports.length ? `${reports.length} report(s) found.` : "No reports have been uploaded yet.",
      },
      confidence: reports.length ? "high" : "none",
    };
  }

  if (kind === "missing_documents") {
    const missing = categories.filter((category) => category.isMissing);
    const evidence = missing.map((category) => toEvidence(category.key, category.label, "Missing Category", `No ${category.documentTypeName} document has been imported yet.`));
    return {
      kind: "related",
      heading: "Documents Still Missing",
      evidence,
      reasoning: {
        found: [],
        missing: evidence.map((item) => `✗ ${item.title}`),
        conclusion: missing.length ? `${missing.length} categor${missing.length === 1 ? "y" : "ies"} still missing.` : "Nothing is missing — every category has at least one document.",
      },
      confidence: missing.length ? "medium" : "high",
    };
  }

  // "imported_documents"
  const evidence = documents.map((document) => toEvidence(document.id, document.name, document.document_type_name ?? "Document", document.current_status ?? "Active"));
  return {
    kind: "related",
    heading: "Imported Documents",
    evidence,
    reasoning: {
      found: evidence.map((item) => `✓ ${item.title}`),
      missing: [],
      conclusion: documents.length ? `${documents.length} document(s) imported.` : "No documents have been imported yet.",
    },
    confidence: documents.length ? "high" : "none",
  };
}
