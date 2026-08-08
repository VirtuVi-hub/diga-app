import type {
  CreateDocumentParams,
  CreateDocumentRevisionParams,
  DocumentListItem,
  DocumentRevision,
  DocumentStatus,
  DocumentType,
} from "@/lib/types/document";
import { createServerSupabaseClient } from "@/supabase/server";

type DocumentRow = {
  id: string;
  project_id: string;
  deliverable_id: string | null;
  document_type_id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  document_types: Pick<DocumentType, "name"> | null;
  document_revisions: Array<
    DocumentRevision & {
      document_statuses: Pick<DocumentStatus, "name"> | null;
    }
  >;
};

const documentSelect = `
  id,
  project_id,
  deliverable_id,
  document_type_id,
  name,
  description,
  active,
  created_at,
  updated_at,
  created_by,
  updated_by,
  document_types (name),
  document_revisions!inner (
    id,
    document_id,
    revision,
    title,
    description,
    document_status_id,
    issue_date,
    storage_path,
    original_filename,
    file_extension,
    mime_type,
    file_size,
    checksum,
    is_current,
    uploaded_at,
    created_at,
    updated_at,
    created_by,
    updated_by,
    document_statuses (name)
  )
`;

function toDocumentListItem(document: DocumentRow): DocumentListItem {
  const revision = document.document_revisions[0] ?? null;

  return {
    id: document.id,
    project_id: document.project_id,
    deliverable_id: document.deliverable_id,
    document_type_id: document.document_type_id,
    name: document.name,
    description: document.description,
    active: document.active,
    created_at: document.created_at,
    updated_at: document.updated_at,
    created_by: document.created_by,
    updated_by: document.updated_by,
    document_type_name: document.document_types?.name ?? null,
    current_revision: revision?.revision ?? null,
    current_status: revision?.document_statuses?.name ?? null,
    original_filename: revision?.original_filename ?? null,
    uploaded_at: revision?.uploaded_at ?? null,
  };
}

export class DocumentRepository {
  static async list(projectId: string): Promise<DocumentListItem[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("documents")
      .select(documentSelect)
      .eq("project_id", projectId)
      .eq("active", true)
      .eq("document_revisions.is_current", true)
      .order("name");

    if (error) {
      throw new Error(`Unable to list documents: ${error.message}`);
    }

    const documents = (data ?? []) as unknown as DocumentRow[];

    return documents.map(toDocumentListItem);
  }

  static async get(documentId: string): Promise<DocumentListItem | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("documents")
      .select(documentSelect)
      .eq("id", documentId)
      .eq("active", true)
      .eq("document_revisions.is_current", true)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to get document: ${error.message}`);
    }

    return data ? toDocumentListItem(data as unknown as DocumentRow) : null;
  }

  static async create(params: CreateDocumentParams): Promise<DocumentListItem> {
    const supabase = await createServerSupabaseClient();
    const { data: documentId, error } = await supabase.rpc(
      "create_document_with_initial_revision",
      {
        p_project_id: params.projectId,
        p_document_name: params.documentName,
        p_document_type_name: params.documentType,
        p_storage_path: params.storagePath,
        p_original_filename: params.originalFilename,
        p_file_extension: params.fileExtension,
        p_mime_type: params.mimeType,
        p_file_size: params.fileSize,
        p_created_by: params.createdBy,
      },
    );

    if (error || !documentId) {
      throw new Error(`Unable to create document: ${error?.message ?? "No document ID returned."}`);
    }

    const document = await this.get(documentId as unknown as string);

    if (!document) {
      throw new Error("Document was created but could not be retrieved.");
    }

    return document;
  }

  static async listRevisions(documentId: string): Promise<DocumentRevision[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("document_revisions")
      .select(`
        id, document_id, revision, title, description, document_status_id,
        issue_date, storage_path, original_filename, file_extension, mime_type,
        file_size, checksum, is_current, uploaded_at, created_at, updated_at,
        created_by, updated_by,
        document_statuses (name)
      `)
      .eq("document_id", documentId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      throw new Error(`Unable to list document revisions: ${error.message}`);
    }

    return ((data ?? []) as unknown as Array<
      DocumentRevision & {
        document_statuses:
          | Pick<DocumentStatus, "name">
          | Array<Pick<DocumentStatus, "name">>
          | null;
      }
    >).map(({ document_statuses, ...revision }) => {
      const status = Array.isArray(document_statuses)
        ? document_statuses[0]
        : document_statuses;

      return {
        ...revision,
        document_status_name: status?.name ?? null,
      };
    });
  }

  static async listTypes(): Promise<DocumentType[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("document_types")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .order("name");

    if (error) {
      throw new Error(`Unable to list document types: ${error.message}`);
    }

    return (data ?? []) as unknown as DocumentType[];
  }

  static async getCurrentRevision(documentId: string): Promise<DocumentRevision | null> {
    const revisions = await this.listRevisions(documentId);

    return revisions.find((revision) => revision.is_current) ?? null;
  }

  static async createRevision(
    params: CreateDocumentRevisionParams,
  ): Promise<DocumentRevision> {
    const supabase = await createServerSupabaseClient();
    const { data: revisionId, error } = await supabase.rpc(
      "create_document_revision",
      {
        p_project_id: params.projectId,
        p_document_id: params.documentId,
        p_storage_path: params.storagePath,
        p_original_filename: params.originalFilename,
        p_file_extension: params.fileExtension,
        p_mime_type: params.mimeType,
        p_file_size: params.fileSize,
        p_created_by: params.createdBy,
      },
    );

    if (error || !revisionId) {
      throw new Error(`Unable to create document revision: ${error?.message ?? "No revision ID returned."}`);
    }

    const revisions = await this.listRevisions(params.documentId);
    const revision = revisions.find((item) => item.id === revisionId);

    if (!revision) {
      throw new Error("Document revision was created but could not be retrieved.");
    }

    return revision;
  }

  static async createCurrentRevisionViewUrl(documentId: string): Promise<string> {
    const revision = await this.getCurrentRevision(documentId);

    if (!revision) {
      throw new Error("Current document revision not found.");
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(revision.storage_path, 60);

    if (error || !data?.signedUrl) {
      throw new Error(`Unable to open document: ${error?.message ?? "No view URL returned."}`);
    }

    return data.signedUrl;
  }
}
