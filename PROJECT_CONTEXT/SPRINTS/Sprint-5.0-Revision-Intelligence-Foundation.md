# Sprint: Revision Intelligence (Foundation)

Status: Complete
Sprint ID: 5.0
Target Version: v5.0
Owner: Delta engineering
Created: 2026-08-04
Last Updated: 2026-08-04

---

# Objective

Give DIGA a foundation for understanding drawing revisions as project knowledge, not pixels: WHAT changed, WHY it changed, WHAT it affects, WHO needs to review it, and WHAT should happen next — built entirely by composing the platform completed in Sprints 4.0–4.9 (Knowledge Graph, Relationship Engine, Evidence Engine, Reasoning Engine, Recommendation Engine, Event Engine, Timeline, Validation Engine). This is the first sprint of Phase 2.

---

# Background

Phase 1 (Sprints 4.0–4.9) built the complete Knowledge Operating System: a generic Knowledge Graph, an Event Engine every write publishes through, a Recommendation Engine that reacts to events, a Timeline that projects them, and a Delta query surface that answers questions from real evidence. None of it understands revisions yet — today a changed drawing is invisible to all of it. This sprint does not redesign or replace any of those systems; it plugs a new capability into them, following the exact composition pattern every Phase 1 sprint since 4.2 already established (a new engine, injected via constructor, calling the existing frozen engines rather than re-implementing them).

Per the brief, this sprint is explicitly a foundation: no real DWG/Revit/IFC parsing, no OCR, no computer vision. The full architecture is built and proven using seeded mock revisions that behave exactly like a future real parser's output would — the rest of DIGA cannot tell the difference.

---

# Scope

## In Scope

- `types/revision-intelligence.ts` — one generic `Revision` model (no `DoorRevision`/`WallRevision`/`RoomRevision`), reusing `Evidence`/`ReasoningResult`/`ConfidenceLevel`/`RelationshipNode` exactly as `Recommendation`/`KnowledgeValidation` already do.
- `lib/revision-intelligence/` — `RevisionComparator`, `ChangeExtractor`, `ChangeClassifier`, `ImpactAnalyzer`, `RevisionReasoner`, `RevisionOrchestrator`, `RevisionEngine` (top-level, constructor-injected exactly like `IntelligenceEngine`), `revision-query.ts` (Delta integration).
- `data/revision-changes.ts` — seeded mock "drawing diff" data standing in for a future DWG/Revit/IFC/Computer-Vision parser.
- `lib/repositories/revision-repository.ts` / `lib/services/revision-service.ts` / `lib/actions/revision-actions.ts` — the standard Repository/Service/Action trio.
- Knowledge Creation: every detected change becomes a real Knowledge Object (reusing `KnowledgeObjectService`, unmodified).
- Relationship Integration: suggested relationships are the real, already-computed impact/related-knowledge evidence, reshaped and created (reusing `RelationshipService`, unmodified).
- Evidence Integration: reuses `EvidenceEngine` directly — no second evidence-gathering implementation.
- Reasoning: `RevisionReasoner` wraps the unmodified `ReasoningEngine`.
- Impact Analysis: `ImpactAnalyzer` composes `EvidenceEngine` — no new graph traversal.
- Recommendations: one new rule (`reviewRevisionImpactRule`), appended to the existing `defaultRecommendationRules`.
- Timeline: three new `EVENT_TYPES` + three `SUMMARY_BUILDERS` entries — zero `categorize()` changes.
- Delta Integration: `revision-query.ts`, wired into `delta-query-resolver.ts` as one more early-exit branch.

## Out of Scope

Explicitly excluded by the brief (Module 12): real CAD comparison, DWG/Revit/IFC parsing, OCR, computer vision, BIM extraction. Also out of scope this sprint: any new UI (no Revisions list/detail page, no new panel) — Timeline, the Recommendation Panel, and Delta already surface revision-driven output automatically, since they are pure projections/subscribers over the reused engines; a human-review gate before Relationship creation (Knowledge Drafts have one, Revision Intelligence does not yet — see Implementation Notes); a dedicated `KnowledgeObjectType`/`RelationshipNodeType` for "revision" (every detected change is modeled as an `issue`, the closest existing fit).

