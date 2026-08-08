# Sprint: DIGA Intelligence Engine (Foundation)

Status: Complete
Sprint ID: 4.2
Target Version: v4.2
Owner: Delta engineering
Created: 2026-08-02
Last Updated: 2026-08-02

---

# Objective

Build the architecture — not advanced AI — that every future AI capability in DIGA (Delta chat, requirement/decision/issue/action detection, upload intelligence, revision comparison, conflict detection, evidence retrieval, explainability, semantic project search, voice/mobile assistants) will plug into: `User → DIGA Intelligence Engine → Knowledge Graph → Reasoning Services → Response Planner → Delta UI`. This sprint completes the Intelligence Engine's foundation by adding the three modules that don't yet exist (Context Engine, Orchestrator, Response Planner) around the Comprehension Engine already built in Sprint 4.1, and produces one canonical output object every future AI service will consume instead of parsing raw text.

---

# Background

Sprint 4.1 ("Delta Comprehension Engine") built `DeltaComprehensionService` — normalization, language understanding, intent classification, entity extraction, context resolution, and destination prediction, each independently replaceable via constructor injection. That is exactly **Module 1 — Comprehension Engine** of the architecture described in this sprint's brief, and it is reused entirely unchanged.

What Sprint 4.1 did not build: a Context Engine that actually searches the current context before expanding to the whole project (today's `ContextResolver` only carries IDs through, with no search-scope behavior); an Orchestrator that routes a comprehended message toward Knowledge Graph queries, Requirement/Decision/Issue/Action workflows, or future upload/comparison pipelines (today, `delta-query-resolver.ts` makes that decision ad hoc, inline, with no reusable routing module); and a Response Planner that decides how an answer should be presented, independent of what the answer is. This sprint builds all three and a top-level `IntelligenceEngine` that assembles them into the canonical output object, per `PROJECT_CONTEXT/02_ARCHITECTURE.md`'s "the assistant should never contain business logic, it is only an interface to the knowledge model" and `docs/architecture/ENGINEERING_CONTRACT.md`'s "AI assists, never makes business decisions, always produces proposals, users approve changes."

This sprint is numbered 4.2, not a revision of 4.1: Sprint 4.1 remains the historical record of Module 1 alone; this sprint documents the larger foundation built on top of it.

---

# Scope

## In Scope

- `ContextEngine` (Module 2) — turns the Comprehension Engine's resolved context into an ORDERED list of concrete, searchable scopes (narrowest first), so a caller genuinely searches the current context before expanding to the whole project, instead of only ever searching one fixed scope.
- `Orchestrator` (Module 3) — routes a comprehended message to one of 8 destinations (Knowledge Graph query / Requirement / Decision / Issue / Action workflow / Delta response / future upload pipeline / future comparison engine). Decides, never performs — no workflow is executed by this sprint.
- `ResponsePlanner` (Module 4) — decides how an answer should be presented (short answer + evidence + confidence + related knowledge; comparison layout + evidence + impacts; revision layout + changes + affected knowledge + related drawings), independent of what the answer is.
- `IntelligenceEngine` — the top-level, constructor-injected orchestrator of all four modules, producing the canonical `IntelligenceEngineResult` (`types/intelligence-engine.ts`): original message, normalized message, language, intent, entities, context, destination, confidence (per-stage + overall), routing decision, response plan, and an advisory suggested next action.
- Rewiring Delta's "Ask Delta" integration point (`delta-query-resolver.ts`, moved to `lib/intelligence-engine/`) to run every query through `IntelligenceEngine.process()` first, and to use the Context Engine's scopes to genuinely search the current discussion before falling back to a project-wide graph query — not just carry the idea as metadata.

## Out of Scope

- Embeddings, semantic search, graph reasoning, LLM prompting, OCR, upload intelligence, revision comparison, graph visualization (explicitly excluded per brief). `upload_pipeline` and `comparison_engine` exist as `RoutingTarget` values for forward compatibility, but no rule produces them this sprint.
- Modifying any of the six Sprint 4.1 Comprehension Engine collaborators, or the Sprint 4.0 Relationship Repository/Service/Actions — this sprint is a new caller and a new layer on top, not a change to either foundation.
- Wiring `ResponsePlan` into `DeltaResponsePanel`'s actual rendering — the plan is computed and carried on the canonical result, ready for a future sprint to consume, exactly as Sprint 4.1 left Destination Prediction as a hint pending a future actionable surface.
- Any workflow actually creating a Requirement/Decision/Issue/Action from a Delta query — the Orchestrator's routing to those targets is advisory metadata only this sprint.

---

# Files Expected to Change

- `types/intelligence-engine.ts` (new)
- `lib/intelligence-engine/context-engine.ts`, `orchestrator.ts`, `response-planner.ts`, `intelligence-engine.ts` (all new)
- `lib/intelligence-engine/delta-query-resolver.ts` (new location; moved and rewritten from `lib/comprehension/delta-query-resolver.ts`, which no longer exists)
- `components/delta/useDeltaPanel.ts` (one-line import path change only)

---

# Files That Must Not Change

- `lib/comprehension/normalization-service.ts`, `language-service.ts`, `intent-classifier.ts`, `entity-extractor.ts`, `context-resolver.ts`, `destination-predictor.ts`, `delta-comprehension-service.ts` — Module 1, reused as-is; the Intelligence Engine is a new caller, not a modification.
- `lib/repositories/relationship-repository.ts`, `lib/services/relationship-service.ts`, `lib/actions/relationship-actions.ts`, `data/relationships.ts` (Sprint 4.0) — the Context Engine's project-wide fallback is a new query shape through the existing, unmodified `queryRelationships` action.
- `lib/delta-mock-responses.ts` — unchanged fallback path and scenario data.
- `components/delta/DiscussionPrompt.tsx` — still calls `deltaComprehensionService.comprehend()` directly for its own non-blocking destination-hint badge; an independent, already-correct call site, out of scope for this integration.
- Every other Delta UI component (`DeltaResponsePanel.tsx`, `ReplyBar.tsx`, `DiscussionMessages.tsx`, `DiscussionDetail.tsx`, `DiscussionCard.tsx`, `Workspace.tsx`).

---

# Constraints

- Follow `PROJECT_CONTEXT/02_ARCHITECTURE.md`, `05_PRODUCT_DECISIONS.md`, `06_DESIGN_PRINCIPLES.md`, `docs/architecture/ENGINEERING_CONTRACT.md`.
- Every module independently replaceable via constructor injection — no module reaches into another's internals, matching Sprint 4.1's precedent.
- Mock/deterministic implementations only; no real AI/LLM calls.
- The Orchestrator decides, it never performs — no workflow (Requirement/Decision/Issue/Action creation) is ever executed as a side effect of routing.
- Preserve existing functionality (Journal, Discussion, Requirements workflows must keep working unchanged).

---

# Implementation Notes (Architecture Decisions)

- **Context Engine's "expand to project" fallback is `relationshipType`-filtered, not unfiltered.** `getEvidenceForNode`/`getImpactsForNode` (frozen) have no project-wide mode, so a project-wide fallback for those two has to go through the generic `queryRelationships` action instead. An unfiltered `queryRelationships({projectId})` would mix Evidence/Impact/Related relationships together and mislabel them under the wrong heading; instead each intent's fallback carries its own `relationshipType` (e.g. `queryRelationships({projectId, relationshipType: "evidence"})` for an Evidence query), verified against `MockRelationshipRepository`'s `matchesQuery` (`lib/repositories/relationship-repository.ts`), which already treats an omitted `node` filter as "match any node in this project of this relationship type" — so this fallback is real, correct, existing behavior surfaced through a new query shape, not a new capability bolted onto the repository.
- **`knowledgeObjectId` and `page` stay metadata-only, not new searchable scopes.** A `RelationshipNodeRef` needs a known `type`; `knowledgeObjectId`'s type (which of the 5 Knowledge Object types) can't be determined without an extra repository lookup this sprint doesn't add, and `RelationshipQuery` has no notion of "page" at all. Both remain on `ResolvedContext` for a future sprint to make searchable, matching Sprint 4.1's own documented `knowledgeObjectId` limitation.
- **The Orchestrator uses two-tier resolution, not a flat intent table.** Graph-native intents (Evidence/Impact/Related Knowledge) always route to `knowledge_graph_query` regardless of the predicted destination — routing on intent, not on the (mostly question-shaped) destination prediction, is what actually determines whether a query touches the graph. Every other intent routes via an exhaustive `Record<DeltaDestination, RoutingTarget>` (TypeScript-checked — a new `DeltaDestination` left unmapped is a compile error), so the routing table can never silently go stale as Module 1's destination set grows.
- **The Response Planner uses an exhaustive `Record<DeltaIntent, ResponsePlan>`** (TypeScript-checked, all 17 intents), grouped into four families by what shape of answer actually serves the intent rather than 17 independently hand-picked rows: single-fact Q&A (location/status/approval/reason/dimension/material/decision/requirement) → `short_answer`; graph-native listing (evidence/impact/related_knowledge/issue/risk/action) → `related_list`; multi-thing juxtaposition (comparison/conflict) → `comparison`; change-over-time (revision) → `revision`.
- **`delta-query-resolver.ts` moved from `lib/comprehension/` to `lib/intelligence-engine/`.** Sprint 4.1's own documentation already treated this file as distinct from "the six collaborators" (its own words: "the concrete integration point requested in validation," listed separately in every enumeration). Leaving it inside `lib/comprehension/` after this sprint would mean the comprehension folder imports from a layer above it (`context-engine`, `orchestrator`, `response-planner`) — a layering smell, since `lib/comprehension/` must never depend on `lib/intelligence-engine/`. The only caller, `useDeltaPanel.ts`, needed a one-line import path change; the exported function name, signature, and behavior contract are unchanged.
- **The canonical `IntelligenceEngineResult` encodes "AI proposes, user approves" as data, not just prose.** `suggestedNextAction.requiresApproval` is always `true` — the Intelligence Engine's routing is advisory by construction, never a trigger for an actual side-effecting workflow.
- **How future AI modules plug in** — every module in this engine follows the same interface + implementation class + exported default singleton pattern as Module 1, with `IntelligenceEngine` itself taking all four (really seven, counting Module 1's own six) collaborators as constructor parameters defaulting to the deterministic singletons:
  - A future LLM-backed `ContextEngine` could resolve genuine semantic scopes (e.g. "nearby" knowledge objects by embedding similarity) instead of only ID-based node/project scopes — swap the constructor argument, `IntelligenceEngine` and `delta-query-resolver.ts` need no changes.
  - A future learned `Orchestrator` could route on more than intent/destination (e.g. conversation history, user role) — same swap, same zero-touch guarantee.
  - A future `ResponsePlanner` could adapt layout to device (voice vs. mobile vs. desktop) by taking an additional context parameter — the interface's single responsibility (`plan(intent) → ResponsePlan`) can grow without breaking `IntelligenceEngine`'s call site as long as the return shape is preserved.
  - Because every module already returns a confidence score and the top-level result carries `needsClarification`/`clarifyingQuestion`, replacing any single module with a probabilistic (LLM-backed) implementation requires no change to the low-confidence-triggers-clarification behavior — it is already wired through `IntelligenceEngine.process()`, reusing Module 1's own `CONFIDENCE_THRESHOLD`.

---

# Acceptance Criteria

- [x] `ContextEngine` produces an ordered, narrowest-first list of searchable scopes from resolved context.
- [x] `Orchestrator` routes a comprehended message to one of the 8 named destinations, deciding only — never performing — the work.
- [x] `ResponsePlanner` produces a response plan (layout + sections) for every one of the 17 intents.
- [x] A canonical `IntelligenceEngineResult` object exists, containing original message, normalized message, language, intent, entities, context, destination, confidence, and a suggested next action.
- [x] Every module produces a confidence score; low confidence still produces a clarifying question instead of a guess (reusing Module 1's threshold and clarification mechanic, unmodified).
- [x] Delta queries pass through the Intelligence Engine before reaching the Relationship Repository, and the Context Engine's scopes are genuinely used (current-context-first, project-wide fallback), not just carried as inert metadata.
- [x] No Intelligence Engine logic lives inside a UI component.
- [x] Journal, Discussion, and Requirements workflows are unaffected.

---

# Validation

The implementation must:

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`)
- [x] Journal and Discussion still work
- [x] Delta queries verifiably pass through the Intelligence Engine before querying `RelationshipRepository`
- [x] `RelationshipRepository` and its service/actions remain unchanged

---

# Completion Notes

Completed work:

- `types/intelligence-engine.ts` — canonical types: `ContextScope`, `RoutingTarget`, `RoutingDecision`, `ResponseLayout`, `ResponseSectionKind`, `ResponsePlan`, `SuggestedNextAction`, `IntelligenceEngineConfidence`, and the canonical `IntelligenceEngineResult`, all additive on top of `types/comprehension.ts`/`types/relationship.ts`, duplicating nothing.
- `lib/intelligence-engine/context-engine.ts` — `DefaultContextEngine` (singleton `contextEngine`), `resolveScopes()` produces a `node` scope (discussion, if present) before a `project` scope, narrowest-first.
- `lib/intelligence-engine/orchestrator.ts` — `RuleBasedOrchestrator` (singleton `orchestrator`), two-tier: graph-intent override, then an exhaustive `DeltaDestination → RoutingTarget` table.
- `lib/intelligence-engine/response-planner.ts` — `RuleBasedResponsePlanner` (singleton `responsePlanner`), exhaustive `DeltaIntent → ResponsePlan` table across the four answer-shape families.
- `lib/intelligence-engine/intelligence-engine.ts` — `IntelligenceEngine` class, constructor-injected (`comprehensionService`, `contextEngine`, `orchestrator`, `responsePlanner`, all defaulting to singletons), `.process()` assembles the canonical result; exported singleton `intelligenceEngine`.
- `lib/intelligence-engine/delta-query-resolver.ts` — moved and rewritten from `lib/comprehension/delta-query-resolver.ts` (deleted). Same exported `resolveDeltaQuery`/`DeltaQueryResult`/`DeltaClarificationResult`. Calls `intelligenceEngine.process()`; for `knowledge_graph_query` routing, tries the node-scoped query first (`getEvidenceForNode`/`getImpactsForNode`/`queryRelationships({node,...})`, exactly as Sprint 4.1 built it) and only on an empty result expands to the new project-wide, `relationshipType`-filtered `queryRelationships({projectId, relationshipType})` fallback; every other routing target, or an empty graph result even after the project-wide fallback, falls back to `lookupDeltaMock(result.language.translatedText)` — unchanged.
- `components/delta/useDeltaPanel.ts` — one-line import path update to the new resolver location; no logic changes.

Known issues:

- Full authenticated visual verification in a browser was not possible in this environment (no test credentials) — the same limitation Sprint 4.0/4.1 documented. Verified instead via `npx tsc --noEmit`, `npm run lint`, `npm run build` (all clean), a restarted dev server returning clean, error-free responses for `/`, `/projects`, `/projects/new`, `/auth`, `/participants`, `/review` (matching pre-existing status codes exactly), and a full manual trace of the routing/response-planning/context-scoping logic against `MockRelationshipRepository`'s actual matching behavior. The project-wide fallback's exact runtime behavior (a discussion with zero seeded relationships successfully expanding to the project's full Evidence/Impact/Related set) is verified by code trace, not by an authenticated browser session — recommended before full UX sign-off.
- `ResponsePlan` is computed and carried on `IntelligenceEngineResult` but does not yet drive `DeltaResponsePanel`'s actual rendering — same follow-up posture Sprint 4.1 took with Destination Prediction (computed, surfaced later once product direction on the interaction is decided).
- `upload_pipeline`/`comparison_engine` `RoutingTarget` values are unreachable this sprint (no rule produces them) — intentional, matching explicit out-of-scope.
- `knowledgeObjectId`-derived context scoping remains unimplemented (needs a repository lookup to resolve its Knowledge Object type into a valid `RelationshipNodeRef`) — carried forward from Sprint 4.1's own identical note.

Follow-up work:

- Resolve `knowledgeObjectId` into a real node-level `ContextScope` (requires a `KnowledgeObjectService` lookup to determine its type) once a Knowledge Object Detail Ask-Delta entry point exists.
- Wire `ResponsePlan` into `DeltaResponsePanel`'s rendering so different intents genuinely render differently (short answer vs. comparison vs. revision layout), rather than the current single set of `kind`-based branches.
- Build the actual Requirement/Decision/Issue/Action workflow handlers the Orchestrator's routing already names, so routing to those targets does more than carry an advisory label.
- Replace individual mock modules (`ContextEngine`, `Orchestrator`, `ResponsePlanner`, and Module 1's own six) with real/LLM-backed implementations as they become available — the constructor-injection design means this never requires touching `IntelligenceEngine` itself.
- Build the future upload pipeline and comparison engine that `RoutingTarget` already has slots for.

Modified files:

New: `types/intelligence-engine.ts`, `lib/intelligence-engine/context-engine.ts`, `lib/intelligence-engine/orchestrator.ts`, `lib/intelligence-engine/response-planner.ts`, `lib/intelligence-engine/intelligence-engine.ts`, `lib/intelligence-engine/delta-query-resolver.ts`.

Deleted (moved): `lib/comprehension/delta-query-resolver.ts`.

Changed: `components/delta/useDeltaPanel.ts`.
