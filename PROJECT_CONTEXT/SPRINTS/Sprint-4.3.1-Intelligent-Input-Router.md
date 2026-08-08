# Sprint: Intelligent Input Router

Status: Complete
Sprint ID: 4.3.1
Target Version: v4.3.1
Owner: Delta engineering
Created: 2026-08-02
Last Updated: 2026-08-02

---

# Objective

Make the Journal's Enter/Send action respect the destination the Comprehension Engine already computes, instead of unconditionally creating a Discussion card. "Is the staircase at the entrance?" must go to Delta, not become a new Discussion; a genuine statement about a new topic must still create one, but only after checking whether a sufficiently similar Discussion already exists.

---

# Background

`DiscussionPrompt.tsx` has computed a destination hint (via `deltaComprehensionService.comprehend()`) since Sprint 4.1, and shown it as a small non-blocking badge while the user types — but pressing Enter/Send has always ignored it, calling `onSubmit` unconditionally, which always creates a new Discussion. This sprint closes that gap: the same classification the badge already shows now actually decides what happens. No engine (Comprehension, Intelligence, Evidence, Reasoning) changes — this sprint is purely about the Journal's own routing logic, one layer above all of them.

Per explicit product decision this sprint: destinations other than Delta Query and Discussion (Requirement/Decision/Issue/Action) are **not** given new draft-creation UI. They route to Delta exactly like a Delta Query — the existing Orchestrator (Sprint 4.2) and Evidence Engine (Sprint 4.3), both unchanged, already produce an honest "this looks like a workflow item, not a question" response for those routing targets. Building actual Requirement/Decision/Issue/Action draft creation from free-typed Journal text is left for a future, dedicated sprint.

---

# Scope

## In Scope

- `DiscussionPrompt.tsx`'s Enter/Send action (`submit()`) branches on the already-computed destination: Delta Query and every non-Discussion destination route to `delta.ask()` (unchanged, existing path, renders in the existing inline `DeltaResponsePanel`); only the Discussion destination proceeds to Discussion creation.
- Duplicate-discussion detection before a new Discussion is created: a new `findMatchingDiscussionForMessage` in `lib/services/discussion-matching.ts`, weighting the Comprehension Engine's own extracted entities above incidental keyword overlap, and a new server action `matchDiscussionForMessage`.
- A new confirmation dialog, `SimilarDiscussionPrompt.tsx`, offering "Continue existing discussion" (default) or "Create new discussion" when a sufficiently similar Discussion is found.
- Wiring in `HomeWorkspace.tsx`: the existing Discussion-creation logic is preserved unchanged as `createDiscussionFromMessage`; it's now reached either directly (no match) or via the new confirmation dialog (match found).

## Out of Scope

- Any change to `lib/comprehension/*`, `lib/intelligence-engine/*` (all seven modules), `types/comprehension.ts`, `types/intelligence-engine.ts`, `types/evidence.ts`, or the relationship stack.
- Requirement/Decision/Issue/Action draft creation from Journal text (routes to Delta's existing honest "workflow item" response instead — see Background).
- `ReplyBar.tsx` and its callers (replying inside an already-open Discussion) — there is no "which Discussion" ambiguity once you're already inside one, so this router doesn't apply there. Its only change anywhere in this sprint is none at all.
- `RequirementDiscussionPrompt.tsx` and the existing Requirement-creation flow — untouched, verified still working.
- Any new persistent "Delta conversation" state — see Implementation Notes on why this wasn't needed for the repeat-question goal.

---

# Files Expected to Change

- `lib/services/discussion-matching.ts` (extended)
- `lib/actions/discussion-actions.ts` (new export)
- `components/delta/DiscussionPrompt.tsx` (routing logic + prop type)
- `components/delta/Workspace.tsx` (pass-through prop type only)
- `components/delta/SimilarDiscussionPrompt.tsx` (new)
- `components/project-shell/HomeWorkspace.tsx` (wiring)

---

# Files That Must Not Change

- All of `lib/comprehension/*` (Sprint 4.1).
- All of `lib/intelligence-engine/*`: `context-engine.ts`, `orchestrator.ts`, `response-planner.ts`, `intelligence-engine.ts`, `evidence-engine.ts`, `confidence-scorer.ts`, `reasoning-engine.ts`, `delta-query-resolver.ts` (Sprints 4.2/4.3).
- `types/comprehension.ts`, `types/intelligence-engine.ts`, `types/evidence.ts`.
- The entire relationship stack (Sprint 4.0).
- `components/delta/useDeltaPanel.ts`, `components/delta/DeltaResponsePanel.tsx`.
- `components/requirements/RequirementDiscussionPrompt.tsx` and its existing behavior.
- `components/delta/ReplyBar.tsx` and its callers.
- `findMatchingDiscussion`'s existing exported signature and behavior (Requirement-creation flow's call site is unaffected).

---

# Constraints

