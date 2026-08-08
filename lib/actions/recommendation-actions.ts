"use server";

import { RecommendationService } from "@/lib/services/recommendation-service";
import type { RecommendationFilter } from "@/lib/repositories/recommendation-repository";

export async function getRecommendations(filter?: RecommendationFilter) {
  return RecommendationService.list(filter);
}

export async function acceptRecommendation(id: string, actorId: string) {
  return RecommendationService.accept(id, actorId);
}

export async function dismissRecommendation(id: string, actorId: string) {
  return RecommendationService.dismiss(id, actorId);
}
