# Sprint: Drawing Intelligence (Foundation)

Status: Complete
Sprint ID: 5.1
Target Version: v5.1
Owner: Delta engineering
Created: 2026-08-04
Last Updated: 2026-08-04

---

# Objective

Teach DIGA to understand architectural drawings as project knowledge — not pixels, not PDFs. Build a generic Drawing Intelligence capability where input format is irrelevant, so future inputs (DWG, DXF, IFC, Revit, images, CAD APIs) can plug into the exact same pipeline without architectural changes. This is the first real-world intelligence capability, and the second sprint of Phase 2.

---

# Background

Sprint 5.0 gave DIGA a foundation for understanding drawing *revisions* (what changed between two versions of a sheet). Sprint 5.1 is one layer beneath that: understanding a drawing *sheet itself* — its type, its title block, its views, its annotations — as a first-class, queryable part of the Knowledge Graph. `"drawing"` has been a valid `RelationshipNodeType` since Sprint 4.0, but until this sprint nothing ever gave a drawing a real, structured record; it only ever existed as a denormalized label on someone else's `Relationship`. This sprint builds that missing record and the pipeline that produces it, explicitly generic across input formats: the brief is clear this must not become "PDF Intelligence" — PDF is simply the first supported format, exercised only through seeded mock data, never a real PDF-parsing library.

---

# Scope

## In Scope

- `types/drawing-intelligence.ts` — one generic `Drawing` model (no `PdfDrawing`/`DwgDrawing`), reusing `Evidence`/`ReasoningResult`/`ConfidenceLevel`/`RelationshipNode` exactly as `Recommendation`/`Revision` already do.
- `lib/drawing-intelligence/` — `DrawingParser`, `DrawingClassifier`, `SheetAnalyzer`, `TitleBlockExtractor`, `ViewExtractor`, `AnnotationExtractor`, `DrawingReasoner`, `DrawingOrchestrator`, top-level `DrawingIntelligenceEngine` (constructor-injected exactly like `IntelligenceEngine`/`RevisionEngine`), and `drawing-query.ts` (Delta integration).
- `data/drawings.ts` — eight realistic, believable seeded drawings (Module 3): Site Plan, Ground Floor Plan, Canopy Detail, First Floor Plan, North Elevation, Section A-A, Door Schedule, Room Schedule.
- `data/drawing-uploads.ts` — seeded mock "parsed drawing" data standing in for a future real parser, mirroring the eight seeded drawings 1:1 plus one genuinely new sheet used to exercise the live pipeline.
- `lib/repositories/drawing-repository.ts` / `lib/services/drawing-service.ts` / `lib/actions/drawing-actions.ts` — the standard trio.
- Knowledge Integration: a Drawing is a real `"drawing"`-type Relationship Graph node (not wrapped in a Knowledge Object — see Implementation Notes for why).
- Relationship Integration: suggested relationships reuse the same "evidence, reshaped" pattern Sprint 5.0/4.4 established, plus a coherent, hand-connected seeded story (schedules/elevations/sections referencing the plan they were derived from).
- Revision Integration: `DrawingService.getRevisionSummary()` composes the unmodified `RevisionService` (Sprint 5.0) live — no duplicated revision storage.
- Delta Integration: `drawing-query.ts`, wired into `delta-query-resolver.ts` as one more early-exit branch.
- Module 12 (Seed a Complete Story): a real Decision Knowledge Object (`decision-canopy-material`) upgrades a node that previously only existed as a denormalized relationship label, completing Requirement → Discussion → Decision → Drawing → Revision → Knowledge → Relationships → Recommendations → Timeline → Delta using the project's *existing* seed threads rather than a disconnected new one.
- A small, precedented refactor: `relationshipNodeFromEvidence()` extracted from `revision-orchestrator.ts` into `lib/relationship-utils.ts`, since `drawing-orchestrator.ts` needed the exact same reshape (mirrors the `nodeHref()`/`suggestReviewers()` extraction precedent, Sprint 4.8).

## Out of Scope

