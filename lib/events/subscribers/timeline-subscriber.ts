import type { Event } from "@/types/event";
import type { EventSubscriber } from "../event-bus";

/**
 * Placeholder Timeline subscriber (Sprint 4.5) — proves subscription wiring
 * only. Real timeline business logic is `lib/events/timeline-projection.ts`,
 * a separate, pure, on-demand transform over the Event repository, not a
 * materialized view maintained by this subscriber. A future sprint may
 * change that; this sprint deliberately does not implement it here.
 */
class TimelineSubscriber implements EventSubscriber {
  name = "timeline";
  private received: Event[] = [];

  async handle(event: Event): Promise<void> {
    this.received = [...this.received, event];
  }

  get receivedCount(): number {
    return this.received.length;
  }
}

export const timelineSubscriber = new TimelineSubscriber();
