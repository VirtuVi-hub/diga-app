import { RequirementRepository } from "@/lib/repositories/requirement-repository";

export class RequirementService {
  static async list(projectId: string) {
    return RequirementRepository.list(projectId);
  }

  static async get(id: string) {
    return RequirementRepository.get(id);
  }
}