Explicitly excluded by the brief: real PDF/DWG/DXF/IFC/Revit parsing, OCR, computer vision, geometry detection of any kind (views and annotations are represented structurally only — label and type, never a coordinate or boundary). Also out of scope this sprint: any new UI (no Drawings list/detail page); a dedicated `RelationshipNodeType` for "view" (views are represented as a structural array on the `Drawing` record itself, not a separate graph node — see Implementation Notes); new Recommendation rules (none were needed — existing rules already react correctly to Drawing-touching relationships, verified, not assumed).

---

# Files Expected to Change

New:
- `types/drawing-intelligence.ts`
- `data/drawings.ts`, `data/drawing-uploads.ts`
- `lib/drawing-intelligence/drawing-parser.ts`, `drawing-classifier.ts`, `sheet-analyzer.ts`, `title-block-extractor.ts`, `view-extractor.ts`, `annotation-extractor.ts`, `drawing-reasoner.ts`, `drawing-orchestrator.ts`, `drawing-intelligence-engine.ts`, `drawing-query.ts`
- `lib/repositories/drawing-repository.ts`
- `lib/services/drawing-service.ts`
- `lib/actions/drawing-actions.ts`

Changed:
- `lib/relationship-utils.ts` (new `relationshipNodeFromEvidence()`, extracted — behavior-preserving)
- `lib/revision-intelligence/revision-orchestrator.ts` (calls the extracted helper instead of its own local copy — behavior-preserving)
- `data/knowledge-objects.ts` (one new seeded Decision, `decision-canopy-material`)
- `data/relationships.ts` (new drawing node constants + relationships connecting the seeded drawing set)
- `lib/events/event-types.ts` (two `DRAWING_*` constants)
- `lib/events/timeline-projection.ts` (`SUMMARY_BUILDERS` only — `categorize()` untouched, deliberately, same precedent as Sprint 5.0/4.8)
- `lib/intelligence-engine/delta-query-resolver.ts` (one new branch + import)

---

# Files That Must Not Change

Everything Sprint 5.0's own "must not change" list already covers, plus: `lib/revision-intelligence/{revision-engine,revision-comparator,change-extractor,change-classifier,impact-analyzer,revision-reasoner}.ts`, `lib/services/revision-service.ts`, `lib/repositories/revision-repository.ts` (composed via `RevisionService.list()` only — never called into directly, never modified), `types/relationship.ts` (no new `RelationshipNodeType` added — `"drawing"` already existed since Sprint 4.0), `types/knowledge-object.ts` (no new `KnowledgeObjectType` added), the existing six-plus-one Recommendation rules in `recommendation-rules.ts` (none touched — verified they already react correctly with zero changes), every `components/*` file (no UI changes this sprint).

---

# Constraints

- No image comparison, no pixel/file/OCR/geometry access anywhere in the pipeline — `DrawingParser` only ever reads structured (today: seeded mock) data, and `DrawingSourceFormat` is never branched on outside that one module.
- One generic `Drawing` model — no per-format or per-type subclasses.
- Reuse the Knowledge Graph, Relationship Engine, Evidence Engine, Reasoning Engine, Recommendation Engine, Revision Intelligence, Timeline, Event Engine — do not duplicate any of them.
- Do not build a second Delta pipeline, and do not duplicate Revision Intelligence's own revision storage.

---

# Implementation Notes (Architecture Decisions)