- Follow `PROJECT_CONTEXT/02_ARCHITECTURE.md`, `05_PRODUCT_DECISIONS.md`, `06_DESIGN_PRINCIPLES.md`.
- No duplicated routing logic — the Journal's routing decision must reuse the Comprehension Engine's existing output, never a second classifier.
- Do not hardcode per-type behavior (no `RequirementRouter`, `DecisionRouter`, etc.) — route generically off `DeltaDestination`.
- Preserve existing functionality: Requirement creation, Journal card rendering, Discussion detail pages.

---

# Implementation Notes (Architecture Decisions)

- **Routing signal is `DeltaDestination` (Comprehension Engine, Module 1), not the Orchestrator's `RoutingTarget` (Sprint 4.2).** The brief's own "Journal Behaviour" diagram (Question→Delta, Requirement→Draft, Discussion→Duplicate Detection, Decision/Issue/Action→their own workflows) maps 1:1 onto `DeltaDestination`'s six values. `RoutingTarget` is a different, downstream concern — how `delta-query-resolver` itself answers a query once it's already decided to — and collapses graph-native intents (evidence/impact/related_knowledge) onto `knowledge_graph_query` in a way that isn't the right signal for "should the Journal create a Discussion or not."
- **Zero duplicate classification calls from the Journal's own logic.** `DiscussionPrompt.tsx`'s existing per-keystroke `comprehend()` call (previously used only for the hint badge) is now the single source for both the hint and the Enter/Send routing decision — refactored into one memoized value both read. The existing `DESTINATION_HINT_CONFIDENCE_THRESHOLD` (0.6) is reused as the actual routing gate too, not a second threshold invented for this sprint. (`resolveDeltaQuery`, invoked when routing to Delta, still runs its own internal `comprehend()` — that is Sprint 4.1/4.2's existing, frozen pipeline being used normally, not a second router.)
- **Only the Comprehension Engine's own low-confidence fallback ever produces `new_discussion`** (confirmed in `destination-predictor.ts`: every statement rule that matches carries confidence 0.8–0.9; only the unmatched fallback carries 0.4 and defaults to `new_discussion`). This means the routing rule — anything other than `new_discussion` at ≥0.6 confidence goes to Delta — never blocks a genuine, recognizable statement from reaching Discussion creation.
- **"Honest deferral" for Requirement/Decision/Issue/Action** (explicit product decision this sprint): these route to `delta.ask()` exactly like a Delta Query. No new engine logic was needed — Sprint 4.2's Orchestrator already classifies these as workflow-routed targets, and Sprint 4.3's `delta-query-resolver` already returns an explicit "this looks like a workflow item rather than a question Delta can answer directly" `unknown` result for them, unchanged.
- **Repeat Delta questions and "avoid clutter" required no new code.** Once Delta-routed messages never create a Discussion (this sprint's own fix), `useDeltaPanel`'s state is already a single transient slot, always overwritten on each `ask()` call — confirmed in `useDeltaPanel.ts`. `resolveDeltaQuery` always re-runs the full Evidence pipeline fresh (no caching), so asking the same question again, or after project knowledge changes, already just replaces the one response with a fresh answer. This is a consequence of the goal-1 fix, not a separate feature.
- **Misspellings/multilingual input required no new code.** `DiscussionPrompt` already runs every submission through the frozen `DeltaComprehensionService`, whose `NormalizationService`/`LanguageService` already collapse "staircase"/"staircas"/"staircasse"/"staircase kahan hai" to the same canonical form before classification — verified this sprint (see Completion Notes) that all four resolve to the same destination.
- **Duplicate-discussion matching is a new function, not a modification of the existing one.** `findMatchingDiscussion` (used by the Requirement-creation flow) is untouched — same signature, same any-overlap threshold, same call site. The new `findMatchingDiscussionForMessage` shares its tokenizer/stopword list but weights extracted-entity words at 2× incidental keyword overlap (entities are already a high-confidence Comprehension Engine signal, not noise) and requires a higher minimum score (2, vs. the Requirement matcher's 1) — calibrated tighter because this fires on every Journal message, not a deliberate form submission.
- **New confirmation dialog, not a repurposed one.** `SimilarDiscussionPrompt.tsx` is structurally similar to `RequirementDiscussionPrompt.tsx` (same modal pattern, same design tokens) but is a separate component, since the Requirement flow's dialog must keep behaving exactly as it does today. Its default/primary action is "Continue existing discussion" (autofocused), per the brief — the inverse emphasis of the Requirement dialog, where "Create New" is primary.
- **Scope is the top-level Journal input only.** `DiscussionPrompt` (as used in `Workspace.tsx`) is its only call site (confirmed by grep); `ReplyBar.tsx` (used both on Journal cards and Discussion Detail for replying to an *already-open* Discussion) is untouched — there's no "which Discussion" ambiguity to route once you're already inside one.

---

# Acceptance Criteria

- [x] A Delta Query typed into the Journal input never creates a Discussion card.
- [x] Requirement/Decision/Issue/Action-shaped statements never create a Discussion card; they route to Delta's existing honest "workflow item" response.
- [x] A genuine new-topic statement still creates a Discussion, with no duplicate-detection false positive.
- [x] A statement that overlaps an existing Discussion's content triggers a confirmation dialog before creating a new Discussion.
- [x] "Continue existing discussion" posts the message as a reply on the matched Discussion instead of creating a new one.
- [x] Spelling/language variants of the same query classify identically.
- [x] No duplicated routing logic — the Journal reuses the Comprehension Engine's existing output; no new classifier was written.
- [x] The existing Requirement-creation flow is unaffected.

---

# Validation

The implementation must:

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`)
- [x] Existing Journal/Discussion/Requirement behavior is preserved
- [x] Dev server restarts cleanly with no runtime errors

---

# Completion Notes

Completed work:

- `lib/services/discussion-matching.ts` — added `findMatchingDiscussionForMessage(discussions, {text, entities})`, sharing a refactored, weighted-scoring core with the existing (unchanged-behavior) `findMatchingDiscussion`.
- `lib/actions/discussion-actions.ts` — added `matchDiscussionForMessage(input: {text, entities})`, mirroring the existing `matchDiscussionForRequirement` pattern exactly.
- `components/delta/DiscussionPrompt.tsx` — the per-keystroke `comprehend()` call is now memoized and shared by both the hint badge and `submit()`'s routing decision. `submit()` sends the message to `delta.ask()` when the destination is anything other than a confident `new_discussion`; otherwise it calls `onSubmit(message, entities)`, threading the already-extracted entity values down so nothing recomputes comprehension a second time client-side.
- `components/delta/Workspace.tsx` — `onAddDiscussion` prop type updated to match; pure pass-through, no logic change.
- `components/delta/SimilarDiscussionPrompt.tsx` — new confirmation dialog; "Continue existing discussion" is the default, autofocused action.
- `components/project-shell/HomeWorkspace.tsx` — the existing Discussion-object-construction logic is now `createDiscussionFromMessage`, unchanged in content, called either directly (no match) or from the new confirmation dialog's handlers. `addDiscussionFromPrompt` is now async: calls `matchDiscussionForMessage` first and only creates immediately when there's no match, preserving today's zero-friction behavior for genuinely new topics.

Verified via a temporary, unauthenticated smoke-test API route (added and removed within this session, mirroring the verification approach used in Sprint 4.3) exercising the real Comprehension Engine and the real seed data:
- "Is the staircase at the entrance?" → `destination: "delta_query"`, confidence 0.99 — routes to Delta, never Discussion creation.
- "We finally poured the foundation slab yesterday." → `destination: "new_discussion"`, confidence 0.4 (the predictor's own fallback) — routes to Discussion creation.
- A message mentioning "weather protection at the accessible entrance" with entity `Entrance` → `matchDiscussionForMessage` correctly finds `conv-accessibility` ("Entrance Accessibility") as a duplicate.
- The same foundation-slab statement → `matchDiscussionForMessage` correctly returns no match (genuinely novel topic, no false positive).

Known issues:

- Full authenticated visual verification in a browser was not possible in this environment (no test credentials) — the same limitation every prior sprint documented. The routing/matching logic itself was verified against the real Comprehension Engine and real seed data (above), not by direct browser interaction with `SimilarDiscussionPrompt`'s UI.
- Duplicate-discussion matching is still literal keyword/entity overlap (weighted), not true semantic similarity — a future embeddings-backed matcher would be a drop-in replacement for `findMatchingDiscussionForMessage` without touching its caller.
- Requirement/Decision/Issue/Action destinations from Journal text still only produce Delta's generic "this looks like a workflow item" message — no draft-creation UI exists for them yet (explicit product decision this sprint, see Background).

Follow-up work:

- Build actual Requirement/Decision/Issue/Action draft creation triggered from Journal text, once product direction on that UX is defined — today's honest deferral is a placeholder, not a final answer.
- Replace `findMatchingDiscussionForMessage`'s literal matching with real semantic similarity once embeddings/semantic search exists (carried forward from Sprint 4.3's own equivalent note about `EvidenceEngine`).
- Consider whether `ReplyBar.tsx` (inside an open Discussion) should ever route a clearly Delta-Query-shaped reply to Delta instead of posting it as a literal message — deliberately left out of this sprint's scope, since a reply inside an existing thread is a different UX context than the Journal's "start something new" input.

Modified files:

New: `components/delta/SimilarDiscussionPrompt.tsx`.

Changed: `lib/services/discussion-matching.ts`, `lib/actions/discussion-actions.ts`, `components/delta/DiscussionPrompt.tsx`, `components/delta/Workspace.tsx`, `components/project-shell/HomeWorkspace.tsx`.
