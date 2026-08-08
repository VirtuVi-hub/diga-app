# Sprint: Workflow & Experience Completion

Status: Complete
Sprint ID: 4.9
Target Version: v4.9
Owner: Delta engineering
Created: 2026-08-03
Last Updated: 2026-08-03

---

# Objective

Not a new intelligence capability — Sprints 4.0–4.8 already built every engine DIGA needs. This sprint fixes confirmed UX bugs found in manual browser testing and completes the *product experience* around what already exists: preserving conversations, giving real feedback on actions, humanizing the Timeline, replacing static Project Updates with real Event data, building a lightweight approval/notification foundation, and unifying page spacing. No frozen engine, repository, or service was rewritten — every change is additive fields, small pure functions, or presentation/wording.

---

# Background

Three parallel research passes (Journal/Delta conversation flow, Knowledge Object surfaces, Project Updates/page consistency) plus direct reads of `knowledge-capture-engine.ts` and `useRequirementRouting.ts` were run before any code changed, to find the *actual* root cause of each reported bug rather than patching symptoms. Two findings changed the plan meaningfully:

- The reported "Knowledge cards don't open" bug was not in `KnowledgeObjectCard.tsx`/`KnowledgeTypeGroup.tsx` (both already correctly wired, `KnowledgeObjectCard` in fact unused/dead code) — it was `DeltaInsights.tsx`'s `EvidenceSection`/`RelatedKnowledgeSection`/`ImpactsSection`, which rendered plain non-clickable rows and wasn't even given a `projectId` to build an href with.
- "Affected disciplines" and "Affected spaces" (§4C's own example impact categories) have **no real, queryable data model anywhere in this codebase** — the `disciplines` Supabase tables are schema-only and never read by the app layer; "Space" only exists as mock strings in the unrelated legacy Review-package feature. Building either would mean fabricating data, which the brief itself forbids.

**Confirmed with user before implementation:** the Approval Workflow Foundation (§5) extends `ValidationState` with a real 5th value, `"needs_discussion"` — a genuine, human-triggered action + Event, mirroring exactly how the other 4 states already work — rather than staying purely read-only. "Raised" vs "Under Review" are derived from the existing `"pending"` state plus whether an `approval.requested` event exists; a reviewer roster (approved-by/rejected-by/pending) is a new pure computed function reading real event actors against `approvalRequiredFrom` — visibility only, no gating logic.

---

# What changed, by brief section

## §1 Confirmed bugs — all fixed

- **A. Journal Q&A vanished.** `useDeltaPanel`'s `DeltaPanelState` now carries the original `query` on both `loading` and `result`; `DeltaResponsePanel` renders a "You" line above Delta's answer. Scoped deliberately: preserved for the life of the visible response, not a persistent reopenable history (no new Event/store added for that).
- **B / 3B. "Continue Existing" (Knowledge Object duplicate) looked like a no-op.** `continueExistingKnowledge`, `addKnowledgeToExistingDiscussion`, and `addRequirementToExisting` (`HomeWorkspace.tsx`) all now `router.push()` to the object/discussion that now holds the change — real, visible proof, since nothing on the Journal itself renders Knowledge Objects.
- **C. Knowledge cards not navigating.** `DeltaInsights` now takes a `projectId` prop (threaded from `DiscussionCard.tsx` and `DiscussionDetail.tsx`) and wraps each Evidence/Related Knowledge/Impact row in a `Link` via the existing `nodeHref()` helper (built in 4.8) — falling back to plain text for node types with no detail page, exactly like `RecommendationCard`/`TimelineEntryCard` already do.
- **D. Recommendation Accept/Dismiss gave no feedback.** `RecommendationPanel` no longer deletes a resolved card from state — it moves to a dimmed "Resolved" sub-list with an "Accepted"/"Dismissed" tag instead of action buttons. Publish-Event/Timeline-update already worked (built in 4.8) and now also flow into Project Updates (§6D).
- **E. Delta approval questions inconsistent.** Root cause: asking from the Journal (a Discussion context, no `knowledgeObjectId`) never reached the Sprint 4.7 branch at all. Fixed with `resolveKnowledgeObjectIdForContext()` (`lib/knowledge-validation/approval-query.ts`): when only `discussionId` is known, resolves to that discussion's most recently created Knowledge Object (a real `getKnowledgeObjects` lookup); falls through to the honest normal pipeline when none exists, never guessed.

## §2 Journal experience

- **B/3C.** `reasoning-engine.ts`'s `buildConclusion()` now distinguishes "some evidence exists but doesn't confirm this" from "nothing related exists yet" instead of one generic "insufficient evidence" string — reused automatically by both Delta's own answers and Knowledge Capture drafts (they share the same `reasoningEngine.explain()` call). `delta-query-resolver.ts`'s final unknown-result message now reuses `reasoning.conclusion` instead of a separate hardcoded string.
- **D.** `SimilarDiscussionPrompt.tsx` / `PossibleDuplicateKnowledgePrompt.tsx` / `RequirementDiscussionPrompt.tsx` body copy now states the consequence of each button, not just its label.

## §3 Knowledge Capture experience

- **A.** `KnowledgeDraftReview.tsx`'s button no longer says "Approve" — it says "Create Requirement"/"Log Decision"/"Raise Issue"/"Create Action" (reusing `intelligence-engine.ts`'s existing `ROUTING_LABELS` verbs), since this step approves *creating* the draft, not the resulting object — a real, confirmed source of confusion with the separate Validation step. The disclaimer no longer claims "nothing is created until you approve" (a duplicate/discussion-resolution pipeline runs first) — reworded honestly.
- **D.** Evidence and Suggested Relationships were near-duplicates (`SuggestedRelationship` is `Evidence` reshaped, per 4.4's own doc). Now filtered to only novel suggestions (label not already present in Evidence); the section disappears when nothing is left.

## §4 Knowledge Object experience

- **A/B.** The old requirement-only, 3-line plain-text Workflow block is replaced by a generic `WorkflowSection` (all 5 types): Raised By (`revisions[0].createdBy`), Current Owner (`raisedTo`), Reviewers (`validation.suggestedReviewers`, chips), Approvers (chips colored by the new roster — green if approved, red if rejected, neutral if pending), People Notified (`notify`, with an honest "recorded, no delivery mechanism yet" note), and a Current Stage badge.
- **C.** `impactNodeTypeOrder` gained `"document"` (a real, already-supported node type previously left out of that specific list); `ImpactsSection`'s heading renamed "Impacts" → "Potential Impacts" to match `KnowledgeValidationPanel`'s existing wording. Disciplines/Spaces explicitly not built — see Background.
- **D.** Satisfied by 3A's rename (no "Approve" on a creation screen) plus the new Current Stage field giving Creation and Approval clearly separate, labeled homes on the same page.

## §5 Approval Workflow Foundation

- `ValidationState` → `"pending" | "approved" | "rejected" | "revoked" | "needs_discussion"`. New `approval.discussion_requested.v1` Event; `KnowledgeObjectService.flagForDiscussion()` (5th transition, reusing the existing shared `transitionValidation()` helper); a 5th "Needs Discussion" button in `KnowledgeValidationPanel.tsx`.
- **Current Stage** (`lib/knowledge-validation/approval-roster.ts`'s `computeCurrentStage()`): 4 of 5 `ValidationState` values map straight across; `"pending"` splits into `"raised"` (no `approval.requested` event yet) vs `"under_review"` (one exists) — computed from event data the Validation Engine already fetches, zero new queries.
- **Approval roster** (`computeApprovalRoster()`, new `ApprovalRoster` type on `KnowledgeValidation`): `requiredReviewers`/`approvedBy`/`rejectedBy`/`pendingReviewers`/`discussionRequested`, aggregated purely from real `approval.*` Events — per the architecture doc's own §8 suggestion ("an approval aggregate — built from approval events, not a competing store"). No gating: every transition stays always-available, exactly as Sprint 4.7 established.

## §6 Timeline experience

- **A.** `timeline-projection.ts`'s `SUMMARY_BUILDERS` rewritten as actor-first sentences ("Client approved Weather-protected clearance to accessible entrance", "Maya Chen flagged X for discussion") using the event's real `actor.id`, falling back to a passive phrasing when it's `null` (true today for `discussion.created`) — verified via smoke test never inventing a role name the event doesn't actually carry (every real actor in this app is currently "Maya Chen" or a required-approver name like "Client", since no real auth exists — entries read accordingly, not with arbitrary role names).
- **B.** `TimelineEntry` gained `resultingState` (from `event.metadata?.validationState`, already present on every approval event) — deliberately the state *at the time of that event*, not a live re-lookup, since the log is immutable and showing "current" status on an old entry would misrepresent history. `TimelineEntryCard` gained an optional "Next step" line, sourced only from a real, currently-open Recommendation for the same related node (a lookup map the Timeline page builds from data it already fetches) — omitted entirely when none exists.
- **D.** `ProjectUpdatesPanel` no longer renders a hardcoded fixture array. `app/projects/[id]/page.tsx` now fetches `getTimeline()` (unfiltered, same rationale as the Timeline page) and passes the newest 6 entries down through `HomeWorkspace`; the panel keeps its exact visual chrome, mapping from real `TimelineEntry` fields instead. The legacy static `/review` demo (`ActionPanel.tsx` → `DeltaApp.tsx`) now passes `entries={[]}`, correctly showing the panel's own empty state instead of fabricated fixture data, since that page has no real Event Log behind it.

## §7 Notification foundation

No new repository/service (explicitly excluded). `KnowledgeObject.notify` (already real) is shown in the new Workflow section as "who should be notified." `KnowledgeObjectService.create()`/`.revise()`/`transitionValidation()` now copy `object.notify` into each published event's `metadata.notify` — a record of who was on the list *when the fact occurred*, honestly labeled "recorded, no delivery mechanism yet." No delivery, no separate ledger.

## §8 Page consistency

Mechanical, not a redesign: `app/projects/[id]/timeline/page.tsx` now imports and applies `WORKSPACE_FEED_MAX_WIDTH_CLASS`/`WORKSPACE_FEED_PADDING_CLASS` (`lib/workspace-layout.ts`) — previously it had no padding/max-width at all. `app/projects/[id]/knowledge/[objectId]/page.tsx` and `KnowledgeObjectDetail.tsx` now import the same constants instead of hand-duplicating the identical literal strings (`"px-6 pt-3 pb-8"`, `"max-w-6xl"`) — zero visual change, single-sourced. `WorkspaceLayout`'s Attention/Actions rails were deliberately left Journal-only (adding them elsewhere would be a redesign, not a unification).

## §9 Recommendation experience

`RecommendationCard.tsx`'s generic "View Related" links now say `Open ${relationshipNodeTypeConfig[node.type].label}` (e.g. "Open Requirement", "Open Discussion", "Open Meeting") — reuses the existing config object already imported elsewhere.

## §10 General polish

Applied inline wherever a file was already being touched above (empty states, confidence explanations, reasoning readability) rather than as a separate blanket pass — scoped to touched surfaces, not an exhaustive audit of the whole app.

---

# Explicitly not built

Full BPM/sequential workflow engine; real notification delivery/email; task assignment; scheduling; background jobs; persistent cross-session Q&A history; "Affected disciplines"/"Affected spaces" impact categories (no real data model exists — see Background); a redesigned Attention/Actions rail on Timeline/Knowledge pages (§8 was spacing/max-width unification only); rewriting the Intelligence Engine, Event Engine, any repository, or any service.

---

# Files Changed

Journal/Delta: `useDeltaPanel.ts`, `DeltaResponsePanel.tsx`, `DiscussionCard.tsx`, `DiscussionDetail.tsx`, `Workspace.tsx`, `DeltaInsights.tsx`, `HomeWorkspace.tsx`, `ProjectUpdatesPanel.tsx`, `ActionPanel.tsx`.

Duplicate prompts: `SimilarDiscussionPrompt.tsx`, `PossibleDuplicateKnowledgePrompt.tsx`, `RequirementDiscussionPrompt.tsx`.

Knowledge Capture: `KnowledgeDraftReview.tsx`.

Reasoning: `lib/intelligence-engine/reasoning-engine.ts`, `lib/intelligence-engine/delta-query-resolver.ts`, `lib/knowledge-validation/approval-query.ts`.

Knowledge Object / Approval Foundation: `types/knowledge-object.ts`, `lib/knowledge-object-types.ts`, `lib/services/knowledge-object-service.ts`, `lib/events/event-types.ts`, `types/knowledge-validation.ts`, `lib/knowledge-validation/knowledge-validation-engine.ts`, new `lib/knowledge-validation/approval-roster.ts`, `lib/actions/knowledge-validation-actions.ts`, `components/knowledge-validation/KnowledgeValidationPanel.tsx`, `components/knowledge-objects/KnowledgeObjectDetail.tsx`, `lib/relationship-types.ts`, `components/relationships/ImpactsSection.tsx`.

Timeline/Updates: `lib/events/timeline-projection.ts`, `components/timeline/TimelineEntryCard.tsx`, `components/timeline/TimelineView.tsx`, `app/projects/[id]/page.tsx`, `app/projects/[id]/timeline/page.tsx`, `app/projects/[id]/knowledge/[objectId]/page.tsx`.

Recommendations: `components/recommendations/RecommendationCard.tsx`, `RecommendationPanel.tsx`.

Docs: this file (new), `03_CURRENT_STATE.md`, `04_ACTIVE_TASK.md`.

**Files that must not change, and didn't:** `lib/comprehension/*`, `lib/intelligence-engine/context-engine.ts`/`orchestrator.ts`/`response-planner.ts`/`intelligence-engine.ts`/`evidence-engine.ts`/`confidence-scorer.ts`, `lib/events/event-bus.ts`/`event-publisher.ts`, all repository interfaces (only `KnowledgeObjectRepository` gained a call to its own pre-existing `setValidationState`, no interface change), `lib/recommendations/recommendation-engine.ts`/`recommendation-rules.ts` (Sprint 4.8, untouched).

---

# Validation

- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build` — all pass clean, run repeatedly through implementation (after the Journal/Capture group, after the Knowledge Object/Approval group, and a final full pass).
- [x] Temporary smoke-test route (added/removed this session) verified: approval questions asked with only `discussionId` context (no `knowledgeObjectId`) correctly resolve and answer; `approve` → `flagForDiscussion` → `requestApproval` correctly transition `validationState` through `approved` → `needs_discussion` → `pending`, with `currentStage` correctly reading `approved` → `needs_discussion` → `under_review` (the last one proving the "raised vs under_review" event-based distinction works); the approval roster correctly attributes `approvedBy: ["Client"]` from a real actor on a real event; Timeline summaries read as real humanized sentences ("Client approved...", "Maya Chen flagged... for discussion", "Maya Chen requested approval for..."); `RecommendationService.accept()` returns the updated record with `status: "accepted"` (the shape `RecommendationPanel`'s new Resolved section renders).
- [ ] Full authenticated browser click-through was not possible in this environment (no test credentials) — same limitation every prior sprint has documented. Several fixes (§1A conversation preservation, §1B/1C navigation, §1D resolved-card styling) are pure client-state/rendering changes that can only be fully confirmed by hand in a browser; they were verified via code review and the underlying data each depends on was confirmed correct via the smoke test above.

---

# Completion Notes

Known limitations, honestly stated:

- §1A preserves the question only for the life of the currently-open response panel — not a persistent, reopenable conversation log across sessions (would require a new store this sprint deliberately doesn't add).
- The approval roster's `approvedBy`/`rejectedBy` will only ever show real names once real authentication exists — every actor in this app is currently a hardcoded stand-in ("Maya Chen", or whichever name a caller passes), so the mechanism is real but the demo data is not yet diverse.
- `revise()` still does not reset `validationState` (a Sprint 4.7 gap, unchanged this sprint — still out of scope, still documented).
- "Conflicting knowledge" remains unbuilt as a Validation Check (Sprint 4.7's own decision, unchanged) — no real conflict-detection signal exists.
- Disciplines/Spaces as impact categories remain unbuilt — would require real integration work connecting the dormant `disciplines` Supabase tables, not reuse of anything that exists today.
- §8's page-consistency pass only unified spacing/max-width (Journal, Timeline, Knowledge) — it did not give Timeline or Knowledge an Attention/Actions rail, since that would be a redesign, not a unification, per the brief's own instruction.

Follow-up work worth considering: a second `RecommendationPanel` mount point (e.g. the Attention panel, still static placeholders since Sprint 3.6A); giving the approval roster real per-person identity once auth lands; extending "Next step" hints beyond the Timeline page to `ProjectUpdatesPanel` if useful in practice.
