# Sprint: Knowledge Capture Engine

Status: Complete
Sprint ID: 4.4
Target Version: v4.4
Owner: Delta engineering
Created: 2026-08-02
Last Updated: 2026-08-02

---

# Objective

Since Sprint 4.3.1, a Requirement/Decision/Issue/Action-shaped statement typed into the Journal routes to Delta, which honestly replies "this looks like a workflow item, not a question" — correct, but a dead end. This sprint completes the pipeline: Delta now prepares a structured, reviewable **draft** of the Knowledge Object it thinks the user means, backed by real evidence, and shows it for approval. **Nothing enters the Knowledge Graph automatically — AI proposes, humans approve.**

---

# Background

The Intelligence Engine has been able to classify Requirement/Decision/Issue/Action statements since Sprint 4.1 (`DestinationPredictor`) and route them since Sprint 4.2 (`Orchestrator`); Sprint 4.3.1 made the Journal's Enter/Send action actually respect that routing instead of always creating a Discussion. What was still missing was the "instead of just recognizing these, prepare something for review" step — this sprint's whole purpose.

---

# Scope

## In Scope

- A generic `KnowledgeDraft` model (`types/knowledge-draft.ts`) supporting every Knowledge Object type — no per-type shapes.
- `KnowledgeCaptureEngine` (`lib/knowledge-capture/knowledge-capture-engine.ts`) — one pipeline, reusing the frozen Context/Evidence/Confidence/Reasoning Engines exactly as Delta's own answers do.
- A review screen (`KnowledgeDraftReview.tsx`) with Approve / Edit / Cancel — nothing is created until Approve.
- Duplicate detection across the **entire** Knowledge Graph (every Knowledge Object type, not just Requirements) before approval completes.
- Relationship suggestions (Evidence: Discussion/Drawing/Meeting/Reference; Related Requirement/Decision/Issue/Action) — suggested only, never auto-created.
- Confidence (reusing the existing `ConfidenceScorer`) and reasoning (reusing the existing `ReasoningEngine`, plus one new classification-reason line) on every draft.

## Out of Scope

- Any change to `lib/comprehension/*`, `lib/intelligence-engine/*`, or the relationship stack — all reused unchanged.
- Extending the Comprehension Engine's entity dictionary to produce more polished draft titles (see Implementation Notes) — deliberately left frozen.
- Actually creating any suggested relationship as a real `Relationship` row — suggestions only, per the brief.
- Redesigning `ReplyBar.tsx` or any in-discussion reply flow — this sprint, like 4.3.1, is scoped to the top-level Journal input only.

---

# Files Expected to Change

