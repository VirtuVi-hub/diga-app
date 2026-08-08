"use server";

import { revalidatePath } from "next/cache";
import { DocumentService } from "@/lib/services/document-service";

export async function getProjectDocuments(projectId: string) {
  return DocumentService.listDocuments(projectId);
}

export async function getDocument(documentId: string) {
  return DocumentService.getDocument(documentId);
}

export async function getDocumentTypes() {
  return DocumentService.listDocumentTypes();
}

export async function getDocumentRevisions(documentId: string) {
  return DocumentService.listDocumentRevisions(documentId);
}

export async function refreshDocuments(projectId: string) {
  revalidatePath(`/projects/${projectId}/data`);
}
