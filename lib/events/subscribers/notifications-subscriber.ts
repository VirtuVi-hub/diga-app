import { NotificationService } from "@/lib/services/notification-service";
import type { Event } from "@/types/event";
import type { EventSubscriber } from "../event-bus";

/**
 * Notifications subscriber (Sprint 4.5 placeholder, real logic since
 * Sprint 5.9, Module 1). Delegates every event to
 * `NotificationService.handleEvent()`, which decides whether it produces
 * a real, persisted Notification and for whom. Wrapped in its own
 * try/catch on top of `eventBus.dispatch()`'s existing `Promise.allSettled`
 * guarantee, so a notification failure can never break the real write it
 * describes or block any other subscriber.
 */
class NotificationsSubscriber implements EventSubscriber {
  name = "notifications";

  async handle(event: Event): Promise<void> {
    try {
      await NotificationService.handleEvent(event);
    } catch (error) {
      console.error("Notification handling failed:", error);
    }
  }
}

export const notificationsSubscriber = new NotificationsSubscriber();
