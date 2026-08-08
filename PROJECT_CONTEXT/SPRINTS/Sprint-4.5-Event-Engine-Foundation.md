# Sprint: Event Engine Foundation

Status: Complete
Sprint ID: 4.5
Target Version: v4.5
Owner: Delta engineering
Created: 2026-08-02
Last Updated: 2026-08-02

---

# Objective

Build the generic Event infrastructure `docs/architecture/DIGA-CORE-ARCHITECTURE-V2.md` names as the platform's new pillar: an Event model, Publisher, in-process Bus, persistence, and placeholder subscribers — wired into the six existing write paths the brief names. No reactions, no notifications, no approvals, no automation, no Timeline UI. The Knowledge Graph remains the source of truth for current state; Events describe change alongside it (a transactional-outbox model, not Event Sourcing).

---

# Background

Phase 1 (Sprints 4.0–4.4) is complete and the architecture has been frozen per `DIGA-CORE-ARCHITECTURE-V2.md`. That document's own analysis observed that every sprint since 4.0 has followed the same unnamed shape — understand → propose → approve → record — built out of direct function calls and React state rather than a real event log. This sprint builds the real one, deliberately small, so future capabilities (Notifications, Timeline UI, Automation, Audit, Intelligence-as-subscriber) have one foundation to build on instead of each inventing their own.

---

# Scope

## In Scope

- A generic `Event` model (`types/event.ts`) — one shape for every fact, no `RequirementEvent`/`DecisionEvent`/etc.
- `EventPublisher` (`lib/events/event-publisher.ts`) — the one door any part of the platform publishes through.
- `EventBus` (`lib/events/event-bus.ts`) — in-process pub/sub, no external messaging.
- `EventRepository`/`EventService`/event actions — persistence, following the existing Repository/Service/Action pattern exactly.
- Four placeholder subscribers (Timeline, Notifications, Audit, Intelligence) — registration only, no business logic.
- A `TimelineProjection` (`lib/events/timeline-projection.ts`) — a pure, stateless transform from ordered events to timeline entries. Not a UI.
- Six publish integration points: Knowledge Object Created/Updated, Relationship Created/Removed, Knowledge Draft Approved, Discussion Created.

## Out of Scope

- Notifications, approval workflows, automation, Timeline UI, analytics, plugin system — explicitly named as out of scope by the brief.
- Any subscriber performing real work (Intelligence reacting to events, notifications actually being sent, audit records actually being queried).
- Event Sourcing — current state is never reconstructed by replaying events.
- Real authentication/multi-tenancy (`firmId`) — not part of this sprint, and not faked.

---

# Files Expected to Change

- `types/event.ts` (new)
- `lib/events/event-types.ts`, `event-bus.ts`, `event-publisher.ts`, `timeline-projection.ts` (all new)
- `lib/events/subscribers/{timeline,notifications,audit,intelligence}-subscriber.ts`, `subscribers/index.ts` (all new)
- `lib/repositories/event-repository.ts`, `lib/services/event-service.ts`, `lib/actions/event-actions.ts` (all new)
- `lib/services/knowledge-object-service.ts`, `relationship-service.ts`, `discussion-service.ts` (one publish call each)
- `components/project-shell/HomeWorkspace.tsx` (one publish call in `approveJournalDraft`)

---

# Files That Must Not Change

`lib/comprehension/*`, all of `lib/intelligence-engine/*`, `lib/knowledge-capture/*`; every repository's existing methods/behavior; `types/relationship.ts`, `types/knowledge-object.ts`, `types/discussion.ts`, `types/evidence.ts`; every UI component except the one new call in `HomeWorkspace.tsx`.

---

# Constraints

- Follow `DIGA-CORE-ARCHITECTURE-V2.md` (transactional outbox, not Event Sourcing; Knowledge Graph remains source of truth; events immutable).
- One generic Event architecture — no per-type event models.
- The Event Engine must be additive only — no existing behavior may change or regress.
- No external messaging infrastructure; in-process only.
- Do not implement any subscriber's real business logic.

---

# Implementation Notes (Architecture Decisions)