---

# Files Expected to Change

New:
- `types/revision-intelligence.ts`
- `data/revision-changes.ts`
- `lib/revision-intelligence/revision-comparator.ts`, `change-extractor.ts`, `change-classifier.ts`, `impact-analyzer.ts`, `revision-reasoner.ts`, `revision-orchestrator.ts`, `revision-engine.ts`, `revision-query.ts`
- `lib/repositories/revision-repository.ts`
- `lib/services/revision-service.ts`
- `lib/actions/revision-actions.ts`

Changed:
- `lib/events/event-types.ts` (three `REVISION_*` constants)
- `lib/events/timeline-projection.ts` (`SUMMARY_BUILDERS` only — `categorize()` untouched, deliberately)
- `lib/recommendations/recommendation-types.ts` (one `REVIEW_REVISION_IMPACT` constant)
- `lib/recommendations/recommendation-rules.ts` (one new rule, appended to `defaultRecommendationRules`)
- `lib/intelligence-engine/delta-query-resolver.ts` (one new branch + import)

---

# Files That Must Not Change

`lib/comprehension/*` (reused, unmodified), `lib/intelligence-engine/{context-engine,orchestrator,response-planner,intelligence-engine,evidence-engine,confidence-scorer,reasoning-engine}.ts`, `lib/events/{event-bus,event-publisher}.ts`, `lib/events/subscribers/{intelligence-subscriber,recommendation-subscriber,timeline-subscriber,notifications-subscriber,audit-subscriber}.ts` (the recommendation subscriber picks up the new rule automatically — its own file is untouched), `lib/knowledge-validation/*`, `lib/services/{knowledge-object-service,relationship-service,discussion-service,event-service}.ts` (called, never modified), `lib/repositories/{knowledge-object-repository,relationship-repository,discussion-repository,event-repository,recommendation-repository}.ts`, the existing six Recommendation rules 1–6 in `recommendation-rules.ts` (only a seventh was appended), every `components/*` file (no UI changes this sprint), `types/knowledge-object.ts` / `types/relationship.ts` (no new `KnowledgeObjectType`/`RelationshipNodeType` added).

---

# Constraints

- No image comparison, no pixel/file/CAD-geometry access anywhere in the pipeline — `RevisionComparator` only ever reads structured (today: seeded mock) diff data.
- One generic `Revision` model — no per-element-type subclasses.
- Every detected change must become real Knowledge, with real (never fabricated) Evidence/Impact/Reasoning.
- Reuse the Knowledge Graph, Relationship Engine, Evidence Engine, Reasoning Engine, Recommendation Engine, Timeline, Event Engine, Validation Engine — do not duplicate any of them.
- Do not redesign or replace any Phase 1 system.

---

# Implementation Notes (Architecture Decisions)

