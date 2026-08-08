import type { CreateRecommendationInput, Recommendation, RecommendationStatus } from "@/types/recommendation";

export type RecommendationFilter = {
  projectId?: string;
  status?: RecommendationStatus;
};

export interface RecommendationRepository {
  create(input: CreateRecommendationInput): Promise<Recommendation>;
  list(filter?: RecommendationFilter): Promise<Recommendation[]>;
  get(id: string): Promise<Recommendation | null>;
  updateStatus(id: string, status: RecommendationStatus): Promise<Recommendation>;
}

let store: Recommendation[] = [];
let sequence = 0;

function nextId(): string {
  sequence += 1;
  return `recommendation-${Date.now()}-${sequence}`;
}

function matchesFilter(recommendation: Recommendation, filter?: RecommendationFilter): boolean {
  if (!filter) return true;
  if (filter.projectId && recommendation.projectId !== filter.projectId) return false;
  if (filter.status && recommendation.status !== filter.status) return false;
  return true;
}

/**
 * In-memory Recommendation store (Sprint 4.8), matching the exact shape of
 * every other mock repository in this codebase. Recommendations are their
 * own objects, not Events — this is a separate store from
 * `event-repository.ts`, per the brief ("Events create Recommendations").
 */
export class MockRecommendationRepository implements RecommendationRepository {
  async create(input: CreateRecommendationInput): Promise<Recommendation> {
    const now = new Date().toISOString();
    const recommendation: Recommendation = {
      ...input,
      id: nextId(),
      status: input.status ?? "open",
      createdAt: now,
      updatedAt: now,
    };

    store = [...store, recommendation];
    return recommendation;
  }

  async list(filter?: RecommendationFilter): Promise<Recommendation[]> {
    return store.filter((recommendation) => matchesFilter(recommendation, filter));
  }

  async get(id: string): Promise<Recommendation | null> {
    return store.find((recommendation) => recommendation.id === id) ?? null;
  }

  async updateStatus(id: string, status: RecommendationStatus): Promise<Recommendation> {
    const target = store.find((recommendation) => recommendation.id === id);
    if (!target) {
      throw new Error(`Recommendation not found: ${id}`);
    }

    const updated: Recommendation = { ...target, status, updatedAt: new Date().toISOString() };
    store = store.map((recommendation) => (recommendation.id === id ? updated : recommendation));
    return updated;
  }
}

export const recommendationRepository: RecommendationRepository = new MockRecommendationRepository();
