import { drawings as seedDrawings } from "@/data/drawings";
import type { CreateDrawingInput, Drawing, DrawingType } from "@/types/drawing-intelligence";

export type DrawingFilter = {
  projectId?: string;
  drawingType?: DrawingType;
  discipline?: string;
};

export interface DrawingRepository {
  create(input: CreateDrawingInput): Promise<Drawing>;
  list(filter?: DrawingFilter): Promise<Drawing[]>;
  get(id: string): Promise<Drawing | null>;
  update(id: string, patch: Partial<Pick<Drawing, "status" | "createdRelationshipIds">>): Promise<Drawing>;
}

let store: Drawing[] = [...seedDrawings];

function matchesFilter(drawing: Drawing, filter?: DrawingFilter): boolean {
  if (!filter) return true;
  if (filter.projectId && drawing.projectId !== filter.projectId) return false;
  if (filter.drawingType && drawing.drawingType !== filter.drawingType) return false;
  if (filter.discipline && drawing.discipline !== filter.discipline) return false;
  return true;
}

/**
 * In-memory Drawing store (Sprint 5.1), matching the exact shape of every
 * other mock repository in this codebase — a one-file swap point for a
 * future Supabase-backed implementation. Unlike `revisionRepository`
 * (Sprint 5.0, starts empty — a `Revision` only exists once its detection
 * pipeline runs), this one is seeded directly from `data/drawings.ts`, the
 * same precedent `knowledgeObjectRepository`/`relationshipRepository`
 * already set: Module 3/12 ask for a believable, already-populated project,
 * not an empty store waiting for a first upload.
 */
export class MockDrawingRepository implements DrawingRepository {
  async create(input: CreateDrawingInput): Promise<Drawing> {
    if (store.some((drawing) => drawing.id === input.id)) {
      throw new Error(`Drawing already exists: ${input.id}`);
    }

    const now = new Date().toISOString();
    const drawing: Drawing = {
      ...input,
      status: input.status ?? "issued",
      createdRelationshipIds: [],
      createdAt: now,
      updatedAt: now,
    };

    store = [...store, drawing];
    return drawing;
  }

  async list(filter?: DrawingFilter): Promise<Drawing[]> {
    return store.filter((drawing) => matchesFilter(drawing, filter));
  }

  async get(id: string): Promise<Drawing | null> {
    return store.find((drawing) => drawing.id === id) ?? null;
  }

  async update(id: string, patch: Partial<Pick<Drawing, "status" | "createdRelationshipIds">>): Promise<Drawing> {
    const target = store.find((drawing) => drawing.id === id);
    if (!target) {
      throw new Error(`Drawing not found: ${id}`);
    }

    const updated: Drawing = { ...target, ...patch, updatedAt: new Date().toISOString() };
    store = store.map((drawing) => (drawing.id === id ? updated : drawing));
    return updated;
  }
}

export const drawingRepository: DrawingRepository = new MockDrawingRepository();