- `types/knowledge-draft.ts` (new)
- `lib/knowledge-capture/knowledge-capture-engine.ts` (new)
- `lib/services/text-similarity.ts` (new, shared core extracted from `discussion-matching.ts`)
- `lib/services/knowledge-object-matching.ts` (new)
- `components/delta/EvidenceDisplay.tsx` (new, extracted from `DeltaResponsePanel.tsx`)
- `components/knowledge-objects/KnowledgeDraftReview.tsx` (new)
- `components/delta/PossibleDuplicateKnowledgePrompt.tsx` (new)
- `lib/repositories/knowledge-object-repository.ts`, `lib/services/knowledge-object-service.ts`, `lib/actions/knowledge-object-actions.ts` (new `listAll()`/`getAllKnowledgeObjects()`/`matchKnowledgeObject()`)
- `lib/services/discussion-matching.ts` (refactored onto the shared core; behavior unchanged)
- `components/delta/DeltaResponsePanel.tsx` (imports extracted display pieces; behavior unchanged)
- `components/requirements/RequirementDiscussionPrompt.tsx` (new optional `typeLabel` prop; default preserves existing behavior)
- `components/delta/DiscussionPrompt.tsx`, `components/delta/Workspace.tsx` (one new routing branch + prop threading)
- `components/project-shell/HomeWorkspace.tsx` (new, additive `journalDraft` state machine)
- `components/delta/DeltaApp.tsx` (legacy demo shell, updated only to keep compiling against `Workspace`'s new prop — same precedent as Sprint 4.0)

---

# Files That Must Not Change

All of `lib/comprehension/*`; all of `lib/intelligence-engine/*` (`context-engine.ts`, `orchestrator.ts`, `response-planner.ts`, `intelligence-engine.ts`, `evidence-engine.ts`, `confidence-scorer.ts`, `reasoning-engine.ts`, `delta-query-resolver.ts`); `types/comprehension.ts`, `types/intelligence-engine.ts`, `types/evidence.ts`, `types/knowledge-object.ts`, `types/relationship.ts`; the entire relationship stack (Sprint 4.0); `useDeltaPanel.ts`; `KnowledgeObjectModal.tsx` (reused, not modified); `SimilarDiscussionPrompt.tsx`; the existing `pendingRequirement`/QuickActions code path's behavior; `findMatchingDiscussion`/`findMatchingDiscussionForMessage`'s public signatures.

---

# Constraints

- Follow `PROJECT_CONTEXT/02_ARCHITECTURE.md`, `05_PRODUCT_DECISIONS.md`, `06_DESIGN_PRINCIPLES.md`, `docs/architecture/ENGINEERING_CONTRACT.md` ("AI assists, never makes business decisions, always produces proposals, users approve changes").
- One generic `KnowledgeCaptureEngine` — no `RequirementDraftService`/`DecisionDraftService`/etc.
- Nothing is ever created or revised except from an explicit Approve / Continue-existing / Create-new user action.
- Preserve existing behavior: Delta Queries, Discussion creation, Discussion duplicate detection, and the QuickActions Requirement flow must not regress.

---

# Implementation Notes (Architecture Decisions)

- **One engine, reusing four frozen ones.** `KnowledgeCaptureEngine.draft()` calls the unmodified `contextEngine.resolveScopes()` (4.2) and `evidenceEngine.collect()` (4.3, the generic entity-matched path, no `relationshipType`) to gather real evidence, the unmodified `confidenceScorer.score()` (4.3) for confidence, and the unmodified `reasoningEngine.explain()` (4.3) for the evidence-based found/missing/conclusion — identical mechanism Delta's own answers already use. Nothing here is a new classifier; it is a new *consumer* of the existing ones.
- **The "why was this drafted" reasoning line is keyed off the draft's `type`, not the 17-way intent classifier — a real bug caught during testing.** The first implementation keyed `CLASSIFICATION_REASON` off `ClassifiedIntent.intent`, reasoning "the destination and intent classifiers usually agree." They don't always: "We decided to use marble for the entrance" classifies destination `new_decision` (correct routing) but intent `material` (a different, finer-grained classification) — so the "Detected decision language" line silently disappeared for that draft, and the same happened for an Issue-shaped statement. Since `type` (derived from the already-confident destination classification) is always reliable and is passed into the engine directly, keying the reason off `type` instead fixed this for every case — verified via a temporary smoke-test route covering all four Knowledge Object types before removal. `ClassifiedIntent` was removed from the engine's signature and from the three call sites that threaded it (`DiscussionPrompt` → `Workspace` → `HomeWorkspace`) since it was no longer used for anything.
- **Title/description generation is a simple, honest deterministic heuristic, not paraphrasing.** Description is the translated statement verbatim (case exactly as the frozen `NormalizationService` produced it — sometimes lowercase, since normalization performs its own casing pass); title strips trailing punctuation, one obligation phrase, and a leading article, then title-cases what remains. This does not produce polished prose like the brief's own illustrative example ("Entrance Ramp Weather Protection") — the entity dictionary (frozen, Sprint 4.1) has no "ramp"/"weather protection" terms, and extending it was deliberately out of scope for this sprint (see Files That Must Not Change). The user edits the title via Edit before approving; this is a documented, honest limitation, not a faked capability.
- **Suggested relationships reuse `Evidence`, not a new node/type system.** Every `Evidence` item the engine collects already *is* a suggestion (`{relationshipType: item.relationship, label: item.title, typeLabel: item.type}`); the current discussion itself is added as one more `evidence` suggestion (fetched via the existing `getDiscussion` action), since it's always relevant context for a draft born from it. `Evidence.type` display labels already cover exactly the brief's example categories (Discussion/Meeting/Drawing/Document/Photo/Video/Reference for evidence-type items; Requirement/Decision/Action/Issue/Risk for impact/related-type items) — zero new type-key handling needed. Nothing here is ever persisted as a real `Relationship` row.
- **Suggested participants** are simply the extracted entities the frozen `EntityExtractor` already tags `type: "participant"` (e.g. "Client", "Lead Architect") — no new extraction logic.
- **Duplicate detection spans every Knowledge Object type**, not just Requirements. `knowledgeObjectRepository` gained one new method, `listAll()`, mirroring the existing `discussionRepository.list()` precedent exactly — a plain enumeration with no relationship-specific logic, so Sprint 4.0's "Knowledge Objects must stay unaware of the graph" boundary holds. `findMatchingKnowledgeObject` (`lib/services/knowledge-object-matching.ts`) shares its weighted-scoring core with `findMatchingDiscussionForMessage` via a new `lib/services/text-similarity.ts` — `discussion-matching.ts` was refactored onto this shared core with its public behavior byte-for-byte unchanged (re-verified against Sprint 4.3.1's own smoke scenarios after the refactor).
- **"Continue existing" revises, it doesn't relink.** When a duplicate Knowledge Object is found, "Continue existing" calls the existing, unmodified `reviseKnowledgeObject` action — appending a revision to the matched object — rather than any new persistence path. "Create new" proceeds to discussion resolution exactly like today's QuickActions Requirement flow.
- **Discussion resolution reuses 4.3.1's already-generic `matchDiscussionForMessage`**, not a new server action, and a **generalized** `RequirementDiscussionPrompt` — one new optional `typeLabel` prop (defaulting to `"requirement"`, so the existing QuickActions call site is textually and behaviorally unchanged) substituted into its existing copy.
- **The state machine lives in `HomeWorkspace.tsx`, additive, not a refactor of the existing Requirement flow.** A new `journalDraft` state (`{draft, stage: "review"|"editing"|"duplicate-knowledge"|"resolve-discussion", ...}`) sits alongside the completely untouched `pendingRequirement`/`isRequirementModalOpen` state that powers today's QuickActions flow. Both funnel through the same shared, generic components and actions (`KnowledgeObjectModal`, `createKnowledgeObject`, `createDiscussion`) — two entry points, one architecture, not two pipelines. This was the deliberately lower-risk choice over generalizing the existing Requirement-specific state itself.
- **No Discussion type code exists yet for Issue/Risk.** `lib/discussion-types.ts`'s `DiscussionTypeCode` has no dedicated code for either (a pre-existing gap, not introduced this sprint); when creating a new Discussion for an Issue or Risk draft, `HomeWorkspace.tsx` falls back to the generic `"QRY"` code rather than inventing a new one, documented as a known limitation.

