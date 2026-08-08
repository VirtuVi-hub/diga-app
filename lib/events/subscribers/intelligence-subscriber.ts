import type { Event } from "@/types/event";
import type { EventSubscriber } from "../event-bus";

/**
 * Placeholder Intelligence subscriber (Sprint 4.5) — proves subscription
 * wiring only. `DIGA-CORE-ARCHITECTURE-V2.md` (§7) envisions Intelligence
 * eventually subscribing to ingestion events so it works identically
 * regardless of channel (Journal, voice, email, ...) — this sprint does
 * NOT wire that up. It must not call `deltaComprehensionService`,
 * `evidenceEngine`, `knowledgeCaptureEngine`, or any other real Intelligence
 * module; doing so would be implementing a reaction, which this sprint
 * explicitly defers.
 */
class IntelligenceSubscriber implements EventSubscriber {
  name = "intelligence";
  private received: Event[] = [];

  async handle(event: Event): Promise<void> {
    this.received = [...this.received, event];
  }

  get receivedCount(): number {
    return this.received.length;
  }
}

export const intelligenceSubscriber = new IntelligenceSubscriber();
