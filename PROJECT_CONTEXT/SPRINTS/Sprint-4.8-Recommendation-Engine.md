# Sprint: Recommendation Engine

Status: Complete
Sprint ID: 4.8
Target Version: v4.8
Owner: Delta engineering
Created: 2026-08-03
Last Updated: 2026-08-03

---

# Objective

Let DIGA observe its own Event stream and surface advisory recommendations — never automation. Delta recommends, humans decide: recommendations never mutate project data, never create Knowledge Objects, never approve anything, never auto-execute. Built entirely by composing what already exists (Event Bus, `EvidenceEngine`/`ConfidenceScorer`/`ReasoningEngine`, Comprehension Engine, Timeline Projection) — no new AI pipeline, no background jobs.

---

# Background

Every important write in DIGA already publishes an Event (Sprint 4.5) and Sprint 4.7 proved the pattern of composing existing engines into a new advisory capability without touching the Knowledge Graph. This sprint is the next such capability, but reactive: a fifth Event subscriber observes the same Event stream every other subscriber already sees, and — for six specific, high-value situations — produces a `Recommendation`, a first-class object with its own lifecycle, entirely separate from the Event Log itself.

---

# Scope

## In Scope

- `Recommendation` (`types/recommendation.ts`) — one generic model, `recommendationType` an open string (matching `Event.eventType`'s own philosophy), no per-type subclasses.
- `lib/repositories/recommendation-repository.ts` / `lib/services/recommendation-service.ts` / `lib/actions/recommendation-actions.ts` — the standard Repository/Service/Action trio.
- `RecommendationEngine` (`lib/recommendations/recommendation-engine.ts`) — rule-driven, constructor-injected rule list, de-duplicates against existing open recommendations before persisting.
- Six rules (`lib/recommendations/recommendation-rules.ts`), one per brief example — see Implementation Notes for what each reuses.
- A new, distinct `recommendationSubscriber` (`lib/events/subscribers/recommendation-subscriber.ts`), registered alongside the existing four.
- Two new Event types (`recommendation.accepted.v1` / `.dismissed.v1`) and two `SUMMARY_BUILDERS` entries — no `categorize()` change needed.
- `RecommendationPanel`/`RecommendationCard` (`components/recommendations/`) — reusable, generic display; Accept/Dismiss/View Related actions. Mounted on the Timeline page (`/projects/[id]/timeline`).
- Delta Integration (`lib/recommendations/recommendation-query.ts`) — "What should I do next?", "What requires attention?", "What recommendations do you have?", bare "What's missing?".
- `lib/knowledge-validation/suggested-reviewers.ts` — `suggestReviewers()` extracted out of `KnowledgeValidationEngine` (behavior-preserving) so the `notify_reviewers` rule can reuse it.
- `lib/relationship-utils.ts` gained `nodeHref()`, extracted from `TimelineEntryCard.tsx`'s previously-inline `relatedHref` (behavior-preserving), reused by both.

## Out of Scope

Explicitly excluded by the brief: notification delivery, email, task assignment, automation, scheduling, workflow execution, background jobs. Also: a "conflicting knowledge"-shaped rule (no such signal exists, same reasoning as Sprint 4.7's own decision not to fabricate one); wiring the existing placeholder `intelligenceSubscriber` (deliberately left untouched — see Implementation Notes); transition-validity gating on Accept/Dismiss (none needed — both are always available, non-destructive acknowledgements).

---

# Files Expected to Change

New:
- `types/recommendation.ts`
- `lib/recommendations/recommendation-types.ts`, `recommendation-rules.ts`, `recommendation-engine.ts`, `recommendation-query.ts`
- `lib/knowledge-validation/suggested-reviewers.ts`
- `lib/repositories/recommendation-repository.ts`
- `lib/services/recommendation-service.ts`
- `lib/actions/recommendation-actions.ts`
- `lib/events/subscribers/recommendation-subscriber.ts`
- `components/recommendations/RecommendationPanel.tsx`, `RecommendationCard.tsx`

Changed:
- `lib/knowledge-validation/knowledge-validation-engine.ts` (calls extracted `suggestReviewers()`)
- `lib/relationship-utils.ts` (`nodeHref()`, `KNOWLEDGE_OBJECT_NODE_TYPES`)
- `components/timeline/TimelineEntryCard.tsx` (refactored to call shared `nodeHref()`)
- `lib/events/event-types.ts` (two `RECOMMENDATION_*` constants)
- `lib/events/timeline-projection.ts` (`SUMMARY_BUILDERS` only)
- `lib/events/subscribers/index.ts` (registers `recommendationSubscriber`)
- `lib/intelligence-engine/delta-query-resolver.ts` (one new branch)
- `app/projects/[id]/timeline/page.tsx` (fetches + renders `RecommendationPanel`)

---

# Files That Must Not Change

`lib/comprehension/*` (reused, unmodified), `lib/intelligence-engine/context-engine.ts`/`orchestrator.ts`/`response-planner.ts`/`intelligence-engine.ts`/`evidence-engine.ts`/`confidence-scorer.ts`/`reasoning-engine.ts`, `lib/events/subscribers/intelligence-subscriber.ts` (left exactly as documented since Sprint 4.5 — see Implementation Notes), `lib/events/event-bus.ts`/`event-publisher.ts`, `lib/knowledge-validation/approval-query.ts`'s own branch/ordering in `delta-query-resolver.ts` (only a new branch was added after it), all existing repositories' pre-existing methods, `components/delta/*` (reused as-is).

---

# Constraints

- Recommendations never mutate project data, never create Knowledge Objects, never approve anything, never auto-execute — structurally: no rule writes to any repository other than `recommendationRepository`.
- No `RequirementRecommendation`/`DrawingRecommendation`/etc. — one generic model and panel.
- Recommendations are their own objects, not Events — a separate repository, separate lifecycle.
- No fabricated recommendations — every rule traces to a real, already-computed signal (existing relationships, existing fields, or the unmodified Evidence/Confidence/Comprehension engines).
- Accept does not execute work — it only flips `status` and publishes an Event.

---

# Implementation Notes (Architecture Decisions)

- **A new, distinct `recommendationSubscriber`, not a reuse of the placeholder `intelligenceSubscriber`.** `intelligence-subscriber.ts` carries an explicit Sprint 4.5 comment: it "must not call `deltaComprehensionService`, `evidenceEngine`, ... doing so would be implementing a reaction, which this sprint explicitly defers" to "a dedicated sprint." Sprint 4.8 is that dedicated sprint, but for a specific, bounded, advisory-only capability — not a general "wire Intelligence to react to everything." `intelligenceSubscriber` itself is untouched, still just a counter, exactly as documented.
- **Recommendations auto-persist on evaluation**, unlike Knowledge Drafts (Sprint 4.4), which require human approval before creation. A Recommendation record is advisory annotation, not a Knowledge Graph mutation — the brief's human gate is Accept/Dismiss *after* a recommendation exists, not before it's created.
- **Rule 2 (relationship created) only fires when at least one side of the new relationship is a real Knowledge Object.** `Event.sourceNode`/`targetNode` carry id+type only, no label, and there is no lookup service for Meeting/Drawing/Document/Photo/Video/Reference node types in this codebase — they only ever exist as denormalized labels *on* `Relationship` records, never as a standalone queryable entity. A title can only be honestly resolved for Knowledge Object (`getKnowledgeObject`) and Discussion (`getDiscussion`) node types; the rule is scoped accordingly rather than showing an unresolvable id as a title.
- **Rule 4 (low confidence) and Rule 5 (missing relationships) both fire off `knowledge_object.created.v1`** (rule 4 also re-evaluates on `.updated.v1`) rather than a dedicated "low confidence" or "missing relationships" event, since neither is a fact the platform records as its own Event — both are computed live, via the exact same `EvidenceEngine`/`ConfidenceScorer` calls `KnowledgeValidationEngine` (Sprint 4.7) already makes, so "low confidence" and "missing relationships" are always the real, current answer, never a stale cached judgment.
- **Rule 6 (Discussion created) reuses the unmodified `deltaComprehensionService.comprehend()`** on the Discussion's own `summary` — the exact same destination-prediction signal `KnowledgeCaptureEngine` itself would act on if that text were typed into the Journal, rather than inventing a second heuristic for "does this sound like it should become Knowledge." Verified during the smoke test: an obligation-shaped summary ("The canopy must extend...") fires the rule; a purely descriptive one ("A quick chat about lunch plans...") correctly does not.
- **De-duplication (same `recommendationType` + same primary `relatedNodes[0]`), not automation.** Verified during the smoke test: re-approving an already-approved Knowledge Object does not create a second `notify_reviewers` recommendation.
- **Timeline integration needed zero new categorization code.** `categorize()`'s existing fallback (any unrecognized `eventType` prefix → `"intelligence"`) is exactly the category Sprint 4.6's own docs flagged as "reserved for forward-compatibility, nothing populating it yet" — `recommendation.accepted.v1`/`.dismissed.v1` land there for free. Only two `SUMMARY_BUILDERS` entries were added, matching the existing pattern for every other known event type.
- **Delta's recommendation Q&A branch is deliberately tighter-anchored than it first appears.** It's gated on `context?.projectId` (much broader availability than Sprint 4.7's `knowledgeObjectId` gate), so the trigger phrases needed care to avoid regressing genuine evidence questions elsewhere in the app. `"what's missing"`/`"what is missing"` only matches when it is the **entire trimmed question** (`^...$`), not a substring — verified during the smoke test that "What's missing from the accessibility report?" is correctly *not* intercepted and still runs the normal evidence pipeline (returning its own, unrelated clarification result, unaffected by this sprint). The branch is placed immediately after Sprint 4.7's own approval-question branch, and re-running that branch's own smoke assertions confirmed zero regression from the reordering.
- **`suggestReviewers()` extraction and `nodeHref()` extraction are both pure, behavior-preserving refactors** (verified via `tsc`/lint/build passing and the smoke test's `notify_reviewers` recommendation independently matching Sprint 4.7's own reviewer list for the same object) — not rewrites, not scope creep.

---

# Acceptance Criteria

- [x] DIGA can observe Events (a fifth subscriber, registered alongside the existing four).
- [x] DIGA can generate evidence-backed recommendations (six rules, all tracing to real signals).
- [x] Recommendations are generic (one model, one panel, `recommendationType` an open string).
- [x] Recommendations never execute automatically (Accept only flips `status` + publishes an Event).
- [x] Users remain in control (Accept/Dismiss are the only actions; nothing is auto-created or auto-approved).
- [x] Recommendation lifecycle is visible (`status: open/dismissed/accepted`, shown in the panel and the Timeline).
- [x] Recommendation actions emit Events, visible on the existing Timeline with zero Timeline-specific code.
- [x] Existing architecture remains unchanged (no frozen engine modified; only one new branch each in `delta-query-resolver.ts` and `timeline-projection.ts`'s `SUMMARY_BUILDERS`).

---

# Validation

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`)
- [x] Temporary smoke-test route (added/removed this session) against real seed data and the real service layer: approving `requirement-demo-1` produced a `notify_reviewers` recommendation with 7 real impact items and 5 real reviewers; creating a fresh Issue with nothing linked produced `gather_more_evidence` (confidence `"low"`) and `link_related_knowledge`; adding a `Relationship` between the new Issue and the seed Requirement produced `review_affected_knowledge` with both real titles resolved; revising the seed Requirement produced `check_related_discussions`; a Discussion with an obligation-shaped summary produced `extract_knowledge`, a purely descriptive one correctly produced nothing; re-approving the seed Requirement did **not** duplicate the existing open `notify_reviewers` recommendation; Accept/Dismiss correctly updated `status` and each appended a correctly-categorized (`"intelligence"`), correctly-summarized Timeline entry; `resolveDeltaQuery("What should I do next?"/"What recommendations do you have?", {projectId})` returned the real, current list of open recommendations; `resolveDeltaQuery("What's missing from the accessibility report?", {projectId})` was correctly **not** intercepted; `resolveDeltaQuery("Why should this be approved?", {knowledgeObjectId, projectId})` (Sprint 4.7's own branch) was verified unaffected by the new branch's addition.
- [ ] Full authenticated visual verification in a browser was not possible in this environment (no test credentials) — same limitation every prior sprint since 4.0 has documented. Verified via code review, `tsc`/lint/build, and the smoke test above only.

---

# Completion Notes

Completed work: see Files Expected to Change above — all items delivered.

Known issues:

- Rule 2 (relationship created) only ever resolves titles for Knowledge Object node types — a relationship between two Discussions, or touching a Meeting/Drawing/Document/Photo/Video/Reference node, never produces a `review_affected_knowledge` recommendation, since no lookup service exists for those node types to honestly resolve a title.
- Discussion-sourced recommendations (`extract_knowledge`) never carry a `projectId`, mirroring the pre-existing `discussion.created.v1` gap (Sprint 4.5/4.6) — `getRecommendations()` is called unfiltered by `projectId` on the Timeline page for the same reason `getTimeline()` already is.
- De-duplication only checks `recommendationType` + primary related node against currently-*open* recommendations — dismissing or accepting one and then re-triggering the same underlying condition will correctly produce a new one (no memory of past dismissals), which is intentional (a dismissed recommendation isn't a permanent suppression rule) but worth knowing.
- Delta's recommendation-question branch matches on raw, untranslated text (same tradeoff Sprint 4.7 made for its own branch) — a non-English phrasing wouldn't be recognized.
- No UI surfaces recommendations anywhere except the Timeline page this sprint — the panel itself is generic/reusable, but only one mount point was wired up, matching Sprint 4.7's own precedent for `KnowledgeValidationPanel`.

Follow-up work:

- A second mount point for `RecommendationPanel` (e.g. the Attention panel, Region D of the Unified Workspace, which has been a static placeholder since Sprint 3.6A) would be a natural, low-risk next step now that the component is generic and proven.
- Once real People/`project_team` data exists, recommendation evidence involving reviewers (rule 1, via the shared `suggestReviewers()`) inherits the same future upgrade path already documented for Sprint 4.7.
- A future sprint could let `intelligenceSubscriber` become real, per `DIGA-CORE-ARCHITECTURE-V2.md`'s channel-agnostic-ingestion vision — this sprint deliberately left that placeholder untouched.

Modified files: see Files Expected to Change above.
