# Sprint: Project Intelligence Timeline

Status: Complete
Sprint ID: 4.6
Target Version: v4.6
Owner: Delta engineering
Created: 2026-08-02
Last Updated: 2026-08-02

---

# Objective

Expose the Event Log to users, without introducing any new architecture: a Timeline page reads only from `getTimeline()` (Sprint 4.5's projection), presents events chronologically grouped by Today/Yesterday/Earlier, visually distinguishes event categories, links out to existing Knowledge Object/Discussion detail pages, and supports lightweight category filtering. Delta additionally answers a narrow set of timeline-shaped questions ("What happened yesterday?", "What was recently approved?") by querying the same Event Log — not a separate Timeline AI.

---

# Background

Sprint 4.5 built the Event Engine and a `TimelineProjection`, but nothing rendered it — `/projects/[id]/timeline` was still a "Coming Soon" stub, and (discovered this sprint) unreachable from any navigation at all. This is explicitly **not** an activity/audit log or notification feed — it is meant to communicate how project knowledge evolves, per the brief's own framing.

**Resolved ambiguity — three "Timeline"-labeled surfaces existed in the codebase:**
1. `components/delta/ProjectEvolutionStrip.tsx` + `EvolutionDetailPanel.tsx` (`aria-label="Timeline"`) — a live, richly-designed rail driven by **static** `data/evolution.ts` milestones (predecessors/successors/impact counts). This is the pre-existing "Project Evolution" feature (`03_CURRENT_STATE.md`: "wiring to real data is future work").
2. `/projects/[id]/timeline` — the dead "Coming Soon" stub, unlinked from any nav.
3. This sprint's new Event-Log-driven Project Intelligence Timeline.

Decision: surfaces 1 and 3 are **different features with different shapes** (a milestone lineage graph vs. a flat chronological event stream) and the brief never asks to replace the Evolution Strip — it is left untouched. Surface 2, already reserved but dead, is where this sprint's real implementation now lives; it needed a Sidebar entry added since nothing linked to it.

---

# Scope

## In Scope

- `TimelineEntry` (Sprint 4.5) extended with `category`, `actorId`, `relatedNode`, `relatedTitle` — still produced by the same pure `project(events)` function, no new store.
- A generic `categorize(eventType)` prefix-matcher (Knowledge/Relationships/Discussions/Approvals/Intelligence) and a generated, non-generic `summarize(event)` (e.g. "Requirement created: X", "Discussion started: Y") — both in `timeline-projection.ts`.
- `lib/events/timeline-grouping.ts` — Today/Yesterday/Earlier bucketing, a page-level presentational concern kept separate from the projection.
- `components/timeline/TimelineView.tsx` + `TimelineEntryCard.tsx` — the Timeline UI: category filter chips, grouped list, category badges, click-through to existing Knowledge Object/Discussion detail routes.
- `app/projects/[id]/timeline/page.tsx` replaced (was "Coming Soon").
- A "Timeline" item added to `AppSidebar.tsx` — the page was previously unreachable from any nav.
- `lib/events/timeline-query.ts` — narrow temporal-keyword detection (`detectTimelineQuery`) + event-log-backed answering (`answerTimelineQuery`), reusing the existing `DeltaRelatedResult` kind (zero new rendering code).
- One new early-exit branch in `delta-query-resolver.ts` routing timeline-shaped questions to the above, before the relationship-evidence pipeline.

## Out of Scope

- Notifications, approval workflows, automation, analytics, dashboards — explicitly named as out of scope by the brief.
- Any change to `components/delta/ProjectEvolutionStrip.tsx`, `EvolutionDetailPanel.tsx`, or `data/evolution.ts` — a separate, untouched feature.
- A `Discussion.projectId` retrofit — out of scope; `getTimeline()` is called unfiltered instead (see Implementation Notes).
- A new Event Detail view — clicking an entry reuses existing Knowledge Object/Discussion pages only.

---

# Files Expected to Change

- `lib/events/timeline-projection.ts` (extended `TimelineEntry`, `categorize`, `summarize`, `TIMELINE_CATEGORY_LABEL`)
- `lib/events/timeline-grouping.ts` (new)
- `lib/events/timeline-query.ts` (new)
- `components/timeline/TimelineView.tsx`, `TimelineEntryCard.tsx` (new)
- `app/projects/[id]/timeline/page.tsx` (replaced stub)
- `components/project-shell/AppSidebar.tsx` (new "Timeline" nav item)
- `lib/intelligence-engine/delta-query-resolver.ts` (one new early-exit branch)

---

# Files That Must Not Change

`lib/comprehension/*`, everything in `lib/intelligence-engine/*` other than the one new branch, `lib/knowledge-capture/*`, all repositories, `types/event.ts` (the `Event` model itself), `components/delta/ProjectEvolutionStrip.tsx`, `EvolutionDetailPanel.tsx`, `data/evolution.ts`, `components/delta/DeltaResponsePanel.tsx` (reused as-is).

---

# Constraints

- The Timeline must remain a projection of Events — no Timeline database, no duplicated Event storage, no `TimelineRepository`/`TimelineService`/`TimelineStore`.
- No Timeline-specific business logic beyond shaping events for display.
- Delta's timeline answers must reuse existing Intelligence/Event architecture — no separate Timeline AI.
- Categories/styling must stay generic — no per-Knowledge-Object-type special-casing.

---

# Implementation Notes (Architecture Decisions)

- **`getTimeline()` is called unfiltered by `projectId` this sprint.** `discussion.created` events never carry a `projectId` (a Sprint 4.5 gap — `Discussion` has no such field). Strict project-scoping would silently drop every Discussion event from the story the brief explicitly wants told ("Discussion Started"). Since the app is effectively single-project today, this is an honest simplification, not a silently-papered-over bug — documented here and in `03_CURRENT_STATE.md`.
- **`TimelineEntry`'s output shape grew; its contract didn't.** It's still one pure `project(events: Event[]): TimelineEntry[]` function, no new persistent store. `category` is derived by generic `eventType` prefix match (`"knowledge_object."` → knowledge, etc.) — a new event type is categorized correctly automatically, satisfying "don't hardcode Requirement/Decision-specific styling." `relatedNode`/`relatedTitle` come straight from the event's existing `sourceNode`/`metadata.title` — no new data is invented.
- **`summarize(event)` uses a small, non-exhaustive lookup keyed by the six known `EVENT_TYPES`**, producing the brief's own vocabulary ("Requirement created: X", "Discussion started: Y", "Relationship added (evidence)"). Unknown/future event types fall back to a humanized version of the raw `eventType` string rather than requiring this map to be kept exhaustive — new event types degrade gracefully instead of breaking. This directly serves goal 9 ("tell the story," "avoid looking like a generic audit log") — without it every entry would read as a raw `"knowledge_object.created.v1"` string.
- **Day-bucketing lives in its own module (`timeline-grouping.ts`), not the projection.** Today/Yesterday/Earlier is a page-level presentational concern; Delta's timeline-question answering wants a flat, ungrouped list instead, so it was kept out of the core projection contract.
- **Delta's timeline integration is a narrow, additive branch, not a new pipeline.** `detectTimelineQuery()` pattern-matches temporal keywords (yesterday/today/this week/recently/"since the last meeting"/"what changed") plus "approved"/"approval" on the already-translated comprehension text — reusing Comprehension's normalization for free. It returns `null` for anything else, so it never interferes with entity-based questions (verified: none of the existing test phrases from Sprints 4.1–4.5 contain these keywords). `answerTimelineQuery()` shapes matching `TimelineEntry`s into `Evidence[]` and returns the existing `DeltaRelatedResult` kind — `DeltaResponsePanel.tsx` needed zero changes to render it.
- **This is the first change to `delta-query-resolver.ts` since Sprint 4.3.** Justified because this sprint's own goal 5 explicitly asks Delta to answer timeline questions through the existing resolver. The new branch sits after the clarification check (so ambiguous-entity clarification still takes precedence) and before the `routing.target`/evidence-collection logic, since relationship evidence is irrelevant to "what happened yesterday." Nothing else in the file changed; the frozen Comprehension/Intent pipeline still runs first and unchanged.
- **The Timeline page needed a Sidebar nav entry.** `/projects/[id]/timeline` existed as a route since before this sprint but was linked from nowhere (confirmed via `AppSidebar.tsx`'s nav list, which only had All Projects/Home/Project/Data/Knowledge Bank/Settings). A "Timeline" item was added (after "Home") — without it, the page this sprint builds would remain as unreachable as the stub it replaces.
- **`ProjectEvolutionStrip`/`EvolutionDetailPanel`/`data/evolution.ts` are untouched.** See Background — different shape (milestone lineage graph vs. flat event stream), different already-established product name ("Project Evolution"), and the brief never mentions replacing it.

---

# Acceptance Criteria

- [x] DIGA exposes a Project Intelligence Timeline, reachable from navigation.
- [x] Entirely driven by the Sprint 4.5 Timeline Projection — no new storage.
- [x] Events grouped Today/Yesterday/Earlier, category-badged, category-filterable.
- [x] Clicking an entry with a resolvable Knowledge Object/Discussion navigates to the existing detail page.
- [x] Delta answers "What happened yesterday?", "What was recently approved?" etc. from the Event Log.
- [x] Existing functionality (Delta Queries, Discussion creation, Knowledge Capture, Event publishing) unchanged.

---

# Validation

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`)
- [x] Temporary smoke-test route (added/removed this session): created a Discussion, a Knowledge Object, revised it, and published a Knowledge Draft Approved event through the real service/action layer — `getTimeline()` returned all 4 events with correct `category`/`relatedNode`/`relatedTitle`/`actorId`/human-readable `summary`. `resolveDeltaQuery("What happened yesterday?")` correctly returned zero results (all smoke events were "today"); `resolveDeltaQuery("What was recently approved?")` correctly returned the one approval event with heading "Recently approved"; `resolveDeltaQuery("Where is the staircase?")` (a pre-existing, unrelated test phrase) was completely unaffected, returning its normal clarification result.
- [x] Dev server restarted clean after production build; `/`, existing project sub-pages, and the new `/projects/[id]/timeline` all return identical (pre-existing, auth-gated) status codes to each other — confirming no new regression, though full authenticated visual verification wasn't possible in this environment (same limitation every prior sprint documented).

---

# Completion Notes

Completed work:

- `lib/events/timeline-projection.ts` — `TimelineEntry` gained `category`, `actorId`, `relatedNode`, `relatedTitle`; added `categorize()`, `summarize()`, `TIMELINE_CATEGORY_LABEL`.
- `lib/events/timeline-grouping.ts` — `groupByRecency()`.
- `lib/events/timeline-query.ts` — `detectTimelineQuery()`, `answerTimelineQuery()`.
- `lib/intelligence-engine/delta-query-resolver.ts` — one new early-exit branch calling the above.
- `components/timeline/TimelineView.tsx`, `TimelineEntryCard.tsx` — the Timeline UI.
- `app/projects/[id]/timeline/page.tsx` — replaced "Coming Soon" with the real page.
- `components/project-shell/AppSidebar.tsx` — added "Timeline" nav item + routing.

Known issues:

- `getTimeline()` is unfiltered by `projectId` (see Implementation Notes) — acceptable while the app is effectively single-project; revisit once `Discussion.projectId` exists or multiple real projects are seeded.
- "Intelligence" is a real filter/category with nothing populating it yet — the Intelligence subscriber (Sprint 4.5) still performs no real work, so this category exists for forward-compatibility only, matching the brief's own "Approvals (future-compatible)" framing (which, unlike Intelligence, *is* already populated by Knowledge Draft Approved events).
- Full authenticated visual verification in a browser was not possible in this environment — same limitation every prior sprint documented.
- `RelationshipService.create()`/`.remove()` still aren't reachable from any live UI flow (a Sprint 4.0/4.5 carry-forward, unrelated to this sprint) — so `relationships` category has no live data source yet either, though the categorization/filtering logic is ready for when it does.

Follow-up work:

- Give the Intelligence subscriber real business logic (per `DIGA-CORE-ARCHITECTURE-V2.md`'s roadmap), which would start populating the "Intelligence" Timeline category with real data.
- Once `Discussion` gains a real `projectId`, switch `getTimeline()` back to project-scoped filtering.
- Consider whether `ProjectEvolutionStrip` should eventually be reimplemented on top of the Event Log rather than static `data/evolution.ts` — a separate, larger design decision this sprint deliberately did not make.

Modified files:

New: `lib/events/timeline-grouping.ts`, `lib/events/timeline-query.ts`, `components/timeline/TimelineView.tsx`, `components/timeline/TimelineEntryCard.tsx`.

Changed: `lib/events/timeline-projection.ts`, `app/projects/[id]/timeline/page.tsx`, `components/project-shell/AppSidebar.tsx`, `lib/intelligence-engine/delta-query-resolver.ts`.
