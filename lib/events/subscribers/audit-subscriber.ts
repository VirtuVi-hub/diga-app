import type { Event } from "@/types/event";
import type { EventSubscriber } from "../event-bus";

/**
 * Placeholder Audit subscriber (Sprint 4.5) — proves subscription wiring
 * only. A real audit trail (per `docs/architecture/002-authentication-and-authorization.md`'s
 * "every security-related action is recorded") is future work; this sprint
 * only proves every event reaches a listener that could eventually record one.
 */
class AuditSubscriber implements EventSubscriber {
  name = "audit";
  private received: Event[] = [];

  async handle(event: Event): Promise<void> {
    this.received = [...this.received, event];
  }

  get receivedCount(): number {
    return this.received.length;
  }
}

export const auditSubscriber = new AuditSubscriber();
