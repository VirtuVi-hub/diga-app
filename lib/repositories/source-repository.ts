import { sources as seedSources } from "@/data/sources";
import type { ProcessingState, Source, SourceType } from "@/types/project-intelligence-gateway";

export type SourceFilter = {
  projectId?: string;
  sourceType?: SourceType;
  processingState?: ProcessingState;
};

export type CreateSourceRecord = Omit<Source, "createdAt" | "updatedAt" | "processingHistory"> & {
  processingHistory?: Source["processingHistory"];
};

export interface SourceRepository {
  create(input: CreateSourceRecord): Promise<Source>;
  list(filter?: SourceFilter): Promise<Source[]>;
  get(id: string): Promise<Source | null>;
  update(id: string, patch: Partial<Omit<Source, "id" | "projectId" | "createdAt">>): Promise<Source>;
}

let store: Source[] = [...seedSources];

function matchesFilter(source: Source, filter?: SourceFilter): boolean {
  if (!filter) return true;
  if (filter.projectId && source.projectId !== filter.projectId) return false;
  if (filter.sourceType && source.sourceType !== filter.sourceType) return false;
  if (filter.processingState && source.processingState !== filter.processingState) return false;
  return true;
}

/**
 * In-memory Source store (Sprint 5.2), matching the exact shape of every
 * other mock repository in this codebase. Seeded directly from
 * `data/sources.ts` (Module 9 — a believable, already-populated project),
 * the same precedent `drawingRepository`/`knowledgeObjectRepository`
 * already set, rather than starting empty like `revisionRepository`
 * (which only exists once its own detection pipeline runs).
 */
export class MockSourceRepository implements SourceRepository {
  async create(input: CreateSourceRecord): Promise<Source> {
    if (store.some((source) => source.id === input.id)) {
      throw new Error(`Source already exists: ${input.id}`);
    }

    const now = new Date().toISOString();
    const source: Source = { ...input, processingHistory: input.processingHistory ?? [], createdAt: now, updatedAt: now };

    store = [...store, source];
    return source;
  }

  async list(filter?: SourceFilter): Promise<Source[]> {
    return store.filter((source) => matchesFilter(source, filter));
  }

  async get(id: string): Promise<Source | null> {
    return store.find((source) => source.id === id) ?? null;
  }

  async update(id: string, patch: Partial<Omit<Source, "id" | "projectId" | "createdAt">>): Promise<Source> {
    const target = store.find((source) => source.id === id);
    if (!target) {
      throw new Error(`Source not found: ${id}`);
    }

    const updated: Source = { ...target, ...patch, updatedAt: new Date().toISOString() };
    store = store.map((source) => (source.id === id ? updated : source));
    return updated;
  }
}

export const sourceRepository: SourceRepository = new MockSourceRepository();
