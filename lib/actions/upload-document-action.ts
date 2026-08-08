"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { DocumentService } from "@/lib/services/document-service";
import { createServerSupabaseClient } from "@/supabase/server";
import { createServiceSupabaseClient } from "@/supabase/service";

export async function uploadDocumentFile(formData: FormData) {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to upload documents.");
  }

  const projectId = formData.get("projectId")?.toString();
  const documentName = formData.get("documentName")?.toString().trim();
  const documentType = formData.get("documentType")?.toString();
  const documentId = formData.get("documentId")?.toString();

  const file = formData.get("file") as File | null;

  if (!projectId) {
    throw new Error("Missing project.");
  }

  if (!documentId && !documentName) {
    throw new Error("Document name is required.");
  }

  if (!documentId && !documentType) {
    throw new Error("Document type is required.");
  }

  if (!file) {
    throw new Error("No file selected.");
  }

  const storageClient = createServiceSupabaseClient();

  const filenameExtension = file.name.includes(".")
    ? file.name.split(".").pop() ?? ""
    : "";

  const storagePath = `${randomUUID()}${filenameExtension ? `.${filenameExtension}` : ""}`;

  const { data, error } = await storageClient.storage
    .from("documents")
    .upload(storagePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  let document;

  try {
    document = documentId
      ? await DocumentService.createDocumentRevision({
          projectId,
          documentId,
          storagePath: data.path,
          originalFilename: file.name,
          fileExtension: filenameExtension || null,
          mimeType: file.type,
          fileSize: file.size,
          createdBy: user.id,
        })
      : await DocumentService.createDocument({
          projectId,
          documentName: documentName!,
          documentType: documentType!,
          storagePath: data.path,
          originalFilename: file.name,
          fileExtension: filenameExtension || null,
          mimeType: file.type,
          fileSize: file.size,
          createdBy: user.id,
        });
  } catch (metadataError) {
    const { error: removeError } = await storageClient.storage
      .from("documents")
      .remove([data.path]);

    if (removeError) {
      console.error("Failed to remove orphaned document upload:", removeError);
    }

    throw metadataError;
  }

  revalidatePath(`/projects/${projectId}/data`);
  revalidatePath(`/projects/${projectId}/contract-package`);

  return {
    success: true,
    document,
  };
}
