# Sprint: Evidence-Based Response Engine

Status: Complete
Sprint ID: 4.3
Target Version: v4.3
Owner: Delta engineering
Created: 2026-08-02
Last Updated: 2026-08-02

---

# Objective

Replace mock answer generation with evidence-based reasoning. Every Delta answer must trace back to a real `Relationship` (Sprint 4.0), come with a deterministic confidence level, explain what was found and what's missing, and honestly say "I don't know" when the graph doesn't support an answer — instead of guessing. Complete the pipeline `User → Comprehension Engine → Context Engine → Evidence Engine → Reasoning Engine → Response Planner → UI` by adding the two modules that don't exist yet (Evidence Engine, Reasoning Engine), a deterministic Confidence Scorer, and — for the first time — actually using the Response Planner's output (computed since Sprint 4.2, never consumed until now) to shape the final response.

---

# Background

Sprint 4.2 built the routing/planning architecture (Orchestrator, Response Planner) but the actual "answer" still came from `lib/delta-mock-responses.ts` — a hardcoded keyword-matched scenario table. Any staircase-related question always returned a fake "4'-0"" answer with fabricated `approvedBy`/evidence labels that don't correspond to anything in `data/relationships.ts`. This sprint removes that entirely. Per explicit instruction, Sprint 4.1 (`lib/comprehension/`) and Sprint 4.2 (`lib/intelligence-engine/context-engine.ts`, `orchestrator.ts`, `response-planner.ts`, `intelligence-engine.ts`, both canonical type files) are reused unchanged — nothing Requirement/Decision/Issue-specific is built, only generic, relationship-driven modules.

---

# Scope

## In Scope

- `EvidenceEngine` (new) — collects evidence relevant to a query: current discussion first, then its linked knowledge objects, then the whole project. Ranks, dedupes, returns generic `Evidence[]`.
- `ConfidenceScorer` (new) — deterministic High/Medium/Low/None scoring from the collected evidence, no AI.
- `ReasoningEngine` (new) — explains what was found and what's missing, and a plain-language conclusion; never invents a semantic claim the evidence can't support.
- Rewiring `delta-query-resolver.ts` to run every non-clarification query through Evidence → Confidence → Reasoning, and to genuinely use `ResponsePlan.layout` (Simple Answer / Comparison / Related Knowledge / Unknown) to shape the result — the Response Planner's first real consumer.
- Enhancing `DeltaResponsePanel.tsx` to render Answer, Evidence, Confidence, and Reasoning for every non-clarification response, plus new `comparison` and `unknown` rendering branches.
- Deleting `lib/delta-mock-responses.ts` outright — no dormant fallback retained.

## Out of Scope

- Any change to `lib/comprehension/*`, `lib/intelligence-engine/context-engine.ts`/`orchestrator.ts`/`response-planner.ts`/`intelligence-engine.ts`, or the Sprint 4.0 relationship stack.
- Revision comparison (`ResponsePlan.layout === "revision"` is explicitly handled as "not available yet," not forced through the Answer or Unknown path).
- Any workflow actually creating a Requirement/Decision/Issue/Action — the four workflow routing targets remain advisory-only.
- Journal/Discussion layout redesign, `DeltaInsights.tsx`, `EvidenceSection.tsx`/`ImpactsSection.tsx` (separate, untouched feature).

---

# Files Expected to Change

- `types/evidence.ts` (new)
- `lib/intelligence-engine/evidence-engine.ts`, `confidence-scorer.ts`, `reasoning-engine.ts` (all new)
- `lib/intelligence-engine/delta-query-resolver.ts` (rewritten)
- `components/delta/DeltaResponsePanel.tsx` (enhanced rendering)

---

# Files That Must Not Change

- All of `lib/comprehension/*` (Sprint 4.1).
- `lib/intelligence-engine/context-engine.ts`, `orchestrator.ts`, `response-planner.ts`, `intelligence-engine.ts`, `types/comprehension.ts`, `types/intelligence-engine.ts` (Sprint 4.2).
- The entire relationship stack: `types/relationship.ts`, `lib/repositories/relationship-repository.ts`, `lib/services/relationship-service.ts`, `lib/actions/relationship-actions.ts`, `data/relationships.ts` (Sprint 4.0).
- `lib/repositories/knowledge-object-repository.ts` and `lib/repositories/discussion-repository.ts` — used only through their existing `"use server"` action wrappers (`getKnowledgeObjects`/`getKnowledgeObject`, `getDiscussion`), never imported directly.
- `components/delta/DeltaInsights.tsx`, `components/relationships/EvidenceSection.tsx`, `components/relationships/ImpactsSection.tsx` — a separate, pre-existing feature (unconditional per-discussion insights, not the Ask-Delta query flow), untouched by construction.
- `components/delta/useDeltaPanel.ts` — no changes needed at all (same exported function name/signature).

