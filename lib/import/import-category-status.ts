import { IMPORT_ASSET_CATEGORIES } from "@/lib/types/import";
import type { ImportCategoryStatus } from "@/lib/types/import";
import type { DocumentListItem } from "@/lib/types/document";
import type { Source } from "@/types/project-intelligence-gateway";

/**
 * Module 1/10: per-category import status. A pure projection over two
 * already-fetched lists — real `documents` rows (the authoritative "does
 * this file exist" signal) and Gateway `Source` records tagged with this
 * category (the "what happened when the Gateway looked at it" signal).
 * `importedCount` deliberately comes from `documents`, not `sources`: a
 * category's files are real project assets whether or not any downstream
 * Intelligence capability could process them — Gateway outcomes are a
 * separate, honest signal layered on top, never the definition of
 * "imported."
 */
export function computeImportCategoryStatus(documents: DocumentListItem[], sources: Source[]): ImportCategoryStatus[] {
  return IMPORT_ASSET_CATEGORIES.map((category): ImportCategoryStatus => {
    const importedCount = documents.filter((document) => document.document_type_name === category.documentTypeName).length;
    const categorySources = sources.filter((source) => source.metadata.category === category.key);

    return {
      key: category.key,
      label: category.label,
      documentTypeName: category.documentTypeName,
      importedCount,
      pendingCount: categorySources.filter((source) => ["received", "classified", "queued", "processing"].includes(source.processingState)).length,
      needsReviewCount: categorySources.filter((source) => source.processingState === "needs_review").length,
      failedCount: categorySources.filter((source) => source.processingState === "failed").length,
      isMissing: importedCount === 0,
    };
  });
}
