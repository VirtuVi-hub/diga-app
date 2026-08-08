# Sprint: Project Intelligence Gateway (Foundation)

Status: Complete
Sprint ID: 5.2
Target Version: v5.2
Owner: Delta engineering
Created: 2026-08-04
Last Updated: 2026-08-04

---

# Objective

Establish one unified entry point for every future knowledge source, so Meeting, Document, Photo, Voice, and BIM Intelligence can plug into DIGA later without architectural changes — and so the user never has to choose which engine handles their input. This is the final major platform capability before more intelligence modules are added, and the third sprint of Phase 2.

---

# Background

DIGA now has three intelligence capabilities that each understand one kind of input: Journal Intelligence (free text, Sprints 4.1–4.4), Drawing Intelligence (a drawing sheet, Sprint 5.1), and Revision Intelligence (a drawing revision, Sprint 5.0). Each was built and wired into Delta/Timeline/Recommendations independently. Nothing decided, generically, which one a given input should go to — that decision lived implicitly in whichever code path happened to call it (the Journal input router, a direct `ingestDrawing()` call, a direct `detectAndProcessRevision()` call). This sprint builds that missing decision layer: a Gateway that identifies a source, routes it to the correct already-existing engine, coordinates the call, and tracks what happened — and, critically, never becomes a fourth place that understands drawings, revisions, or text. It only ever calls out to the three engines that already do.

---

# Scope

## In Scope

- `types/project-intelligence-gateway.ts` — one generic `Source` model (Module 2), supporting drawing/document/meeting/photo/video/voice/email/chat/spreadsheet/presentation/specification/schedule/site_report as an open dictionary.
- `lib/project-intelligence-gateway/` — `SourceClassifier`, `CapabilityRouter` (+ the `IntelligenceCapability` registration interface), `GatewayOrchestrator`, `ProcessingCoordinator`, `ProcessingTracker`, top-level `ProjectIntelligenceGateway`, `gateway-dashboard.ts` (Module 7 projection), `gateway-query.ts` (Module 8 Delta integration).
- `lib/project-intelligence-gateway/capabilities/` — three adapters (`drawing-intelligence-capability.ts`, `revision-intelligence-capability.ts`, `journal-intelligence-capability.ts`), each a thin translation layer calling the unmodified `DrawingService`/`RevisionService`/`deltaComprehensionService`.
- `lib/repositories/source-repository.ts` / `lib/services/source-service.ts` / `lib/actions/gateway-actions.ts` — the standard trio.
- `data/sources.ts` — nine realistic seeded sources (Module 9): an architectural drawing, a client brief, a meeting transcript, a specification, site photographs, a BOQ, an email, a WhatsApp conversation, and site visit notes.
- Processing State/History (Module 5/6): a generic `ProcessingState` lifecycle, an append-only `processingHistory`, and six new lifecycle Events reusing the unmodified Event Engine.
- Delta Integration (Module 8): `gateway-query.ts`, wired into `delta-query-resolver.ts` as one more early-exit branch.

## Out of Scope

Explicitly forbidden by the brief: Meeting Intelligence, Document Intelligence, OCR, Speech-to-Text, PDF parsing. Also out of scope: any Gateway Dashboard UI (Module 7 is a projection only, exactly like `TimelineProjection` was before Sprint 4.6 built a page over it); a real background-job/queue system (the `"queued"` `ProcessingState` exists in the type for forward compatibility only, never reached — this sprint's pipeline is synchronous and in-process, matching every other engine in this codebase); any change to how Journal Intelligence, Drawing Intelligence, or Revision Intelligence work internally (the Gateway only ever calls their existing, unmodified entry points).

---

# Files Expected to Change

New:
- `types/project-intelligence-gateway.ts`
- `data/sources.ts`
- `lib/project-intelligence-gateway/source-classifier.ts`, `capability-router.ts`, `gateway-orchestrator.ts`, `processing-coordinator.ts`, `processing-tracker.ts`, `project-intelligence-gateway.ts`, `gateway-dashboard.ts`, `gateway-query.ts`
- `lib/project-intelligence-gateway/capabilities/drawing-intelligence-capability.ts`, `revision-intelligence-capability.ts`, `journal-intelligence-capability.ts`
- `lib/repositories/source-repository.ts`
- `lib/services/source-service.ts`
- `lib/actions/gateway-actions.ts`

Changed:
- `data/drawing-uploads.ts` (one new seeded raw sheet, `drawing-a-105` — Roof Plan, the Module 9 "architectural drawing" source)
- `lib/drawing-intelligence/drawing-classifier.ts` (one-line dictionary fix — see Implementation Notes)
- `lib/events/event-types.ts` (six new `SOURCE_*` constants)
- `lib/events/timeline-projection.ts` (`SUMMARY_BUILDERS` only — `categorize()` untouched, deliberately, same precedent as Sprints 5.0/5.1)
- `lib/intelligence-engine/delta-query-resolver.ts` (one new branch + import)

---

# Files That Must Not Change

Everything Sprint 5.0/5.1's own lists already cover, plus: `lib/drawing-intelligence/{drawing-intelligence-engine,drawing-parser,sheet-analyzer,title-block-extractor,view-extractor,annotation-extractor,drawing-reasoner,drawing-orchestrator}.ts`, `lib/services/drawing-service.ts`, `lib/repositories/drawing-repository.ts` (all called only through `DrawingService.ingest()`, via the capability adapter — never modified, never called into more deeply than that), `lib/revision-intelligence/*` and `lib/services/revision-service.ts` (called only through `RevisionService.detectAndProcess()`), `lib/comprehension/*` (called only through `deltaComprehensionService.comprehend()`), `types/relationship.ts` (no new `RelationshipNodeType` for `"source"` — see Implementation Notes), `data/drawings.ts`, `data/relationships.ts`, `data/knowledge-objects.ts` (Sprint 5.1's seed data untouched).

