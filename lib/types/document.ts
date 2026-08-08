export interface Document {
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
}

export interface DocumentRevision {
  id: string;
  document_id: string;
  revision: string;
  title: string | null;
  description: string | null;
  document_status_id: string | null;
  issue_date: string | null;
  storage_path: string;
  original_filename: string;
  file_extension: string | null;
  mime_type: string | null;
  file_size: number | null;
  checksum: string | null;
  is_current: boolean;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  document_status_name?: string | null;
}

export interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  file_extension: string | null;
  mime_type: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface DocumentStatus {
  id: string;
  name: string;
  code: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface DocumentListItem extends Document {
  document_type_name: string | null;
  current_revision: string | null;
  current_status: string | null;
  original_filename: string | null;
  uploaded_at: string | null;
}

export interface CreateDocumentParams {
  projectId: string;
  documentName: string;
  documentType: string;
  storagePath: string;
  originalFilename: string;
  fileExtension: string | null;
  mimeType: string;
  fileSize: number;
  createdBy: string;
}

export interface CreateDocumentRevisionParams {
  projectId: string;
  documentId: string;
  storagePath: string;
  originalFilename: string;
  fileExtension: string | null;
  mimeType: string;
  fileSize: number;
  createdBy: string;
}
