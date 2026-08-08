import { DocumentRepository } from "@/lib/repositories/document-repository";
import type {
  CreateDocumentParams,
  CreateDocumentRevisionParams,
} from "@/lib/types/document";

export class DocumentService {
  static async listDocuments(projectId: string) {
    return DocumentRepository.list(projectId);
  }

  static async getDocument(documentId: string) {
    return DocumentRepository.get(documentId);
  }

  static async createDocument(params: CreateDocumentParams) {
    return DocumentRepository.create(params);
  }

  static async listDocumentRevisions(documentId: string) {
    return DocumentRepository.listRevisions(documentId);
  }

  static async getCurrentDocumentRevision(documentId: string) {
    return DocumentRepository.getCurrentRevision(documentId);
  }

  static async createDocumentRevision(params: CreateDocumentRevisionParams) {
    return DocumentRepository.createRevision(params);
  }

  static async listDocumentTypes() {
    return DocumentRepository.listTypes();
  }

  static async getCurrentDocumentViewUrl(documentId: string) {
    return DocumentRepository.createCurrentRevisionViewUrl(documentId);
  }
}
