import { projectIntelligenceGateway } from "@/lib/project-intelligence-gateway/project-intelligence-gateway";
import { sourceRepository, type SourceFilter } from "@/lib/repositories/source-repository";
import type { Source, SourceSubmissionInput } from "@/types/project-intelligence-gateway";

/**
 * Thin Service layer over the Gateway, matching the "Action → Service →
 * Repository" layering every other domain in this codebase uses. Reads go
 * straight to `sourceRepository` (no logic to add); the one write path,
 * `ingest()`, delegates entirely to `ProjectIntelligenceGateway.ingest()` —
 * the same "Service defers to the Engine for the one thing the Engine
 * legitimately owns" precedent `RecommendationService` already set for
 * `RecommendationEngine.evaluate()`.
 */
export class SourceService {
  static async list(filter?: SourceFilter): Promise<Source[]> {
    return sourceRepository.list(filter);
  }

  static async get(id: string): Promise<Source | null> {
    return sourceRepository.get(id);
  }

  static async ingest(input: SourceSubmissionInput): Promise<Source> {
    return projectIntelligenceGateway.ingest(input);
  }
}
