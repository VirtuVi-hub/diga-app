# Sprint: Delta Comprehension Engine (DCE)

Status: Complete
Sprint ID: 4.1
Target Version: v4.1
Owner: Delta engineering
Created: 2026-08-01
Last Updated: 2026-08-01

---

# Objective

Build the first stage of every Delta interaction: a standalone `DeltaComprehensionService` that understands the user's message — normalizing it, understanding its language, classifying intent, extracting entities, resolving on-screen context, and predicting the most likely destination — *before* anything queries the Design Intelligence Graph (`RelationshipRepository`, Sprint 4.0). This sprint is not a UI redesign; it is the understanding layer the future pipeline (User → Comprehension → Knowledge Graph → Reasoning → Answer) depends on.

---

# Background

Sprint 4.0 built the generic `Relationship`/`RelationshipRepository` foundation. Today, Delta's "Ask Delta" flow (`useDeltaPanel` → `lookupDeltaMock`) does raw keyword matching against unnormalized text, and pressing Enter in a discussion prompt always creates a new Discussion regardless of what the user actually meant. Per `02_ARCHITECTURE.md`, "The assistant should never contain business logic. It is only an interface to the knowledge model" — this sprint moves the understanding logic out of UI components and into a dedicated, modular service, so future AI/LLM improvements can replace individual modules without touching the rest of the architecture.

---

# Scope

## In Scope

- `NormalizationService` — spelling/abbreviation/synonym/whitespace/casing normalization, dictionary-driven and configurable.
- `LanguageService` — English / Hindi / Hinglish detection and internal-only translation to English, rule-based.
- `IntentClassifier` — classifies into Location/Status/Approval/Reason/Dimension/Material/Requirement/Decision/Action/Issue/Risk/Conflict/Evidence/Impact/Comparison/Revision/Related Knowledge.
- `EntityExtractor` — dictionary-driven, extensible entity extraction (no closed enum of entity types).
- `ContextResolver` — resolves current page/discussion/knowledge object/project into a structured context.
- `DestinationPredictor` — predicts Delta Query / New Discussion / New Requirement / New Decision / New Issue / New Action.
- Confidence score on every stage; a low-confidence overall result produces a clarifying question instead of a guess.
- `DeltaComprehensionService` orchestrating all of the above, each module independently replaceable (constructor-injected, not hardcoded imports).
- Wiring the existing "Ask Delta" flow (`useDeltaPanel`) to run every query through `DeltaComprehensionService` first; intents that map onto existing relationship types (Evidence/Impact/Related Knowledge) now query the real `RelationshipRepository` via its actions when discussion context is available, falling back to the existing mock scenario matcher otherwise.
- Minimal, additive UI surfacing only where needed to prove the pipeline is live: a clarification rendering branch in `DeltaResponsePanel`, and a small non-blocking destination-prediction hint in the Journal's discussion prompt.

## Out of Scope

- Embeddings, semantic search, graph reasoning, LLM prompting, OCR, upload intelligence, revision comparison (explicitly excluded per brief).
- Redesigning the Enter-key submit flow's actual behaviour — it still creates a Discussion/reply exactly as before. Destination Prediction is computed and surfaced as a hint only; the user's explicit action is never overridden ("the user always has the final decision").
- Any visual/UX redesign beyond what's needed to demonstrate the engine is wired in.

---

# Files Expected to Change

- `types/comprehension.ts` (new)
- `lib/comprehension/normalization-service.ts`, `language-service.ts`, `intent-classifier.ts`, `entity-extractor.ts`, `context-resolver.ts`, `destination-predictor.ts`, `delta-comprehension-service.ts`, `delta-query-resolver.ts` (all new)
- `components/delta/useDeltaPanel.ts`, `DeltaResponsePanel.tsx`, `DiscussionPrompt.tsx`, `ReplyBar.tsx`, `DiscussionMessages.tsx`, `DiscussionDetail.tsx`, `DiscussionCard.tsx`, `Workspace.tsx`

