import { recommendationEngine } from "@/lib/recommendations/recommendation-engine";
import type { Event } from "@/types/event";
import type { EventSubscriber } from "../event-bus";

/**
 * Recommendation subscriber (Sprint 4.8) — a new, distinct subscriber, not a
 * repurposing of the placeholder `intelligenceSubscriber` (`intelligence-
 * subscriber.ts`), which remains exactly as documented since Sprint 4.5
 * ("must not call... any real Intelligence module... this sprint explicitly
 * defers" to "a dedicated sprint"). This is that dedicated sprint, but for a
 * specific, bounded, advisory-only capability — evaluating Recommendation
 * rules — not a general "Intelligence reacts to everything" wire-up.
 *
 * Wrapped in try/catch for the same reason `publishSafely()` wraps every
 * event-publishing call site: a bug in Recommendation evaluation must never
 * break the write the triggering Event describes, or block delivery to any
 * other subscriber (`EventBus.dispatch()` already uses `Promise.allSettled`,
 * but this keeps the guarantee explicit and matches the codebase's own
 * "structural guarantee, not a convention" precedent).
 */
class RecommendationSubscriber implements EventSubscriber {
  name = "recommendation";

  async handle(event: Event): Promise<void> {
    try {
      await recommendationEngine.evaluate(event);
    } catch (error) {
      console.error("Recommendation evaluation failed:", error);
    }
  }
}

export const recommendationSubscriber = new RecommendationSubscriber();
