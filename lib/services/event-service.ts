import { eventRepository, type EventFilter } from "@/lib/repositories/event-repository";
import type { Event } from "@/types/event";

export class EventService {
  static async record(event: Event): Promise<Event> {
    return eventRepository.create(event);
  }

  static async list(filter?: EventFilter): Promise<Event[]> {
    return eventRepository.list(filter);
  }
}