- **The event envelope refines `DIGA-CORE-ARCHITECTURE-V2.md`'s §6.1, per that document's own invitation to "refine the model if necessary" against real code:**
  - `sourceNode`/`targetNode` (both optional `RelationshipNodeRef`, reused verbatim from Sprint 4.0) replace the architecture doc's single `subject` field — this mirrors the proven `nodeA`/`nodeB` shape exactly, generalizing cleanly to both single-node facts (Knowledge Object Created) and edge facts (Relationship Created/Removed).
  - `eventType`/`timestamp`/`metadata` replace `type`/`occurredAt`/`payload` — same concepts, brief's naming.
  - `visibility: "internal" | "project"` is new — the significance filter the Timeline projection needs, matching `01_PRODUCT.md`'s "only meaningful knowledge milestones appear."
  - `reason?: string` is new — a short human-readable one-liner, distinct from the full `ReasoningResult`, which is too rich/type-specific for a generic event.
  - `firmId` is dropped entirely — nothing in the current codebase has a Firm concept anywhere outside the aspirational `docs/architecture/001-platform-architecture.md`; an unpopulatable field would be worse than an honest omission.
  - `projectId` stays but is optional — populated wherever cheaply available (every `KnowledgeObject`/`Relationship` already carries one); `Discussion` has no `projectId` field yet (a pre-existing gap, not fixed here), so `discussion.created` events omit it honestly rather than fake one.
  - `correlationId`, `causationId`, `schemaVersion` are kept as optional/defaulted fields from the architecture doc — cheap to include now, expensive to retrofit onto a growing log later. Not populated with real causality chains this sprint; present in the shape for forward compatibility.