---

# Constraints

- The Gateway must never become a God Object: it identifies, routes, coordinates, and tracks — it never performs domain intelligence itself. Every actual understanding of a source's content still lives entirely inside the capability that claims it.
- Future engines must register themselves with the Gateway (implement `IntelligenceCapability`, append to `defaultGatewayCapabilities`) rather than the Gateway being modified per new engine.
- Reuse the Knowledge Graph, Relationship Engine, Revision Intelligence, Drawing Intelligence, Recommendation Engine, Timeline, Event Engine — do not duplicate any of them.
- Do not build a second Delta pipeline.

---

# Implementation Notes (Architecture Decisions)

- **`ProjectIntelligenceGateway` is the one deliberate exception to the "Engine is pure computation, Service performs writes" precedent Revision/Drawing Intelligence established — and this is explained, not glossed over.** "Coordinate" and "Track" are two of the Gateway's own four explicit responsibilities; coordinating necessarily means invoking a capability that writes to the Knowledge Graph, and tracking necessarily means persisting the `Source` record's state as it moves through the pipeline. This mirrors `RecommendationEngine` (Sprint 4.8) — which also legitimately owns real persistence (`recommendationRepository.create()`) as its core job — far more closely than it mirrors `IntelligenceEngine`/`RevisionEngine`/`DrawingIntelligenceEngine`. `SourceService` still exists as a thin pass-through (matching the "Action → Service → Repository" layering every domain uses for reads), but its one write method, `ingest()`, defers entirely to `projectIntelligenceGateway.ingest()` — the same "Service defers to the Engine for the one thing the Engine legitimately owns" shape `RecommendationService` already established.
- **Capability registration is a real registry, not an if/else chain.** `IntelligenceCapability` (`canHandle(source): boolean`, `process(source): Promise<ProcessingOutcome>`) is implemented by three adapters, each a thin translation layer with zero domain logic of its own — `drawing-intelligence-capability.ts` maps `Source.metadata` onto `DrawingUploadInput` and calls `DrawingService.ingest()`; `revision-intelligence-capability.ts` maps onto `DetectRevisionInput` and calls `RevisionService.detectAndProcess()`; `journal-intelligence-capability.ts` calls `deltaComprehensionService.comprehend()`. Both `CapabilityRouter` and `ProcessingCoordinator` are constructor-injected with the same `defaultGatewayCapabilities` array (`capability-router.ts`) — adding Meeting/Document/Photo/Voice/BIM Intelligence later is one new adapter file plus one array append; `CapabilityRouter`/`ProcessingCoordinator`/`ProjectIntelligenceGateway` itself never change. This is Module 10's "future engines must register themselves" requirement made structurally true, not just documented as an aspiration.
- **Revision Intelligence is checked before Drawing Intelligence** in `defaultGatewayCapabilities`'s registration order — a `"drawing"`-typed source carrying `previousRevisionLabel` in its metadata is more specifically a revision than a first-time upload, and `RevisionIntelligenceCapability.canHandle()` checks for that field. This is the same "more specific rule first, order encodes priority" convention `IntentClassifier`/`DrawingClassifier` already use, applied to capability registration instead of classification.
- **Journal Intelligence's capability adapter deliberately never bypasses the human-approval gate Knowledge Capture (Sprint 4.4) already has.** It calls only `deltaComprehensionService.comprehend()` (classification), never the Knowledge Capture Engine's draft-creation flow — and always reports `needsReview: true`, regardless of how confident the comprehension was. `ProcessingOutcome.needsReview` was added as a field distinct from `success` specifically for this: a Journal-routed source can be *correctly and completely classified* (`success: true`) while still never being *auto-completed*, because writing an actual Requirement/Decision/Action/Issue/Risk to the Knowledge Graph from Journal text has required a human Approve click since Sprint 4.4, and the Gateway has no business overriding that on a source's behalf.
- **A `Source` is deliberately NOT a `RelationshipNodeType`.** It is a processing record *about* an input, not domain knowledge itself — the real graph nodes (a `Drawing`, the Knowledge Objects a Revision produces) are still created entirely by whichever capability handled it, exactly as before this sprint. Adding `"source"` to `types/relationship.ts`'s closed union was considered and rejected as unnecessary scope; a `Source`'s connection to the real work it produced is recorded in its own `outcomeSummary`/`detail` fields (e.g. `detail.drawingId`, `detail.revisionIds`) instead.
- **A real bug in Sprint 5.1's `DrawingClassifier` was caught and fixed by this sprint's own end-to-end verification, not assumed away.** Ingesting the Module 9 "architectural drawing" source (`drawing-a-105`, sheet title "Roof Plan") through the live Gateway revealed that `DrawingClassifier`'s dictionary had no rule matching "roof plan" — every prior sprint's own test data happened to avoid that exact phrase — so it silently fell back to `general_arrangement` with low confidence. Fixed with a one-line addition (`floor plan|roof plan` → `FLOOR_PLAN`, since Sprint 5.1's own View Intelligence examples already treat a roof plan as a plan-type view). This is exactly the kind of gap a real, generic entry point is supposed to surface — a purpose-built test never would have tried an input its own author didn't anticipate.
- **`GatewayDashboard` (Module 7) and `gateway-query.ts` (Module 8) both compute live from `Source[]`, never a cached/stored aggregate** — the same "always compute live" precedent `TimelineProjection`/`KnowledgeValidationEngine.assemble()`/`DrawingService.analyze()` all already established.
- **Delta's five Gateway questions are answered as five genuinely different dashboard slices, not one unified listing** — a deliberate departure from Drawing/Revision Intelligence's own "one unified answer" precedent. The brief's five example questions (recently uploaded / currently processing / drawings analyzed / failed / latest-upload's knowledge) map onto genuinely different, cheap-to-compute subsets of the same `GatewayDashboard`, so answering each with its own real subset is both more honest and no more complex — closer to `timeline-query.ts`'s own multi-kind precedent (Sprint 4.6) than to `revision-query.ts`'s single-listing one.
- **`data/sources.ts`'s nine seeded records are deliberately NOT all marked `"completed"`.** Seven of the nine (client brief, meeting transcript, specification, site photos, BOQ, email, site visit notes) correctly sit at `"needs_review"`, because Meeting/Document/Photo Intelligence genuinely do not exist yet — this is Module 10's "future engines must register themselves" claim demonstrated by its own honest absence, not asserted. The architectural drawing and the WhatsApp conversation are deliberately left at `"received"`/`"classified"` rather than a hand-guessed outcome, since actually running them live (in this sprint's own verification) is the honest way to know what happens next, not a fabricated one — see Validation below.

---

# Acceptance Criteria

- [x] Sources are classified correctly (`SourceClassifier`'s filename-keyword dictionary, verified against all nine seeded filenames by hand and three live submissions).
- [x] Sources are routed correctly (Revision Intelligence claims revision-flagged drawings before Drawing Intelligence claims plain ones; Journal Intelligence claims chat; everything else honestly lands in "no capability registered yet").
- [x] Existing Drawing Intelligence still works (verified live, through the Gateway, ingesting `drawing-a-105`).
- [x] Existing Revision Intelligence still works (verified live, through the Gateway, against `drawing-a-101`'s Rev B → Rev C).
- [x] Events are published (all six new `SOURCE_*` types, verified on the Timeline).
- [x] Timeline updates correctly (zero `categorize()` changes).
- [x] Delta answers Gateway questions (all five example phrasings verified live, each returning its own correct real subset).
- [x] No regressions (`tsc`/lint/build all pass; Recommendation count and behavior unaffected; Drawing/Revision Intelligence produced identical real output whether called directly, as in Sprints 5.0/5.1's own smoke tests, or through the Gateway).

---

# Validation

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`)
- [x] Restarted the development server cleanly (stopped the existing process on port 3000, cleared a stale `.next` build cache left over from the temporary smoke-test route, started fresh) — compiled with zero errors, only the pre-existing "slow filesystem" informational notice.
- [x] Temporary smoke-test route (`app/api/smoke-gateway-5-2`, added and removed within this session, same technique as Sprints 5.0/5.1) against the real seed project and the real service layer: the 9 seeded sources and the pre-computed dashboard counts (`needs_review: 7`) matched what `SourceClassifier`/`GatewayOrchestrator` deterministically produce; ingesting `drawing-a-105` through `ingestSource()` correctly routed to `drawing_intelligence`, reached `"completed"`, and created a real `Drawing` record (confirmed via `getDrawing()`); submitting a revision for `drawing-a-101` (Rev B → Rev C) correctly routed to `revision_intelligence` (not `drawing_intelligence`, proving the registration-order fix), reached `"completed"`, and detected the same 3 real design changes Sprint 5.0's own seed data describes; a chat source with obligation-shaped text correctly routed to `journal_intelligence`, correctly reached `"needs_review"` (never `"completed"` — the human-approval gate held); an unrecognizable filename correctly landed in `"needs_review"` with the exact "no registered capability" rationale; the Timeline showed all six new event types with correct humanized summaries; exactly 9 Recommendations existed afterward (identical to Sprint 5.1's own count for the same revision data), confirming zero regression; all five Delta Gateway questions returned distinct, correct real subsets — "What is currently processing?" correctly listed the two seeded-but-not-yet-advanced sources (the static `drawing-a-105`/WhatsApp seeds, distinct from their live-processed namesakes with different source ids), and "Which drawings have been analysed?" correctly listed both the completed Drawing-Intelligence and Revision-Intelligence outcomes.
- [x] Found and fixed two real issues during this verification (see Implementation Notes): `SourceClassifier`'s own drawing-keyword regex didn't match "roof plan" (fixed before it ever ran); `DrawingClassifier` (Sprint 5.1, a file this sprint must not modify without cause) had the same gap, only discovered because the Gateway's own end-to-end test tried an input Sprint 5.1's test never had — fixed with one line, reverified live.
- [ ] Full authenticated visual verification in a browser was not possible in this environment (no test credentials; `/projects/[id]` intermittently 404s against Supabase in this sandbox depending on request timing, unrelated to this sprint's changes and observed identically before any Sprint 5.2 code existed) — the same limitation every sprint since 4.0 has documented.

---

# Completion Notes

Completed work: see Files Expected to Change above — all items delivered; every future knowledge source now has one real entry point, and Journal/Drawing/Revision Intelligence all continue working identically whether invoked directly or through it.

Known issues:

- No UI triggers `ingestSource()` — verified only via a temporary smoke-test route, matching Sprint 5.0/5.1's own precedent before either had a live UI flow. `lib/actions/gateway-actions.ts` is ready for a future upload flow to call.
- The Gateway Dashboard (Module 7) has no UI — it is a pure projection, proven queryable end-to-end (`getGatewayDashboard()`), matching `TimelineProjection`'s own pre-Sprint-4.6 state.
- `"queued"` (`ProcessingState`) is never reached — there is no background-job/queue system in this codebase, and this sprint does not add one. The value exists for forward compatibility only.
- A drawing-typed `Source` that completed via Revision Intelligence (rather than Drawing Intelligence) still shows up under Delta's "which drawings have been analysed" answer, since that filter only checks `sourceType === "drawing" && processingState === "completed"`, not which specific capability handled it. Honest, not wrong, but slightly imprecise — worth a `capabilityId`-aware refinement if this becomes a real UI feature.
- The two seeded-but-not-yet-advanced sources (`source-drawing-a-105`, `source-whatsapp-ramp-width`) share filenames with their live-processed, differently-id'd counterparts created during this sprint's own verification — intentional (the same real underlying drawing/conversation, submitted twice: once as an honest "not yet processed" placeholder, once as live proof), but worth knowing if something lists sources by filename rather than id.
- Delta's Gateway-question matching is on raw, untranslated text, the same tradeoff every prior Delta-integration branch (recommendation/revision/drawing) has already made.

Follow-up work:

- A real Gateway Dashboard UI, and a real upload flow that calls `ingestSource()` — everything both need already exists in `lib/actions/gateway-actions.ts`.
- Meeting Intelligence, Document Intelligence, Photo Intelligence, Voice Intelligence, and BIM Intelligence — each is now exactly one new `IntelligenceCapability` adapter plus one array append in `capability-router.ts`, per this sprint's own goal.
- A `capabilityId`-aware refinement to `gateway-query.ts`'s "which drawings have been analysed" answer, once it matters to a real user rather than a smoke test.

Modified files: see Files Expected to Change above.
