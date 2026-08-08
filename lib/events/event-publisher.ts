import { EventService } from "@/lib/services/event-service";
import type { Event, PublishEventInput } from "@/types/event";
import { eventBus } from "./event-bus";
// Side-effect import: registers the placeholder subscribers before any
// publish() call ever runs. ES module caching guarantees this executes once.
import "./subscribers";

function nextId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Module 2 of the Event Engine (Sprint 4.5) — the one door every part of
 * the platform publishes through, without knowing or caring who consumes
 * it. Fills in the envelope fields a caller shouldn't have to think about
 * (`id`, `timestamp`, `schemaVersion`, default `visibility`), persists the
 * event (Knowledge Graph repositories remain the source of truth for
 * current state; this is the separate, append-only event log), then
 * dispatches it to every registered subscriber.
 */
export interface EventPublisher {
  publish(input: PublishEventInput): Promise<Event>;
}

export class InProcessEventPublisher implements EventPublisher {
  async publish(input: PublishEventInput): Promise<Event> {
    const event: Event = {
      ...input,
      id: nextId(),
      timestamp: new Date().toISOString(),
      schemaVersion: 1,
      visibility: input.visibility ?? "project",
    };

    const stored = await EventService.record(event);
    await eventBus.dispatch(stored);
    return stored;
  }
}

export const eventPublisher: EventPublisher = new InProcessEventPublisher();

/**
 * Publishing must never break the real write it describes. Every call site
 * in the existing services (`KnowledgeObjectService`, `RelationshipService`,
 * `DiscussionService`) uses this instead of calling `eventPublisher.publish`
 * directly, so a bug anywhere in the new Event Engine can never regress
 * Sprint 4.0–4.4 behavior — "additive only" as a structural guarantee, not
 * a per-call-site convention to remember.
 */
export async function publishSafely(input: PublishEventInput): Promise<void> {
  try {
    await eventPublisher.publish(input);
  } catch (error) {
    console.error("Event publish failed:", error);
  }
}
