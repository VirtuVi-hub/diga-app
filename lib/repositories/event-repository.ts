import type { Event } from "@/types/event";

export type EventFilter = {
  projectId?: string;
  eventType?: string;
};

export interface EventRepository {
  create(event: Event): Promise<Event>;
  list(filter?: EventFilter): Promise<Event[]>;
}

let store: Event[] = [];

function matchesFilter(event: Event, filter?: EventFilter): boolean {
  if (!filter) return true;
  if (filter.projectId && event.projectId !== filter.projectId) return false;
  if (filter.eventType && event.eventType !== filter.eventType) return false;
  return true;
}

/**
 * In-memory event store, matching the exact shape of every other mock
 * repository in this codebase (`MockRelationshipRepository`,
 * `MockDiscussionRepository`, `MockKnowledgeObjectRepository`): module-level
 * mutable array, immutable updates, interface + impl + singleton export.
 * Per the brief, current state stays in the Knowledge repositories — this
 * repository stores only the append-only event log, a separate concern.
 */
export class MockEventRepository implements EventRepository {
  async create(event: Event): Promise<Event> {
    store = [...store, event];
    return event;
  }

  async list(filter?: EventFilter): Promise<Event[]> {
    return store.filter((event) => matchesFilter(event, filter));
  }
}

export const eventRepository: EventRepository = new MockEventRepository();
