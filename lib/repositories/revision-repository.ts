import type { CreateRevisionInput, Revision, RevisionStatus } from "@/types/revision-intelligence";

export type RevisionFilter = {
  projectId?: string;
  status?: RevisionStatus;
};

export interface RevisionRepository {
  create(input: CreateRevisionInput): Promise<Revision>;
  list(filter?: RevisionFilter): Promise<Revision[]>;
  get(id: string): Promise<Revision | null>;
  update(id: string, patch: Partial<Pick<Revision, "status" | "knowledgeObjectId" | "discussionId" | "createdRelationshipIds">>): Promise<Revision>;
}

let store: Revision[] = [];
let sequence = 0;

function nextId(): string {
  sequence += 1;
  return `revision-${Date.now()}-${sequence}`;
}

function matchesFilter(revision: Revision, filter?: RevisionFilter): boolean {
  if (!filter) return true;
  if (filter.projectId && revision.projectId !== filter.projectId) return false;
  if (filter.status && revision.status !== filter.status) return false;
  return true;
}

/**
 * In-memory Revision store (Sprint 5.0), matching the exact shape of every
 * other mock repository in this codebase (`MockRecommendationRepository`,
 * `MockRelationshipRepository`, ...) — a one-file swap point for a future
 * Supabase-backed implementation, per the architecture document's own
 * roadmap. Starts empty: unlike `data/relationships.ts`/
 * `data/knowledge-objects.ts`, there is no pre-processed seed here, since a
 * `Revision` is the *output* of a pipeline (`RevisionService.
 * detectAndProcess()`), not a static fixture — the seed data
 * (`data/revision-changes.ts`) is the mock drawing diff that pipeline reads.
 */
export class MockRevisionRepository implements RevisionRepository {
  async create(input: CreateRevisionInput): Promise<Revision> {
    const revision: Revision = {
      ...input,
      id: nextId(),
      status: input.status ?? "detected",
      createdRelationshipIds: [],
      timestamp: new Date().toISOString(),
    };

    store = [...store, revision];
    return revision;
  }

  async list(filter?: RevisionFilter): Promise<Revision[]> {
    return store.filter((revision) => matchesFilter(revision, filter));
  }

  async get(id: string): Promise<Revision | null> {
    return store.find((revision) => revision.id === id) ?? null;
  }

  async update(id: string, patch: Partial<Pick<Revision, "status" | "knowledgeObjectId" | "discussionId" | "createdRelationshipIds">>): Promise<Revision> {
    const target = store.find((revision) => revision.id === id);
    if (!target) {
      throw new Error(`Revision not found: ${id}`);
    }

    const updated: Revision = { ...target, ...patch };
    store = store.map((revision) => (revision.id === id ? updated : revision));
    return updated;
  }
}

export const revisionRepository: RevisionRepository = new MockRevisionRepository();