- **`eventType` stays an open string**, with `lib/events/event-types.ts` providing named constants for the six known types — same "dictionary grows, architecture doesn't" philosophy already established for `EntityExtractor` (Sprint 4.1).
- **Publishing can never break the write it describes.** `publishSafely()` (`lib/events/event-publisher.ts`) wraps `eventPublisher.publish()` in a try/catch used by every server-side service integration; the one client-originated publish (`HomeWorkspace.tsx`'s draft-approval) is wrapped the same way at its call site. This makes "additive only" a structural guarantee, not a per-call-site convention to remember.
- **`InProcessEventBus.dispatch()` uses `Promise.allSettled`**, not sequential awaits that could throw — one subscriber failing must never block another subscriber or propagate back to the publisher.
- **Subscriber registration is a module-load side effect**, not an explicit bootstrap step: `lib/events/subscribers/index.ts` registers all four placeholders with the shared `eventBus` singleton at import time; `event-publisher.ts` imports it once, guaranteeing registration before the first `publish()` call, without needing a dedicated Next.js startup hook.
- **Server-side services call `eventPublisher` directly; client code goes through the new `publishEvent` action.** `KnowledgeObjectService`, `RelationshipService`, and `DiscussionService` are only ever invoked via their own `"use server"` action files, so importing `eventPublisher` (a plain module) directly is safe — the same pattern already proven by `EvidenceEngine` et al. since Sprint 4.3. `HomeWorkspace.tsx`'s Knowledge-Draft-Approved fact has no other server-side hook to piggyback on, so it goes through the one new client-callable `publishEvent` action.
- **`RelationshipService.remove()` looks up the relationship via the existing `query()` before removing it**, so the event can carry its nodes/projectId after the row is gone — no new repository method added. Its actor is honestly `{type:"person", id: null}` rather than misattributed to the original creator, since `remove()` has no "who's calling" parameter yet (matches Sprint 4.0's own note that no UI calls create/remove relationship yet — both integration points are correctly wired but not live from any real user flow today).
- **The Timeline projection is a pure function, not a new store.** `TimelineProjection.project(events)` filters to `visibility === "project"`, sorts chronologically, and shapes the result — it never maintains its own materialized state, avoiding a second, redundant "timeline entries" store alongside the Event repository. A future sprint may choose to make the Timeline *subscriber* maintain an incrementally-updated view instead; this sprint deliberately keeps the subscriber a no-op placeholder and the projection a stateless query-time transform, matching "keep this sprint intentionally small."

---

# Acceptance Criteria

- [x] A generic `Event` model exists, with no type-specific variants.
- [x] `EventPublisher` exists and is the single entry point every integration uses.
- [x] `EventBus` supports subscriber registration and dispatch, in-process only.
- [x] Four placeholder subscribers (Timeline, Notifications, Audit, Intelligence) register correctly and perform no business logic.
- [x] Events are persisted via a Repository/Service/Action trio matching existing architecture exactly.
- [x] The six named events (Knowledge Object Created/Updated, Relationship Created/Removed, Knowledge Draft Approved, Discussion Created) are published from their real integration points.
- [x] A Timeline projection converts ordered events into timeline entries — no UI.
- [x] Nothing from Sprints 4.0–4.4 regresses.

---

# Validation

The implementation must:

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`)
- [x] Existing functionality (Delta Queries, Discussion creation, duplicate detection, Knowledge Capture, Evidence Engine, Reasoning Engine) behaves exactly as before
- [x] Events are emitted when knowledge changes
- [x] Subscribers receive events
- [x] Timeline projection receives events
- [x] No runtime errors; dev server restarts clean

---

# Completion Notes

Completed work:

- `types/event.ts` — the generic `Event`/`EventActor`/`EventVisibility`/`PublishEventInput` shapes, per the refined envelope above.
- `lib/events/event-types.ts` — named constants for the six known event types; `Event.eventType` itself stays an open string.
- `lib/events/event-bus.ts` — `InProcessEventBus` (singleton `eventBus`), `Promise.allSettled` dispatch.
- `lib/events/subscribers/` — four placeholder subscribers, each an internal counter proving delivery, registered via `subscribers/index.ts`'s import side effect.
- `lib/events/event-publisher.ts` — `InProcessEventPublisher` (singleton `eventPublisher`) fills in `id`/`timestamp`/`schemaVersion`/default `visibility`, persists via `EventService`, dispatches via `eventBus`; also exports `publishSafely()` for try/catch-wrapped calls from existing services.
- `lib/repositories/event-repository.ts`, `lib/services/event-service.ts` — mirror `MockRelationshipRepository`/`MockDiscussionRepository`'s exact shape (module-level array, immutable updates, interface + impl + singleton).
- `lib/actions/event-actions.ts` — `publishEvent()` (client-callable), `getEvents()`, `getTimeline()`.
- `lib/events/timeline-projection.ts` — `ChronologicalTimelineProjection` (singleton `timelineProjection`), pure transform, no new store.
- `KnowledgeObjectService.create()`/`.revise()`, `RelationshipService.create()`/`.remove()`, `DiscussionService.create()` — one `publishSafely()` call each, after the real repository write, before returning.
- `HomeWorkspace.tsx`'s `approveJournalDraft()` — one `publishEvent()` call (try/caught at the call site) for `knowledge_draft.approved`, before duplicate-check/discussion-resolution runs.

Verified via a temporary, unauthenticated smoke-test API route (added and removed within this session, same technique as Sprints 4.3–4.4): created a Discussion, a Knowledge Object, revised it, created and removed a Relationship, and published a Knowledge Draft Approved event through the real service/action layer. All six event types were persisted and returned by `getEvents()`; all four placeholder subscribers' counters incremented identically for every dispatched event; `getTimeline()` returned chronologically ordered entries filtered to `visibility:"project"`; `discussion.created` events correctly omitted `projectId` (the known `Discussion` type gap) while `knowledge_object.*`/`relationship.*` events correctly carried it. Confirmed the six standard routes (`/`, `/projects`, `/projects/new`, `/auth`, `/participants`, `/review`) return identical status codes to every prior sprint, with no runtime errors in the dev server log.

Known issues:

- Full authenticated visual verification in a browser was not possible in this environment (no test credentials) — the same limitation every prior sprint documented.
- `RelationshipService.create()`/`.remove()`'s event integration is correctly wired but not reachable from any live UI flow today — Sprint 4.0's own notes confirm no screen calls these yet.
- `discussion.created` events never carry `projectId`, since `Discussion` has no such field yet — a pre-existing type gap, not introduced or fixed this sprint.
- `correlationId`/`causationId` are present in the model but never populated with real causality chains this sprint — nothing yet needs multi-step correlation.
- `firmId` does not exist on the Event model at all — deliberately omitted rather than added unpopulatable, pending real Firm/multi-tenancy implementation.
- The Timeline projection is a pure, on-demand transform, not an incrementally-maintained materialized view — acceptable at this scale, revisit if/when the Event log grows large enough that scanning it per request becomes a real cost.

Follow-up work:

- Build the actual Timeline UI (Sprint 3.6A's Evolution Strip has been static since its own sprint) consuming `getTimeline()`.
- Give the Notifications/Audit/Intelligence subscribers real business logic, one sprint at a time, per `DIGA-CORE-ARCHITECTURE-V2.md`'s roadmap — Intelligence subscribing to a channel-agnostic ingestion event is the specific unlock for Meeting/Voice/Email/WhatsApp integration named in that document.
- Wire real authentication so `EventActor.id` references real People instead of hardcoded name strings, and add `firmId` once a real Firm concept exists.
- Consider a saga/process-manager layer only once a genuine multi-step approval chain is a real requirement — not speculatively, per the architecture document's own recommendation.

Modified files:

New: `types/event.ts`, `lib/events/event-types.ts`, `lib/events/event-bus.ts`, `lib/events/event-publisher.ts`, `lib/events/timeline-projection.ts`, `lib/events/subscribers/timeline-subscriber.ts`, `lib/events/subscribers/notifications-subscriber.ts`, `lib/events/subscribers/audit-subscriber.ts`, `lib/events/subscribers/intelligence-subscriber.ts`, `lib/events/subscribers/index.ts`, `lib/repositories/event-repository.ts`, `lib/services/event-service.ts`, `lib/actions/event-actions.ts`.

Changed: `lib/services/knowledge-object-service.ts`, `lib/services/relationship-service.ts`, `lib/services/discussion-service.ts`, `components/project-shell/HomeWorkspace.tsx`.
