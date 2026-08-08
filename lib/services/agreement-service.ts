import { DocumentRepository } from "@/lib/repositories/document-repository";
import type { DocumentListItem } from "@/lib/types/document";

export class AgreementService {
  static async getCurrentAgreement(
    projectId: string
  ): Promise<DocumentListItem | null> {
    const documents = await DocumentRepository.list(projectId);

    return (
      documents.find(
        (document) => document.document_type_name === "Agreement",
      ) ?? null
    );
  }
}