---

# Acceptance Criteria

- [x] A generic `KnowledgeDraft` model supports every Knowledge Object type — no duplicated models.
- [x] Requirement/Decision/Issue/Action statements generate a structured draft (title, description, priority, evidence, confidence, suggested relationships, suggested participants, reasoning) instead of Delta's old text-only "workflow item" response.
- [x] The review screen supports Approve / Edit / Cancel; nothing is created until Approve.
- [x] Duplicate detection searches the entire Knowledge Graph (every type), not just Requirements, before creation.
- [x] Relationships are suggested, never auto-created.
- [x] Confidence (High/Medium/Low/None) is shown on every draft, derived from the existing `ConfidenceScorer`.
- [x] Reasoning explains why the draft was created, reusing the existing `ReasoningEngine`.
- [x] `KnowledgeCaptureEngine` is one generic engine — no `RequirementDraftService`/`DecisionDraftService`/etc.
- [x] Delta Queries, Discussion creation, and Discussion duplicate detection are unaffected.

---

# Validation

The implementation must:

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`)
- [x] Delta Questions still work
- [x] Discussions still work
- [x] Requirement/Decision/Issue/Action statements each open a matching draft
- [x] Nothing is created without approval
- [x] Duplicate detection works before creation

---

# Completion Notes

Completed work:

- `types/knowledge-draft.ts` — `KnowledgeDraft` and `SuggestedRelationship`, reusing `Evidence`/`ConfidenceLevel`/`ReasoningResult` (`types/evidence.ts`) and `RelationshipType` (`types/relationship.ts`) rather than duplicating shapes.
- `lib/knowledge-capture/knowledge-capture-engine.ts` — `RelationshipDrivenKnowledgeCaptureEngine` (singleton `knowledgeCaptureEngine`). `draft({type, text, entities, context}): Promise<KnowledgeDraft>` composes the frozen Context/Evidence/Confidence/Reasoning Engines plus a deterministic title heuristic, a type-keyed classification reason, and evidence-derived relationship/participant suggestions.
- `lib/services/text-similarity.ts` — shared tokenizer/weighted-scoring core (`keywords`, `addWords`, `findBestMatch`), extracted from `discussion-matching.ts` with zero behavior change.
- `lib/services/knowledge-object-matching.ts` — `findMatchingKnowledgeObject`, searching every Knowledge Object type via the shared core.
- `lib/repositories/knowledge-object-repository.ts` / `lib/services/knowledge-object-service.ts` / `lib/actions/knowledge-object-actions.ts` — new `listAll()` / `getAllKnowledgeObjects()` / `matchKnowledgeObject()`.
- `components/delta/EvidenceDisplay.tsx` — `ConfidenceBadge`/`EvidenceList`/`ReasoningSection`/`FieldLabel` extracted from `DeltaResponsePanel.tsx` (which now imports them) so the new review screen reuses the exact same rendering.
- `components/knowledge-objects/KnowledgeDraftReview.tsx` — the review screen (Approve/Edit/Cancel); Edit opens the existing `KnowledgeObjectModal`.
- `components/delta/PossibleDuplicateKnowledgePrompt.tsx` — "Possible existing knowledge found" (Continue existing default / Create new), structurally identical to `SimilarDiscussionPrompt`.
- `components/requirements/RequirementDiscussionPrompt.tsx` — new optional `typeLabel` prop (default `"requirement"`), reused for the draft flow's discussion-resolution step.
- `components/delta/DiscussionPrompt.tsx` / `Workspace.tsx` — one new branch in `submit()` routes Requirement/Decision/Issue/Action destinations to `onDraftRequested` instead of `delta.ask()`; Delta Query and Discussion branches are untouched.
- `components/project-shell/HomeWorkspace.tsx` — new `journalDraft` state machine (review → editing → duplicate-knowledge → resolve-discussion), additive alongside the untouched QuickActions Requirement flow.

Verified via a temporary, unauthenticated smoke-test API route (added and removed within this session, same technique as Sprints 4.3/4.3.1) against real seed data (project `3c2384a0-bc60-4116-ba8c-5f1f52eedb42`):
- "The client needs weather protection at the entrance." → Requirement draft, "Detected design requirement language."
- "We decided to use marble for the entrance." → Decision draft, "Detected decision language." (this is the exact case that exposed the intent-vs-type reasoning bug, now fixed).
- "There's a clash between the entrance ramp and the canopy." → Issue draft, Medium confidence, real evidence (`requirement-demo-1`).
- "We must update the A-101 drawing for the entrance." → Action draft, "Detected future action language." + "Detected obligation language.", Medium confidence.
- `matchKnowledgeObject` correctly found `requirement-demo-1` for an entrance/accessibility-shaped draft and correctly found nothing for an unrelated statement.
- Re-ran Sprint 4.3.1's own discussion-matching smoke scenarios (both `findMatchingDiscussionForMessage` and the legacy `findMatchingDiscussionForRequirement`) — identical results to 4.3.1, confirming the `text-similarity.ts` extraction changed nothing.
- Confirmed the six standard routes (`/`, `/projects`, `/projects/new`, `/auth`, `/participants`, `/review`) return identical status codes to every prior sprint, with no runtime errors in the dev server log.

Known issues:

- Full authenticated visual verification in a browser was not possible in this environment (no test credentials) — the same limitation every prior sprint documented.
- Draft titles are a simple deterministic heuristic, not polished prose — see Implementation Notes. Users are expected to refine via Edit.
- `High` confidence is only reachable for drafts whose evidence collection happens to produce ≥2 strong direct matches in the current discussion/its linked knowledge objects — same seed-data/dictionary limitation Sprint 4.3 documented for Delta's own answers.
- Issue/Risk drafts that create a brand-new Discussion use the generic `"QRY"` Discussion type code, since no dedicated code exists for either yet.
- The Knowledge Draft review flow is scoped to the top-level Journal input only, matching Sprint 4.3.1's own scoping — `ReplyBar.tsx` is unaffected.

Follow-up work:

- Extend the Comprehension Engine's entity dictionary (a data change, not an architecture change, per its own documented extensibility) if more polished draft titles become a priority.
- Wire the suggested relationships into an actual "confirm and create" action once product direction on that interaction is defined — today they are display-only.
- Add a dedicated Discussion type code for Issue/Risk if that distinction becomes product-relevant.
- Replace `findMatchingKnowledgeObject`/`findMatchingDiscussionForMessage`'s literal keyword/entity matching with real semantic similarity once embeddings/semantic search exists — carried forward from Sprints 4.3/4.3.1's identical note.

Modified files:

New: `types/knowledge-draft.ts`, `lib/knowledge-capture/knowledge-capture-engine.ts`, `lib/services/text-similarity.ts`, `lib/services/knowledge-object-matching.ts`, `components/delta/EvidenceDisplay.tsx`, `components/knowledge-objects/KnowledgeDraftReview.tsx`, `components/delta/PossibleDuplicateKnowledgePrompt.tsx`.

Changed: `lib/repositories/knowledge-object-repository.ts`, `lib/services/knowledge-object-service.ts`, `lib/actions/knowledge-object-actions.ts`, `lib/services/discussion-matching.ts`, `components/delta/DeltaResponsePanel.tsx`, `components/requirements/RequirementDiscussionPrompt.tsx`, `components/delta/DiscussionPrompt.tsx`, `components/delta/Workspace.tsx`, `components/project-shell/HomeWorkspace.tsx`, `components/delta/DeltaApp.tsx`.
