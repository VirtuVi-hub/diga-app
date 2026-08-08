"use server";

import { eventPublisher } from "@/lib/events/event-publisher";
import { timelineProjection } from "@/lib/events/timeline-projection";
import { EventService } from "@/lib/services/event-service";
import type { EventFilter } from "@/lib/repositories/event-repository";
import type { PublishEventInput } from "@/types/event";

/**
 * The client-callable entry point for publishing an event. Server-side
 * services (`KnowledgeObjectService`, `RelationshipService`,
 * `DiscussionService`) call `eventPublisher` directly since they already
 * only ever run server-side; this action exists for facts that originate
 * in a `"use client"` component with no other server hook — e.g. the
 * Knowledge Capture Engine's draft-approval moment.
 */
export async function publishEvent(input: PublishEventInput) {
  return eventPublisher.publish(input);
}

export async function getEvents(filter?: EventFilter) {
  return EventService.list(filter);
}

/**
 * Not wired into any UI this sprint — the Timeline UI is future work.
 * Proves the projection is real and queryable end-to-end.
 */
export async function getTimeline(filter?: EventFilter) {
  const events = await EventService.list(filter);
  return timelineProjection.project(events);
}
