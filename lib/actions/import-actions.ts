"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPerson } from "@/lib/auth/current-person";
import { getProjectDocuments } from "@/lib/actions/document-actions";
import { ingestSource, getSources } from "@/lib/actions/gateway-actions";
import { uploadDocumentFile } from "@/lib/actions/upload-document-action";
import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { computeImportCategoryStatus } from "@/lib/import/import-category-status";
import { projectImportSessions } from "@/lib/import/import-session-projection";
import { IMPORT_ASSET_CATEGORIES } from "@/lib/types/import";
import { createRelationship } from "@/lib/actions/relationship-actions";
import type { KnowledgeObjectType } from "@/types/knowledge-object";

async function requireActorName(): Promise<string> {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in.");
  return `${person.first_name} ${person.last_name}`.trim();
}

/**
 * Module 1/2/10: everything the Import Workspace needs to render — real
 * `documents` rows, real Gateway `Source` records, and the two pure
 * projections computed from them. One aggregator, reused by the page and by
 * `lib/import/import-query.ts` (Delta's import questions), matching the
 * "one aggregator, shared everywhere" precedent `getMissionControlData()`
 * (Sprint 5.5) already established.
 */
export async function getImportWorkspaceData(projectId: string) {
  const [documents, sources] = await Promise.all([getProjectDocuments(projectId), getSources({ projectId })]);

  return {
    categories: computeImportCategoryStatus(documents, sources),
    sessions: projectImportSessions(sources),
    documents,
  };
}

/**
 * Module 3/4/5/7: imports one file as a first-class project asset — the
 * exact same composition Sprint 5.4's onboarding Documents step already
 * uses (`uploadDocumentFile` for real Supabase Storage + Document
 * Registration, then `ingestSource` to route it through the unmodified
 * Project Intelligence Gateway into whichever specialized engine — Drawing
 * Intelligence, Revision Intelligence, or an honest `needs_review` when
 * none claims it yet) — never a second upload pipeline. `importSessionId`
 * is a client-generated grouping key (see `ImportWorkspace.tsx`), carried
 * only in `Source.metadata`, matching how every other capability-specific
 * field on `Source` already works — no new column, no new table.
 */
export async function importAsset(formData: FormData) {
  const projectId = formData.get("projectId")?.toString();
  const categoryKey = formData.get("categoryKey")?.toString();
  const importSessionId = formData.get("importSessionId")?.toString();
  const file = formData.get("file") as File | null;

  const category = IMPORT_ASSET_CATEGORIES.find((candidate) => candidate.key === categoryKey);
  if (!projectId || !category || !file || !importSessionId) {
    throw new Error("Missing project, category, file, or import session.");
  }

  const actorName = await requireActorName();

  const uploadFormData = new FormData();
  uploadFormData.set("projectId", projectId);
  uploadFormData.set("documentName", `${category.label} — ${file.name}`);
  uploadFormData.set("documentType", category.documentTypeName);
  uploadFormData.set("file", file);

  const result = await uploadDocumentFile(uploadFormData);

  const source = await ingestSource({
    projectId,
    sourceId: `import-${result.document.id}`,
    filename: file.name,
    declaredType: category.sourceType,
    metadata: { documentId: result.document.id, category: category.key, categoryLabel: category.label, importSessionId },
    createdBy: actorName,
  });

  await publishSafely({
    eventType: EVENT_TYPES.ASSET_IMPORTED,
    actor: { type: "person", id: actorName },
    sourceNode: { id: result.document.id, type: "document" },
    projectId,
    metadata: { category: category.label, filename: file.name, documentId: result.document.id },
  });

  revalidatePath(`/projects/${projectId}/import`);
  revalidatePath(`/projects/${projectId}/dashboard`);
  return { ...result, source };
}

/**
 * Module 2/7: the explicit, human-triggered "I'm done for now" action. Never
 * required for the projection itself to be accurate — `projectImportSessions()`
 * already derives a session's real completion from whether every one of its
 * sources has reached a terminal state, independent of this event. This
 * action only records the moment a person declared the batch finished, for
 * the Timeline.
 */
/**
 * Module 6: Knowledge Linking. Reuses the unmodified Relationship Graph
 * (`createRelationship`, Sprint 4.0) directly — no new linking mechanism.
 * Always links FROM the real, persisted `document` node (the imported
 * file's own `documents` row) rather than a category-specific node type
 * (e.g. a dedicated `drawing` node): that node only comes to exist once
 * Drawing Intelligence successfully classifies a file, which today only
 * happens for its own seeded mock uploads (a pre-existing, documented
 * limitation carried from Sprint 5.1) — linking from `document` is honest
 * for every category, including Drawings and Photos, since the `documents`
 * row is the one thing genuinely guaranteed to exist.
 */
export async function linkImportedAssetToKnowledge(params: { projectId: string; documentId: string; documentName: string; knowledgeObjectId: string; knowledgeObjectType: KnowledgeObjectType; knowledgeObjectTitle: string }) {
  const actorName = await requireActorName();

  await createRelationship({
    projectId: params.projectId,
    nodeA: { id: params.documentId, type: "document", label: params.documentName },
    relationshipType: "related",
    nodeB: { id: params.knowledgeObjectId, type: params.knowledgeObjectType, label: params.knowledgeObjectTitle },
    createdBy: actorName,
  });

  revalidatePath(`/projects/${params.projectId}/import`);
}

export async function finishImportSession(projectId: string, sessionId: string) {
  const actorName = await requireActorName();
  const { sessions } = await getImportWorkspaceData(projectId);
  const session = sessions.find((candidate) => candidate.sessionId === sessionId);

  await publishSafely({
    eventType: EVENT_TYPES.IMPORT_SESSION_COMPLETED,
    actor: { type: "person", id: actorName },
    projectId,
    metadata: { sessionId, importedCount: session?.importedCount ?? 0, failedCount: session?.failedCount ?? 0, needsReviewCount: session?.needsReviewCount ?? 0 },
  });

  revalidatePath(`/projects/${projectId}/import`);
}
