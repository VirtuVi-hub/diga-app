import type { Event } from "@/types/event";

/**
 * A registered listener. `name` exists purely for debugging/introspection —
 * there is no addressing by name, every subscriber receives every event.
 * Filtering by `eventType`/`visibility` is each subscriber's own concern,
 * not the bus's — keeping the bus itself as simple as the brief asks.
 */
export type EventSubscriber = {
  name: string;
  handle(event: Event): void | Promise<void>;
};

/**
 * Module 3 of the Event Engine (Sprint 4.5) — an in-process publish/
 * subscribe bus. No external messaging infrastructure; this is an
 * architectural foundation, not a message queue.
 */
export interface EventBus {
  subscribe(subscriber: EventSubscriber): void;
  dispatch(event: Event): Promise<void>;
}

export class InProcessEventBus implements EventBus {
  private subscribers: EventSubscriber[] = [];

  subscribe(subscriber: EventSubscriber): void {
    this.subscribers.push(subscriber);
  }

  /**
   * `Promise.allSettled` — one subscriber throwing must never prevent
   * another subscriber from receiving the event, and must never propagate
   * back to the publisher (which would risk breaking the real write the
   * event describes). Individual failures are swallowed here; a future
   * sprint's Audit subscriber is the natural place to record them, not the
   * bus itself.
   */
  async dispatch(event: Event): Promise<void> {
    await Promise.allSettled(this.subscribers.map((subscriber) => subscriber.handle(event)));
  }
}

export const eventBus: EventBus = new InProcessEventBus();
