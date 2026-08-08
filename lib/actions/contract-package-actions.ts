"use server";

import { canViewContractPackage } from "@/lib/permissions/contract-package-ui";
import { DocumentService } from "@/lib/services/document-service";
import { createServerSupabaseClient } from "@/supabase/server";
import { uploadDocumentFile } from "./upload-document-action";

async function assertContractPackageAccess() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !canViewContractPackage(user)) {
    throw new Error("You do not have access to the Contract Package.");
  }
}

export async function uploadContractPackageDocument(formData: FormData) {
  await assertContractPackageAccess();

  const projectId = formData.get("projectId")?.toString();
  const documentId = formData.get("documentId")?.toString();
  const documentType = formData.get("documentType")?.toString();

  if (!projectId || !documentType) {
    throw new Error("A project and document type are required.");
  }

  const documentTypes = await DocumentService.listDocumentTypes();
  if (!documentTypes.some((type) => type.name === documentType)) {
    throw new Error("Choose an active document type.");
  }

  if (documentId) {
    const document = await DocumentService.getDocument(documentId);
    if (
      !document ||
      document.project_id !== projectId ||
      document.document_type_name !== documentType
    ) {
      throw new Error("Choose a document from the selected type.");
    }
  }

  return uploadDocumentFile(formData);
}

export async function getContractDocumentViewUrl(documentId: string) {
  await assertContractPackageAccess();

  const document = await DocumentService.getDocument(documentId);
  if (!document) {
    throw new Error("Contract document not found.");
  }

  return DocumentService.getCurrentDocumentViewUrl(documentId);
}
