import { eventBus } from "../event-bus";
import { auditSubscriber } from "./audit-subscriber";
import { intelligenceSubscriber } from "./intelligence-subscriber";
import { notificationsSubscriber } from "./notifications-subscriber";
import { recommendationSubscriber } from "./recommendation-subscriber";
import { timelineSubscriber } from "./timeline-subscriber";

/**
 * Registration bootstrap. Imported once, for its side effect, by
 * `event-publisher.ts` — ES module caching guarantees this runs exactly
 * once, before any `publish()` call, without needing a dedicated app-startup
 * hook.
 */
eventBus.subscribe(timelineSubscriber);
eventBus.subscribe(notificationsSubscriber);
eventBus.subscribe(auditSubscriber);
eventBus.subscribe(intelligenceSubscriber);
eventBus.subscribe(recommendationSubscriber);

export { auditSubscriber, intelligenceSubscriber, notificationsSubscriber, recommendationSubscriber, timelineSubscriber };