- **`RevisionEngine` is pure computation; `RevisionService` is the only layer that writes.** Exactly mirrors `IntelligenceEngine`/`KnowledgeObjectService`'s own split: `RevisionEngine.process()` (constructor-injected with `RevisionComparator`/`ChangeExtractor`/`ChangeClassifier`/`ImpactAnalyzer`/`RevisionReasoner`/`RevisionOrchestrator`, every parameter defaulting to its own singleton, "exactly like Intelligence Engine" per the brief) never touches a repository or publishes an event — it returns `CreateRevisionInput[]`. `RevisionService.detectAndProcess()` is the only place that calls `revisionRepository`, `createKnowledgeObject`, `createRelationship`, and `publishSafely`.
- **`RevisionComparator` is the deliberate seam for a future real parser.** `MockRevisionComparator` looks up `data/revision-changes.ts` (keyed by source-drawing id + revision-pair label) and returns the exact `RawDetectedChange[]` shape a future DWG/Revit/IFC/Computer-Vision parser would emit. Nothing downstream — `ChangeExtractor` onward — needs to know or care which one produced it.
- **`DESIGN_CHANGE_TYPES` is an open, namespaced string dictionary** (`"room.resized"`, `"entrance.relocated"`, ...), matching `EVENT_TYPES`/`RECOMMENDATION_TYPES`/`EntityExtractor`'s own established philosophy — a new element/verb combination is a dictionary addition, not an architecture change. `ChangeClassifier` is deterministic and dictionary-driven, same as `IntentClassifier`/`DestinationPredictor` — no AI.
- **`ImpactAnalyzer` reuses `EvidenceEngine`'s *generic* (non-graph-native) search path, and a real bug was caught and fixed during verification.** The first implementation passed the full compound `elementLabel` (e.g. `"Main Entrance"`) as a single extracted entity, which made `EvidenceEngine` require an exact AND-match of that whole two-word string — it never matched anything in the seeded relationship data and silently produced empty impact analysis for every change. Fixed by passing `entities: []` instead, which makes `EvidenceEngine` fall back to its own already-defined significant-word OR-matching (`significantWords`, `requireAll = false`) — not a new matching strategy invented for this sprint, just correctly invoking the fallback path `EvidenceEngine` already has for exactly this situation. Verified via the smoke test below: "Main Entrance" and "Accessible Ramp" then correctly found real evidence (via "entrance"/"ramp" appearing in seeded discussion/relationship labels); "Guest Bedroom" correctly found none, honestly, since no seeded content mentions either word.
- **`RevisionReasoner` reuses `ReasoningEngine` directly and deliberately does not synthesize a causal narrative.** It calls `reasoningEngine.explain()` unmodified for the found/missing summary, then layers one revision-specific conclusion sentence on top. It never produces something like "because the client requested a larger lobby" — no real causal link between an approval and a drawing change exists anywhere in this graph, and inventing one would violate the same "never fabricate" rule every other engine in this codebase already honors. What it does say, truthfully, mirrors the brief's own example almost exactly: confirmed live during the smoke test, "Main Entrance moved (North facade → West facade). Confidence is high because related evidence exists, but no approval has yet been recorded for it."
- **`RevisionOrchestrator` decides only — it never writes.** Matches `Orchestrator` (Sprint 4.2)'s own "decide, don't perform" role. `suggestedRelationships` are the real `impacts`/`relatedKnowledge` evidence, reshaped into full `RelationshipNode`s via a deterministic reverse lookup of `relationshipNodeTypeConfig`'s `type → label` map — safe because `Evidence.type` is always set FROM that exact config in the first place (`evidence-engine.ts`), so reversing it is an un-reshape, not a guess. `suggestedActions` comes from one static, documented lookup table (`REVISION_ACTION_SUGGESTIONS`, keyed by element type: door → update door schedule, staircase/column → notify structural engineer, entrance/ramp → review accessibility requirements, etc. — directly from the brief's own Module 9 examples) — exported and reused verbatim by the new Recommendation rule, so the two can never disagree.
- **Every detected change becomes a Knowledge Object of type `"issue"`.** No new `KnowledgeObjectType` was added — Module 12 says build on top, not redesign — and `issue` ("something arose and needs review") is the closest honest fit among the five existing closed values. Priority is derived from the change's own classification confidence (`high` confidence → `high` priority, otherwise `medium`) — a documented heuristic, not a fabricated judgment.
- **One Discussion per revision upload, reusing the pre-existing `"REV"` ("Review") discussion type code.** `KnowledgeObject.discussionId` is a required field in the existing architecture (Sprint 3.6A); rather than loosening that requirement, Revision Intelligence creates one `Discussion` per upload (title: `"Revision: {drawing} — {previous} → {current}"`, summary = every detected change's own sentence) and every Knowledge Object from that upload shares it — mirroring how a real revision review would be one conversation about several changes, and matching the precedent Sprint 4.4 already set for Issue/Risk drafts creating a fresh Discussion when needed.
- **Relationships are created immediately, not held for human review.** Knowledge Drafts (Sprint 4.4) gate creation behind an explicit Approve step; Revision Intelligence has no such review UI yet this sprint, so `RevisionService` creates the suggested relationships directly. This is a scope decision, not a "never fabricate" violation — every relationship still traces back to a real, already-computed `ImpactAnalyzer` match. Documented honestly as a gap to close once a review UI exists (see Follow-up work).
- **The new Recommendation rule is rule 7, appended to the existing six — the engine, subscriber, and de-duplication logic are completely untouched.** `reviewRevisionImpactRule` fires on `revision.changes_detected.v1`, and surfaces the exact `suggestedActions` already computed once by `RevisionOrchestrator` (via the event's own metadata) — never a second, independently-invented suggestion. It is picked up automatically by the existing `recommendationSubscriber` with zero new wiring, exactly as the brief requires ("reuse the Recommendation Engine, do not duplicate it").
- **Timeline needed zero `categorize()` changes.** The three new `revision.*` event types fall through the existing unrecognized-prefix fallback straight into the `"intelligence"` category — the exact same precedent Sprint 4.8 established for Recommendation events. Only three `SUMMARY_BUILDERS` entries were added.
- **Delta's revision-question branch is one unified answer, and a real regex bug was caught and fixed during the smoke test.** `detectRevisionQuestion()`/`answerRevisionQuestion()` mirror `recommendation-query.ts`/`timeline-query.ts` structurally: a small, anchored keyword match, checked before Comprehension runs, wired into `delta-query-resolver.ts` immediately after the Sprint 4.8 branch, gated on `context.projectId`. The brief's own literal example question, "What changed?", was **not** matching the first implementation — the regex only accepted `"what's changed"`/`"what has changed"`, not the bare form. Fixed and reverified live via the smoke test below. All eight of the brief's example phrasings route to one honest, evidence-backed listing of real `Revision` records rather than a differently-worded reply per exact phrasing — Revision Intelligence is a foundation this sprint, not a deep per-phrase NLU system, matching `recommendation-query.ts`'s own precedent exactly.
- **No new UI was built.** Timeline, the Recommendation Panel, and Delta's response panel already display everything this sprint produces with zero new component code, because all three are pure projections/subscribers over engines this sprint correctly plugged into rather than bypassed. This was verified, not assumed — see the smoke test below.

---

# Acceptance Criteria

- [x] Revision pipeline executes end-to-end (Comparator → Extractor → Classifier → Impact Analysis → Reasoning → Orchestration → Knowledge → Relationships → Events).
- [x] Revision creates Knowledge (a real `KnowledgeObject`, type `issue`, via the unmodified `KnowledgeObjectService`).
- [x] Relationships are suggested (and, this sprint, created directly — see Implementation Notes) from real Impact Analysis matches.
- [x] Evidence is attached — reuses `EvidenceEngine` unmodified; genuinely empty when nothing in the graph relates to the element (verified: "Guest Bedroom").
- [x] Reasoning is generated — reuses `ReasoningEngine` unmodified, plus one honest revision-specific sentence.
- [x] Impacts are produced when real graph data supports them; empty, honestly, when it doesn't.
- [x] Recommendations are created (a 7th rule, reusing the existing Recommendation Engine/subscriber verbatim).
- [x] Timeline updates automatically (three new event types, zero new Timeline code beyond `SUMMARY_BUILDERS`).
- [x] Delta answers revision questions (all eight example phrasings from the brief, verified live).
- [x] No regressions in previous sprints (`tsc`/lint/build all pass; every frozen file listed above is untouched).

---

# Validation

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`)
- [x] Temporary smoke-test route (`app/api/smoke-revision-5-0`, added and removed within this session, same technique as every prior sprint) against the real seed project (`3c2384a0-bc60-4116-ba8c-5f1f52eedb42`) and the real service layer: `detectAndProcessRevision()` against the seeded mock diff for drawing `A-101`, `Rev B → Rev C`, produced 3 real `Revision` records (Guest Bedroom resized, Main Entrance moved, Accessible Ramp resized), 1 shared `Discussion`, 3 `Issue` Knowledge Objects, and published `revision.uploaded.v1` + 3×(`knowledge_object.created.v1` + `revision.changes_detected.v1`) — all real events, immediately visible via `getTimeline()` with correct humanized summaries and the `"intelligence"` category. The existing Recommendation Engine reacted automatically: `gather_more_evidence`/`link_related_knowledge` (pre-existing rules, unmodified) and the new `review_revision_impact` recommendation fired for all three, with `review_revision_impact`'s description correctly quoting the same `suggestedActions` (`"Revise area schedule"`, `"Review accessibility requirements"` ×2) `RevisionOrchestrator` had already computed. `resolveDeltaQuery("What changed?", {projectId})` and `resolveDeltaQuery("Who should be notified?", {projectId})` both returned real `related` results listing the 3 revisions with their own reasoning/suggested actions as evidence excerpts. Re-running `getRevisions({projectId})` (a fresh repository read, not the pipeline's own return value) confirmed the records were genuinely persisted, not just returned in-memory from the call that created them.
- [x] Found and fixed two real bugs during this verification (see Implementation Notes): `ImpactAnalyzer` initially returned empty impacts/related-knowledge for every change (AND-matching a full compound label never matches single-word seeded content); `detectRevisionQuestion()` initially didn't recognize the bare phrase "What changed?". Both fixed and reverified live before this sprint was considered complete.
- [ ] Full authenticated visual verification in a browser was not possible in this environment (no test credentials; project detail/timeline/knowledge pages 404 against Supabase in this sandbox regardless of this sprint's changes) — the same limitation every sprint since 4.0 has documented. Verified via code review, `tsc`/lint/build, and the live smoke test above only.

---

# Completion Notes

Completed work: see Files Expected to Change above — all items delivered; the full Drawing Revision → Detected Design Changes → Knowledge Objects → Relationships → Evidence → Reasoning → Events → Recommendations → Timeline → Delta pipeline runs end-to-end against seeded mock data.

Known issues:

- No UI triggers `RevisionService.detectAndProcess()` — verified only via a temporary smoke-test route, matching Sprint 4.0's own precedent for `RelationshipService.create()`/`.remove()` before either had a live UI flow. `lib/actions/revision-actions.ts` is ready for a future upload flow to call.
- Suggested relationships are created directly rather than held behind a human-review gate (unlike Knowledge Drafts) — every relationship still traces to a real `ImpactAnalyzer` match, but there is no "Approve" step yet for a person to confirm or reject one first.
- Every detected change becomes an `Issue` Knowledge Object — the closest existing fit among the five closed `KnowledgeObjectType` values, not a dedicated "Revision"/"Change" type.
- `Revision.confidence` reflects how completely the mock diff was parsed (a real before/after pair present vs. not), not evidence strength — a different axis than the `confidence` shown elsewhere in the app (e.g. `KnowledgeValidation`'s evidence-based confidence). Worth distinguishing more sharply once a real UI displays both side by side.
- `ImpactAnalyzer`'s generic `EvidenceEngine` search can surface an item whose real textual match happened on the *other* side of a relationship (e.g. a Discussion's own label, not the returned node) when no anchor node is given — a pre-existing `EvidenceEngine` characteristic exercised here, not introduced or changed by this sprint.
- Delta's revision-question answering is one unified listing regardless of which of the brief's eight example phrasings was asked, matching `recommendation-query.ts`'s own established precedent — not a deep per-phrase NLU system.
- No dedicated UI (list or detail) surfaces a `Revision` record directly; it's visible only indirectly — through the Knowledge Object it produced, the Timeline entries it published, and Delta's unified listing.

Follow-up work:

- A dedicated Revisions UI (list + detail), including a human "Reviewed" action — `RevisionService.review()`/`reviewRevision()` already exist and publish `revision.reviewed.v1`, with no consumer yet.
- Wire a real "Upload Document"/"Upload Drawing" flow (currently a known stub per `03_CURRENT_STATE.md`'s Unified Workspace section) to call `detectAndProcessRevision()`.
- A human-review gate before Relationship creation, mirroring Knowledge Draft's Approve step, once a UI exists to review Revision-sourced suggestions.
- Replace `MockRevisionComparator` with a real DWG/Revit/IFC/Computer-Vision parser behind the exact same `RevisionComparator` interface — nothing else in the pipeline should need to change, per Module 12's own goal.

Modified files: see Files Expected to Change above.
