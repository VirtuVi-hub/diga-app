import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { recommendationRepository, type RecommendationFilter } from "@/lib/repositories/recommendation-repository";
import type { Recommendation } from "@/types/recommendation";

export class RecommendationService {
  static async list(filter?: RecommendationFilter): Promise<Recommendation[]> {
    return recommendationRepository.list(filter);
  }

  static async get(id: string): Promise<Recommendation | null> {
    return recommendationRepository.get(id);
  }

  /**
   * Acknowledges a recommendation only — per the brief, "Accept does NOT
   * execute work." One real write (`status`) plus one matching Event, same
   * shape as every other lifecycle transition in this codebase
   * (`KnowledgeObjectService.approve()`, etc.).
   */
  static async accept(id: string, actorId: string): Promise<Recommendation> {
    const recommendation = await recommendationRepository.updateStatus(id, "accepted");

    await publishSafely({
      eventType: EVENT_TYPES.RECOMMENDATION_ACCEPTED,
      actor: { type: "person", id: actorId },
      sourceNode: recommendation.relatedNodes[0],
      projectId: recommendation.projectId,
      metadata: { title: recommendation.title, recommendationType: recommendation.recommendationType },
    });

    return recommendation;
  }

  static async dismiss(id: string, actorId: string): Promise<Recommendation> {
    const recommendation = await recommendationRepository.updateStatus(id, "dismissed");

    await publishSafely({
      eventType: EVENT_TYPES.RECOMMENDATION_DISMISSED,
      actor: { type: "person", id: actorId },
      sourceNode: recommendation.relatedNodes[0],
      projectId: recommendation.projectId,
      metadata: { title: recommendation.title, recommendationType: recommendation.recommendationType },
    });

    return recommendation;
  }
}