---

# Constraints

- Follow `PROJECT_CONTEXT/02_ARCHITECTURE.md`, `05_PRODUCT_DECISIONS.md`, `06_DESIGN_PRINCIPLES.md`, `docs/architecture/ENGINEERING_CONTRACT.md`.
- Fully generic — no `RequirementEvidenceService`/`DecisionEvidenceService` or similar per-type classes. Everything flows through the generic `Relationship` model.
- No AI/LLM calls; deterministic rules only.
- Never fabricate a value — every rendered fact must be traceable to a real `Relationship` (or the discussion/knowledge-object content it points to).
- Preserve existing functionality (Journal, Discussion, Knowledge Object pages must keep working).

---

# Implementation Notes (Architecture Decisions)

- **Evidence/Reasoning/Confidence live downstream of `IntelligenceEngine.process()`, inside `delta-query-resolver.ts`, not bolted onto the canonical `IntelligenceEngineResult`.** `IntelligenceEngine.process()` is synchronous; Evidence Engine needs `await` (server actions). This follows the same pattern the resolver already used for `contextScopes` in Sprint 4.2.
- **The "linked knowledge objects" tier is Evidence-Engine-internal**, derived via the existing `getKnowledgeObjects(discussionId)` server action (`lib/actions/knowledge-object-actions.ts`) — never importing `knowledgeObjectRepository`/`discussionRepository` directly. `delta-query-resolver.ts` has no `"use server"` boundary of its own and is imported into the `"use client"` `useDeltaPanel.ts` hook; every data access in this file must go through an existing `"use server"` action wrapper for exactly this reason (`getKnowledgeObjects`/`getKnowledgeObject` from `knowledge-object-actions.ts`, `getDiscussion` from `discussion-actions.ts`).
- **Graph-native intents (evidence/impact/related_knowledge) keep the existing "expand only if the narrower tier is empty" cascade**, now spanning three tiers (node → linked knowledge object → project) instead of two — a precise listing of "the relationships for this exact node." **Generic single-fact intents (location/status/material/dimension/...) instead gather all three tiers unconditionally** and rank by relevance, because the genuine match may not sit in the narrowest tier (confirmed by the "Where is the entrance?" trace below, where the match only exists via the discussion's *own* evidence-of relationship, found at the node tier's symmetric query, not through a synthesized answer).
- **Entity matching excludes the caller's own reference node from consideration — a real bug caught and fixed during implementation.** An initial version checked both sides (`nodeA.label`/`nodeB.label`) of every candidate relationship unconditionally. Since the seeded discussion `conv-accessibility` is itself labeled "Entrance Accessibility," every one of its own evidence/impact relationships (a meeting, a drawing, a photo — none actually about "the entrance") trivially matched an "entrance" query, because the *discussion's own label* (not the actual evidence item) contained the term. Fixed by excluding whichever side equals the tier's reference node (`candidateSides()` in `evidence-engine.ts`) — only the informative "other side" is checked. Verified via a temporary smoke-test route (added and removed within this sprint, never committed) hitting the real seed data before and after the fix.
- **Confidence is derived purely from `Evidence.confidence` (already tier-weighted: node=1.0, linked-KO=0.75, project=0.5, multiplied by relevance)** — no separate tier field needed on `Evidence`. A single threshold (0.525) exactly separates "current-context, strong match" combinations from "project-only or weak" ones, since the discrete tier-weight × relevance products never collide across that boundary.
- **`High` confidence is not reachable from the current seed data + entity dictionary** — the dictionary (`staircase, fire exit, toilet, beam, hvac, entrance, west side, client, ...`) barely overlaps the relationship labels in `data/relationships.ts` (mostly about canopy/accessibility/clearance). This is a data/dictionary limitation, not a scorer bug; validation below targets a real Medium example instead of a fabricated High one. (High *is* reachable for graph-native intents — the "What's the evidence for this?" trace produces it directly, since that path doesn't depend on entity-label overlap at all.)
- **`ResponsePlan.layout === "revision"` is explicitly out of scope** — Evidence Engine has no notion of "what changed between revisions" (that lives on `KnowledgeObject.revisions`, untouched). It returns an explicit "Revision comparison isn't available yet" `unknown` result rather than misrepresenting a relationship as a diff, or misrepresenting "not built" as "no evidence."
- **Comparison degrades honestly** to `unknown` when fewer than two extracted entities each independently produce non-empty, non-identical evidence — no fabricated two-column comparison when the graph doesn't actually support one.
- **Workflow-routed queries** (`requirement_workflow`/`decision_workflow`/`issue_workflow`/`action_workflow` — reached only if a user explicitly asks Delta something that reads as a statement rather than a question) return an explicit `unknown` result noting this looks like a workflow item, not a question — no evidence collection is attempted, preserving Sprint 4.2's "advisory only, nothing executes" guarantee.
- **`lib/delta-mock-responses.ts` deleted outright** — its only remaining caller was rewritten in this same change; no dormant fallback retained (a standing temptation to reintroduce fabricated answers otherwise).
- **How future AI modules plug in**: `EvidenceEngine`, `ConfidenceScorer`, and `ReasoningEngine` all follow the interface + implementation class + exported default singleton pattern established since Sprint 4.1. A future embeddings-backed `EvidenceEngine` (semantic search instead of literal string matching) or an LLM-backed `ReasoningEngine` (richer explanations) is a drop-in replacement — `delta-query-resolver.ts` calls each through its exported singleton, never a hardcoded class.

---

# Acceptance Criteria

- [x] `EvidenceEngine` collects generic, relationship-driven evidence — current discussion first, then linked knowledge objects, then project-wide — ranked and deduplicated.
- [x] `ReasoningEngine` produces structured found/missing/conclusion reasoning without inventing any claim the evidence doesn't support.
- [x] `ConfidenceScorer` produces a deterministic High/Medium/Low/None level from evidence alone, no AI.
- [x] `ResponsePlanner`'s layout (computed since Sprint 4.2) genuinely drives the response shape: Simple Answer, Comparison, Related Knowledge, or Unknown.
- [x] No response value is ever fabricated — every rendered fact traces to a real `Relationship` or its underlying discussion/knowledge-object content.
- [x] A query with insufficient evidence always produces an explicit `unknown` result (message + evidence found + missing evidence + confidence), never a guess.
- [x] Confidence and reasoning are shown for every non-clarification response in `DeltaResponsePanel`.
- [x] `lib/delta-mock-responses.ts` is fully removed.
- [x] Journal, Discussion, and Knowledge Object pages are unaffected.

---

# Validation

The implementation must:

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`)
- [x] Journal, Discussion, and Knowledge Object pages still compile and render
- [x] `RelationshipRepository` and its service/actions remain unchanged

---

# Completion Notes

Completed work:

- `types/evidence.ts` — generic `ConfidenceLevel`, `Evidence` (`{id, title, type, relationship, relevance, confidence, excerpt?}`), `ReasoningResult` (`{found, missing, conclusion}`).
- `lib/intelligence-engine/evidence-engine.ts` — `RelationshipEvidenceEngine` (singleton `evidenceEngine`). Graph-native path (evidence/impact/related_knowledge) preserves the narrower-tier-first cascade across node → linked-KO → project. Generic path gathers all three tiers unconditionally, matches candidates via AND-across-all-extracted-entities (OR-fallback over significant words when zero entities were extracted), checking each candidate's label and — for discussion/knowledge-object nodes — richer content (summary/messages, title/description) fetched via existing server actions. Excludes the reference node from matching (see bug note above). Dedupes by node id, ranks by tier-weighted relevance, caps at 6.
- `lib/intelligence-engine/confidence-scorer.ts` — `TieredConfidenceScorer` (singleton `confidenceScorer`). High: ≥2 direct-evidence items at current-context tier (confidence ≥0.525). Medium: exactly 1 such item, or ≥1 indirect (impact/related) item at current-context tier. Low: evidence exists only at project tier or below the strength threshold. None: empty.
- `lib/intelligence-engine/reasoning-engine.ts` — `DeterministicReasoningEngine` (singleton `reasoningEngine`). `found` lines state only that a relationship exists and its type (never a fabricated semantic claim); `missing` lists absent evidence node types from the existing `evidenceNodeTypeOrder`, excluding the current context's own type; `conclusion` is a fixed string keyed by confidence, naming the query's subject when entities were extracted.
- `lib/intelligence-engine/delta-query-resolver.ts` — rewritten. New result union (`DeltaAnswerResult`, `DeltaComparisonResult`, `DeltaRelatedResult`, `DeltaUnknownResult`, `DeltaClarificationResult` — unchanged) replaces the old mock-based one. Clarification handling unchanged. Workflow-routed and revision-layout queries return an explicit `unknown` without attempting evidence collection. Everything else runs Evidence → Confidence → Reasoning and shapes the result by `ResponsePlan.layout`.
- `components/delta/DeltaResponsePanel.tsx` — new shared `ConfidenceBadge`, `EvidenceList`, `ReasoningSection`; `answer`/`related` kinds now show confidence + evidence + reasoning (the fabricated "Approved By" pills are gone — that data no longer exists); new `comparison` (side-by-side subject evidence) and `unknown` (message + what was found + what's missing) rendering branches.
- `lib/delta-mock-responses.ts` deleted.

Known issues:

- Full authenticated visual verification in a browser was not possible in this environment (no test credentials) — the same limitation every prior sprint documented. Verified instead via `npx tsc --noEmit`, `npm run lint`, `npm run build` (all clean), a restarted dev server returning the same clean, error-free responses for `/`, `/projects`, `/projects/new`, `/auth`, `/participants`, `/review` as prior sprints, and — critically, since this sprint is about behavioral correctness, not just plumbing — a temporary, unauthenticated smoke-test API route (added and removed within this session, never part of the committed change) that called `resolveDeltaQuery` directly against the real seed data for project `3c2384a0-bc60-4116-ba8c-5f1f52eedb42`:
  - "What's the evidence for this?" in `conv-accessibility` → `kind:"related"`, 3 real items (meeting/drawing/photo), confidence **High**.
  - "Where is the entrance?" in the same discussion → `kind:"answer"`, `value:"Weather-protected clearance to accessible entrance"` (a real Requirement's own label, not a fabricated string), confidence **Medium** — the expected ceiling given the current seed data/dictionary overlap.
  - "Is the staircase located at the entrance?" → intercepted by Sprint 4.1's existing entity-ambiguity clarification (`staircase` always has a `fire staircase` dictionary alternative) before evidence collection even runs — a legitimate, unchanged "don't guess" path, not the new Unknown mechanic.
  - "Where is the toilet?" (an unambiguous entity with zero matching seed data) → `kind:"unknown"`, confidence **None**, explicit "I couldn't determine an answer" message, empty evidence, populated missing-evidence list — proving the new honest-failure path is real, not just typed.
- `High` confidence is unreachable for generic (non-graph-native) intents given the current entity dictionary vs. relationship label overlap — expected, documented above, not a defect.
- `ResponsePlan.layout === "comparison"` was not exercised against real seed data with two genuinely distinct, evidence-backed entities (the dictionary's material terms — marble/wood/steel/glass/granite — aren't linked to any seeded relationship); the degrade-to-`unknown` path was verified by code review, not a live comparison example.
- Workflow-routed and revision-layout `unknown` messages are generic, not evidence-specific — acceptable since no evidence collection is attempted for either case by design.

Follow-up work:

- Wire real embeddings/semantic search into `EvidenceEngine` (currently literal string matching) once that sprint arrives — the interface + singleton pattern makes this a drop-in swap.
- Revisit Comparison once the entity dictionary or seed data has genuinely comparable subjects to validate against live data instead of by code review alone.
- Build the actual Requirement/Decision/Issue/Action workflow handlers the Orchestrator's routing already names, replacing the current generic "this looks like a workflow item" message with a real create-workflow action.
- Implement revision comparison (`ResponsePlan.layout === "revision"`) against `KnowledgeObject.revisions` in a future sprint.
- `knowledgeObjectId`-derived context scoping (carried forward from Sprints 4.1/4.2) remains unimplemented.

Modified files:

New: `types/evidence.ts`, `lib/intelligence-engine/evidence-engine.ts`, `lib/intelligence-engine/confidence-scorer.ts`, `lib/intelligence-engine/reasoning-engine.ts`.

Deleted: `lib/delta-mock-responses.ts`.

Changed: `lib/intelligence-engine/delta-query-resolver.ts`, `components/delta/DeltaResponsePanel.tsx`.