---

# Files That Must Not Change

- `lib/repositories/relationship-repository.ts` and its service/actions (Sprint 4.0) — the Comprehension Engine is a new caller of this existing API, not a modification of it.
- `lib/delta-mock-responses.ts`'s existing scenario data/shape — kept as the fallback path, unchanged.

---

# Constraints

- Follow `PROJECT_CONTEXT/02_ARCHITECTURE.md`, `05_PRODUCT_DECISIONS.md`, `06_DESIGN_PRINCIPLES.md`.
- No comprehension logic inside UI components — components only call the service (directly or via the hook), never implement normalization/intent/entity rules themselves.
- Each module independently replaceable — no module reaches into another's internals.
- Mock/deterministic implementations only; no real AI/LLM calls.
- Preserve existing functionality (Journal, Discussion, Ask Delta must keep working).

---

# Implementation Notes (Architecture Decisions)

- **Module shape differs deliberately from the Sprint 4.0 repository pattern.** `KnowledgeObjectService`/`RelationshipService` are `static`-method classes with a hardcoded downstream import — fine for a repository facade, but incompatible with "independently replaceable" modules. Every Comprehension module instead follows **interface + implementation class + exported default singleton**, and `DeltaComprehensionService` takes its six collaborators as constructor parameters (defaulting to the singletons). Swapping in a future LLM-backed `IntentClassifier` means passing a different instance to the constructor — zero changes to the orchestrator or any other module.
- **`lib/` vs `types/` split** follows the existing convention: public shapes in `types/comprehension.ts`; dictionaries, rules, and implementations in `lib/comprehension/`.
- **Normalization** is phrase-dictionary based (longest-match-first, case-insensitive), covering spelling variants, abbreviations, and synonyms in one configurable `Record<string, string>` — growing the dictionary requires no code changes.
- **Language understanding** is pattern-rule based (`{ pattern: RegExp; translate: (match) => string }`), because Hindi/Hinglish→English requires reordering words, not just token substitution — a plain synonym dictionary can't turn "staircase kahan hai" into "Where is the staircase?". Falls back to naive per-token substitution (lower confidence) when no full-sentence rule matches, and passes English straight through.
- **Intent classification** is ordered regex rules — order encodes priority (e.g. "why" must be checked before "dimension" so "Why is the staircase 4 ft?" classifies as Reason, not Dimension, matching the brief's own example).
- **Entity extraction** is dictionary-driven (`{ term, type }`), where `type` is an open string, not a closed union — adding a new entity kind is a data change, not an architecture change. Ambiguous partial matches (e.g. "stair" matching both "staircase" and "fire staircase") are surfaced with lower confidence and become clarification candidates.
- **Confidence & clarification**: every module returns a 0–1 confidence; `DeltaComprehensionService` takes the minimum across intent/entities/destination and asks for clarification below a shared threshold (0.5), per the brief's "Did you mean: Staircase / Fire Staircase" example.
- **Context resolution** only resolves what it's given (page/discussion/knowledge object/project) — the actual "where is the user right now" wiring is the caller's responsibility (React components already know their own `discussionId`/`projectId`), threaded down to `useDeltaPanel` as an optional `context` argument.
- **Delta query integration**: `resolveDeltaQuery()` runs comprehension first; if the classified intent is Evidence/Impact/Related Knowledge *and* a discussion context is resolved, it queries `RelationshipRepository` via its existing actions (`getEvidenceForNode`/`getImpactsForNode`/`queryRelationships`) and shapes the result into the existing `DeltaRelatedResult` UI shape. Every other intent (and any query without context) falls back to the existing `lookupDeltaMock`, now fed the *normalized and translated* text rather than the raw string — this is why every query, not only the ones that touch the graph, genuinely passes through the Comprehension Engine first.

---

# Acceptance Criteria

- [x] `DeltaComprehensionService` exists as a standalone service with six independently-replaceable modules.
- [x] Normalization handles spelling/abbreviation/synonym/whitespace/casing per the brief's examples.
- [x] Language understanding handles the three English/Hindi/Hinglish examples from the brief.
- [x] Intent classification produces the intents shown in the brief's four examples.
- [x] Entity extraction produces structured, typed entities per the brief's two examples.
- [x] Context resolution understands discussion/project/page context when supplied by the caller.
- [x] Destination prediction produces the five destinations shown in the brief's examples.
- [x] Every stage returns a confidence score; low confidence triggers a clarifying question instead of a guess.
- [x] No comprehension logic lives inside a UI component.
- [x] Delta queries pass through `DeltaComprehensionService` before querying `RelationshipRepository`.

---

# Validation

The implementation must:

- [x] Pass lint
- [x] Pass type checking
- [x] Pass build
- [x] Journal and Discussion still work
- [x] Delta queries verifiably pass through `DeltaComprehensionService` before querying `RelationshipRepository`

---

# Completion Notes

Completed work:

- `types/comprehension.ts` — public shapes for every pipeline stage (`NormalizationResult`, `LanguageResult`, `ClassifiedIntent`, `ExtractedEntity`, `ResolvedContext`, `DestinationPrediction`, `ClarifyingQuestion`, `ComprehensionResult`). `DeltaIntent`/`DeltaDestination` are closed unions (the brief lists a fixed set); `ExtractedEntity.type` is an open string by design.
- `lib/comprehension/normalization-service.ts` — `RuleBasedNormalizationService`, longest-phrase-first dictionary replacement, verified against all of the brief's spelling/abbreviation examples (staircse/staircas/stair case/stairs → staircase; Fire Door/FR Door → Fire Rated Door; CL → Client; PMC → Project Management Consultant; WC/Washroom → Toilet).
- `lib/comprehension/language-service.ts` — `RuleBasedLanguageService`, Devanagari-script + romanized-marker-token detection, three structural sentence rules for the brief's exact Hinglish examples ("staircase kahan hai?" → "Where is the staircase?", "fire exit ka kya hua?" → "What is the status of the fire exit?", "client ne marble bola tha?" → "Did the client request marble?"), with a lower-confidence per-token fallback for anything a rule doesn't cover.
- `lib/comprehension/intent-classifier.ts` — `RuleBasedIntentClassifier`, ordered regex rules covering all 17 intents from the brief; verified against all four worked examples, including the Reason-vs-Dimension ordering case ("Why is the staircase 4 ft?").
- `lib/comprehension/entity-extractor.ts` — `DictionaryEntityExtractor`, `{ term, type }` dictionary with an open `type` string; verified against both brief examples (Entity: Staircase / Context: Entrance; Participant: Client / Material: Marble). Also implements the ambiguity mechanic from Part 7's own example: a shorter dictionary term contained inside a longer one (e.g. "staircase" inside "fire staircase") is surfaced at low confidence with both as `alternatives`.
- `lib/comprehension/context-resolver.ts` — `DefaultContextResolver`, carries through whatever page/discussion/knowledge-object/project context the caller supplies.
- `lib/comprehension/destination-predictor.ts` — `RuleBasedDestinationPredictor`, question-detection first (→ Delta Query), then ordered statement rules; verified against all five brief examples (staircase question → Delta Query; "Client wants..." → Requirement; "Let's shift..." → Discussion; "Door width should become..." → Requirement; "We have a clash..." → Issue). Falls back to New Discussion (today's existing default) when nothing matches.
- `lib/comprehension/delta-comprehension-service.ts` — orchestrator; six collaborators as constructor parameters defaulting to the singletons above, so any module can be swapped by passing a different instance. Confidence threshold 0.5 (`CONFIDENCE_THRESHOLD`); the lowest confidence across intent/entities/destination decides `needsClarification`, wired to the entity-ambiguity mechanic for a concrete "Did you mean: Staircase / Fire Staircase" clarification.
- `lib/comprehension/delta-query-resolver.ts` — the concrete integration point requested in validation. Every Ask-Delta query now calls `deltaComprehensionService.comprehend()` first. If the classified intent is Evidence/Impact/Related Knowledge and a discussion is resolved in context, it queries the real `RelationshipRepository` via `getEvidenceForNode`/`getImpactsForNode`/`queryRelationships` (Sprint 4.0) and shapes the result into the existing `DeltaRelatedResult` UI shape. Every other intent — and any query without discussion context — falls back to the unchanged `lookupDeltaMock`, now fed the normalized/translated text.
- UI wiring (all additive, no redesign): `useDeltaPanel` now calls `resolveDeltaQuery` instead of `lookupDeltaMock` directly and accepts an optional `context` argument; `DeltaResponsePanel` gained one new rendering branch for the `"clarification"` result kind; `DiscussionPrompt` shows a small non-blocking destination-prediction badge (e.g. "→ Requirement") next to the input as the user types, without changing what pressing Enter/Send actually does; `ReplyBar`, `DiscussionMessages`, `DiscussionDetail`, `DiscussionCard`, and `Workspace` were threaded with an optional `context` prop so each Ask-Delta entry point knows its own discussion/project/page — the concrete implementation of Part 5's context resolution.

Known issues:

- Full authenticated visual verification in a browser was not possible in this environment (no test credentials); verified instead via `npx tsc --noEmit`, `npm run lint`, `npm run build`, manual trace of every worked example in the brief against the rule tables above, and confirming the live dev server (already running with an authenticated browser session) kept returning clean 200s with no runtime errors through every edit. A real browser pass — especially exercising the clarification flow and the destination hint — is recommended before full sign-off.
- Language detection and translation are pattern-based for a small, literal set of sentence shapes; genuinely novel Hindi/Hinglish phrasing outside the three brief examples will fall through to the lower-confidence per-token fallback rather than a correct translation. This is the expected limitation of a deterministic mock, per Part 9.
- Destination Prediction does not (and per this sprint's scope, should not yet) change what pressing Enter/Send actually creates — it is a hint only, so "the user always has the final decision" holds by construction, not by extra guard logic.
- The Journal-level `DiscussionPrompt` only has `projectId` in context (no discussion yet, since it creates one); `ReplyBar`/`DiscussionMessages` inside an existing discussion have both `discussionId` and `projectId`. This matches the brief's stated context priority (page → discussion → knowledge object → project) exactly as much as each call site's real context supports.

Follow-up work:

- Wire `knowledgeObjectId` context from the Knowledge Object Detail page (Sprint 4.0) into an Ask-Delta entry point there — no such entry point exists yet on that page, so this context field is implemented but currently unused.
- Replace individual mock modules with real implementations (e.g. an LLM-backed `IntentClassifier`/`LanguageService`) as they become available — the constructor-injection design means this never requires touching `DeltaComprehensionService` itself.
- Semantic search, graph reasoning, embeddings, LLM prompting, OCR, upload intelligence, revision comparison — all explicitly out of scope, to be built on top of this foundation.
- Consider surfacing Destination Prediction as an actual actionable suggestion (not just a label) once product direction on that interaction is decided.

Modified files:

New: `types/comprehension.ts`, `lib/comprehension/normalization-service.ts`, `lib/comprehension/language-service.ts`, `lib/comprehension/intent-classifier.ts`, `lib/comprehension/entity-extractor.ts`, `lib/comprehension/context-resolver.ts`, `lib/comprehension/destination-predictor.ts`, `lib/comprehension/delta-comprehension-service.ts`, `lib/comprehension/delta-query-resolver.ts`.

Changed: `components/delta/useDeltaPanel.ts`, `components/delta/DeltaResponsePanel.tsx`, `components/delta/DiscussionPrompt.tsx`, `components/delta/ReplyBar.tsx`, `components/delta/DiscussionMessages.tsx`, `components/delta/DiscussionDetail.tsx`, `components/delta/DiscussionCard.tsx`, `components/delta/Workspace.tsx`.