- **A Drawing is a real Relationship Graph node, not a wrapped Knowledge Object — a deliberate, documented departure from how Sprint 5.0 modeled a detected design change.** A Revision's detected change (e.g. "Guest Bedroom resized") has no node type of its own in `RelationshipNodeType`, so Sprint 5.0 modeled it as an `Issue` — the closest existing fit. A Drawing is different: `"drawing"` has been a first-class `RelationshipNodeType` since Sprint 4.0, already used as the *other side* of real seeded relationships (`drawing-a-101`/`drawing-a-102`, referenced in `data/relationships.ts` since that sprint). Wrapping every Drawing in an `Issue`/`Requirement` would be fabricating a Knowledge Object the graph doesn't need — "becoming Knowledge" (Module 8) for a Drawing means existing as that real graph node, connected by real Relationships, which is exactly what `DrawingService.ingest()` does.
- **Views are represented structurally as an array field on `Drawing`, not as a separate `RelationshipNodeType`.** The brief's own Module 9 example, "Ground Floor Plan contains Ground Floor View," is naturally satisfied by `Drawing.views` itself — no graph edge is needed for a Drawing to "contain" its own embedded view. Adding a `"drawing_view"` node type was considered and rejected as unnecessary scope for a foundation sprint; `RelationshipNodeType` was not touched.
- **`DrawingIntelligenceEngine`'s pipeline order matches the brief's own module list**: Parse (format-agnostic) → Classify → Analyze Sheet → extract Title Block / Views / Annotations → Reason (reused `EvidenceEngine`) → Orchestrate (suggested relationships). Every stage is constructor-injected with a default singleton, exactly like `IntelligenceEngine` (Sprint 4.2) and `RevisionEngine` (Sprint 5.0) — the engine itself is pure computation; `DrawingService` is the only layer that writes, matching that same split.
- **`DrawingReasoner` folds evidence-gathering and explanation into one module**, unlike Revision Intelligence's separate `ImpactAnalyzer`/`RevisionReasoner` — the brief's own suggested module list for this sprint does not name a separate analyzer, and a Drawing's evidence-gathering is simple enough (one generic `EvidenceEngine` search) not to warrant a second module. Documented as a deliberate simplification, not an oversight.
- **A real, subtle bug was caught and fixed before it ever ran: `DrawingReasoner` must be given a `{level: "node", ...}` scope for the drawing's own id, not project-scope only.** Revision Intelligence's `ImpactAnalyzer` correctly used project-scope only, because a freshly-detected design change has no prior node identity in the graph. A Drawing is different: `drawing-a-101`/`drawing-a-102` already exist as `nodeB` of real seeded relationships. Searching with project-scope only would let `EvidenceEngine`'s reference-less generic path trivially "match" a drawing against its *own* label (since the exclusion of "the caller's own reference node," `candidateSides()`, only fires when a node scope establishes what that reference is) — producing a nonsensical self-referential evidence item pointing a drawing back at itself. Fixed by always passing both a node scope (the drawing's own ref) and a project scope, which lets `dedupeCandidates()`'s existing "prefer the narrower tier" logic correctly drop the unreferenced project-tier duplicate in favor of the correctly-referenced (and therefore correctly self-excluding) node-tier version — zero new exclusion logic was written; this is a correct *invocation* of behavior `EvidenceEngine` already has, verified live before being trusted.
- **`DrawingReasoner` searches using the sheet title *and every annotation label combined*, not the title alone.** The first implementation searched only by title, which meant Module 7's annotations (room names, notes, callouts) never actually connected to anything — undercutting the entire point of extracting them. Fixed by building one combined search string (`[title, ...annotations.map(a => a.label)].join(" ")`) before calling the unmodified `EvidenceEngine` — annotations are architectural information, not inert decoration, so they must feed the same search a bare title would. Verified live: `drawing-a-101`'s "Weather-protected clearance to accessible entrance" note annotation is what actually connects it to the seeded `"Entrance Accessibility"` discussion and `"Accessibility Compliance Report"` document — the title "Ground Floor Plan" alone shares no words with either.
- **`DrawingService.analyze()` is a second, independent entry point into the same `DrawingReasoner`/`DrawingOrchestrator` the ingest pipeline uses — live, on demand, for ANY drawing (seeded or freshly ingested), never mutating the stored record.** The eight statically-seeded drawings (Module 3) carry empty `evidence`/`suggestedRelationships` and an honest placeholder `reasoning` ("has not been analyzed yet") in `data/drawings.ts` — these are structural facts about the sheet, known at authoring time, not a fabricated pre-computed analysis. `analyze()` is what Delta (Module 11) and any future detail view actually call for fresh evidence — mirroring `KnowledgeValidationEngine.assemble()`'s own "always compute live" precedent rather than trusting a snapshot that could go stale.
- **Module 12 connects to the project's *existing* seed threads rather than inventing a disconnected new story.** `decision-canopy-material` (Decision: "Canopy Grid Material Approved") previously existed only as a denormalized `RelationshipNode` label — the target of an `impact` relationship from `requirement-demo-1` — with no real Knowledge Object behind it. This sprint gives it one, with the same id and title, completing a real, traceable chain: `requirement-demo-1` (Requirement) → `conv-accessibility` (Discussion) → `decision-canopy-material` (Decision, newly real) → `drawing-a-102`/`drawing-a-101` (Drawing, newly real) → the Sprint 5.0 revision pipeline → Recommendations → Timeline → Delta. The six new drawings (Site Plan, First Floor Plan, North Elevation, Section A-A, Door/Room Schedules) are connected to `drawing-a-101` via seeded, hand-authored `related` relationships (schedules/elevations/sections reference the plan they were derived from) — deliberately seeded as static fixture data, not claimed to have been "discovered" by `DrawingOrchestrator`'s live text-matching, since their labels genuinely don't share words (a `"Door Schedule"` and a `"Ground Floor Plan"` are related by sheet-set convention, not lexical overlap — inventing a text-matching heuristic to "discover" that would be exactly the kind of fabrication this codebase's whole philosophy rejects).
- **A known, honestly-documented `EvidenceEngine` interaction limitation surfaced during verification**: a newly-ingested drawing is always `nodeA` of the relationships `DrawingService.ingest()` creates for it (`nodeA` = the drawing, `nodeB` = each suggested target). Because `EvidenceEngine`'s reference-less generic search always returns `nodeB` as "the other side" of a match (see `otherNode()`), a freshly-ingested drawing can never be surfaced by `drawing-query.ts`'s "which drawings relate to X" answer, even when it demonstrably *is* connected — only pre-existing drawings that happen to be `nodeB` somewhere can be. Verified live: ingesting `drawing-a-104` (with genuine "accessible entrance" content) produced real relationships and real evidence on the drawing's *own* record, but did not appear in a subsequent "Which drawings relate to the entrance?" Delta answer, while the pre-existing `drawing-a-101` correctly did. This is a pre-existing `EvidenceEngine` characteristic being exercised, not a bug introduced by this sprint, and `EvidenceEngine` is a frozen file this sprint must not modify — documented honestly as a real limitation rather than silently worked around.
- **No new Recommendation rule was needed, and this was verified, not assumed.** The smoke test confirmed the existing `reviewAffectedKnowledgeRule` (Sprint 4.8) correctly does *not* fire for the new Drawing↔Drawing/Discussion/Meeting/Document/Photo/Video relationships `DrawingService.ingest()` creates (none of their sides are a `KnowledgeObjectType` node — exactly matching that rule's own documented, pre-existing limitation), while Sprint 5.0's Revision Intelligence rules continued firing correctly and unaffected, proving no regression.

---

# Acceptance Criteria

- [x] Drawings appear in the Knowledge Graph (real `"drawing"`-type nodes, seeded and live-ingested, participating in real Relationships).
- [x] Drawings relate correctly to Knowledge Objects (`decision-canopy-material` → `drawing-a-102`; `requirement-demo-1` → `drawing-a-101`/`drawing-a-102`, both real now).
- [x] Drawings participate in Revision Intelligence (`DrawingService.getRevisionSummary()` composes the unmodified `RevisionService` live, verified against Sprint 5.0's own seeded `drawing-a-101` revision data).
- [x] Delta answers drawing questions ("What drawings exist?", "Which is the latest revision?", "Which drawings relate to the entrance?" all verified live).
- [x] Timeline updates correctly (`drawing.uploaded.v1`/`drawing.classified.v1`, zero `categorize()` changes).
- [x] Recommendations continue working (verified live — existing rules correctly fire/don't-fire exactly as documented, zero regressions).
- [x] Existing functionality has no regressions (`tsc`/lint/build all pass; Sprint 5.0's own pipeline re-verified working inside this sprint's smoke test).

---

# Validation

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`)
- [x] Temporary smoke-test route (`app/api/smoke-drawing-5-1`, added and removed within this session, same technique as Sprint 5.0) against the real seed project and the real service layer: `getDrawings({projectId})` returned all 8 seeded drawings; running Sprint 5.0's own `detectAndProcessRevision()` against `drawing-a-101` and then reading `DrawingService.getRevisionSummary("drawing-a-101")` correctly returned `currentRevisionLabel: "Rev C"`, `previousRevisionLabel: "Rev B"`, and all 3 real detected changes; `DrawingService.analyze("drawing-a-101")` (a seeded drawing, never before "ingested" through the live pipeline) found 6 real evidence items and 5 suggested relationships purely from its own annotations; `ingestDrawing({drawingId:"drawing-a-104", sourceFormat:"pdf", ...})` ran the full live pipeline for a genuinely new sheet, found 6 real evidence items, and created 5 real `Relationship` rows; `resolveDeltaQuery("What drawings exist?", {projectId})` returned all 9 drawings (8 seeded + 1 newly ingested); `resolveDeltaQuery("Which is the latest revision?", {projectId})` returned all 9 with correct revision labels; `resolveDeltaQuery("Which drawings relate to the entrance?", {projectId})` correctly returned only `drawing-a-101` (see Implementation Notes for the honest limitation this also surfaced); the Timeline tail showed real `relationship.created.v1` ×5 and `drawing.classified.v1` events; exactly 9 Recommendations existed afterward, all traceable to Sprint 5.0's revision rules (confirming the existing Recommendation rules correctly did not mis-fire for the new Drawing relationships).
- [x] Found and fixed two real issues during this verification (see Implementation Notes): `DrawingReasoner` needed a node scope, not project-scope only, to avoid a self-referential evidence match against a drawing's own pre-existing graph presence; `DrawingReasoner` needed to search using annotation content, not just the sheet title, for Module 7's annotations to mean anything. Both fixed and reverified live before this sprint was considered complete.
- [ ] Full authenticated visual verification in a browser was not possible in this environment (no test credentials) — the same limitation every sprint since 4.0 has documented. Verified via code review, `tsc`/lint/build, and the live smoke test above only.

---

# Completion Notes

Completed work: see Files Expected to Change above — all items delivered; Drawing Intelligence plugs into the Knowledge Graph, Relationship Engine, Evidence Engine, Reasoning Engine, Recommendation Engine, Revision Intelligence, Timeline, and Delta, with zero duplicated architecture.

Known issues:

- A newly-ingested drawing cannot be surfaced by `drawing-query.ts`'s "which drawings relate to X" answer, even when genuinely connected, because it is always `nodeA` of its own newly-created relationships and `EvidenceEngine`'s reference-less generic search only ever returns `nodeB` as "the other side" of a match. Only pre-existing drawings that happen to be `nodeB` somewhere (like the seeded `drawing-a-101`) are found this way. A pre-existing `EvidenceEngine` characteristic, not something this sprint introduced or could fix without modifying a frozen file.
- The eight statically-seeded drawings carry empty `evidence`/`suggestedRelationships` and a placeholder `reasoning` until `DrawingService.analyze()` is called on them — by design (see Implementation Notes), but worth knowing if something reads `Drawing.evidence` directly expecting it to always be populated.
- No UI triggers `DrawingService.ingest()` — verified only via a temporary smoke-test route, matching Sprint 5.0's own precedent for `RevisionService.detectAndProcess()` before it had a live UI flow. `lib/actions/drawing-actions.ts` is ready for a future upload flow to call.
- `Drawing.confidence` reflects classification completeness (did the sheet title match a known drawing-type keyword), not evidence strength — the same documented axis-naming tension Sprint 5.0 noted for `Revision.confidence`.
- Delta's drawing-question answering is one unified listing regardless of which of the brief's example phrasings was asked, matching `revision-query.ts`/`recommendation-query.ts`'s own established precedent — not a deep per-phrase NLU system.
- No dedicated UI (list or detail) surfaces a `Drawing` record directly; it's visible only indirectly — through the Relationships it participates in, the Timeline entries it publishes, and Delta's unified listing.

Follow-up work:

- A dedicated Drawings UI (list + detail), showing title block/views/annotations/revision history — everything needed already exists in `lib/actions/drawing-actions.ts`, with no consumer yet.
- Wire a real "Upload Document"/"Upload Drawing" flow (the same known stub Sprint 5.0 flagged) to call `ingestDrawing()`.
- Replace `MockDrawingParser` with a real DWG/DXF/IFC/Revit/image/CAD-API parser behind the exact same `DrawingParser` interface — nothing else in the pipeline should need to change, per Module 1/12's own goal.
- Revisit the `nodeA`-only evidence-visibility limitation above once a real UI surfaces enough drawings that it becomes user-visible, rather than only findable via direct testing.

Modified files: see Files Expected to Change above.
