# Sprint: Knowledge Validation & Approval Intelligence

Status: Complete
Sprint ID: 4.7
Target Version: v4.7
Owner: Delta engineering
Created: 2026-08-03
Last Updated: 2026-08-03

---

# Objective

Let a human decide whether a Knowledge Object should be trusted, with Delta assembling everything needed to make that decision — never a traditional approval workflow. One reusable Knowledge Validation panel works for every Knowledge Object type (Requirement, Decision, Action, Issue, Risk); approval actions are generic Events, not a new store; Delta answers approval-shaped questions by reusing the existing Evidence/Confidence/Reasoning engines.

---

# Background

Sprints 4.0–4.6 built the Knowledge Graph, Evidence Engine, Intelligence Engine, Knowledge Capture Engine, Event Engine, and Timeline Projection. Every Knowledge Object already carried an `approvals: KnowledgeObjectApproval[]` field that was always `[]` (documented since Sprint 3.6A as an unbuilt workflow). This sprint replaces that gap with a real capability, built entirely by composing what already exists — no new AI pipeline, no new persistent store beyond one new field on the existing `KnowledgeObject` shape.

**Confirmed with the user before implementation:** approval had to be a real Knowledge Graph write, not a purely event-derived read, but it also could not be forced into the existing `KnowledgeObjectStatus` (draft/open/approved/resolved/archived) — that field is domain lifecycle and already diverges per type. The resolution is a second, generic axis: `ValidationState` (`pending | approved | rejected | revoked`), independent of `status`. Every transition is one real repository write plus one matching Event, published in the same service call — the exact "real write + `publishSafely`" shape `KnowledgeObjectService.create()`/`.revise()` already use.

---

# Scope

## In Scope

- `ValidationState` (`types/knowledge-object.ts`) — a new field on `KnowledgeObject`, defaulted to `"pending"` at creation. Deliberately not added to `CreateKnowledgeObjectInput` (repository-defaulted, same treatment as `approvals: []`).
- `KnowledgeObjectRepository.setValidationState()` + four `KnowledgeObjectService` methods (`requestApproval`/`approve`/`reject`/`revokeApproval`) sharing one private `transitionValidation()` helper — real write + Event, one call.
- Four new Event types (`approval.requested.v1` / `.granted.v1` / `.rejected.v1` / `.revoked.v1`) and their Timeline categorization/summaries — approvals now show up on the existing Sprint 4.6 Timeline page with zero Timeline-specific code.
- `KnowledgeValidationEngine` (`lib/knowledge-validation/knowledge-validation-engine.ts`) — assembles Summary, Evidence, Related Knowledge, Potential Impacts, Timeline, Confidence, Reasoning, Suggested Reviewers, and Validation Checks for any Knowledge Object, entirely by calling the unmodified Sprint 4.3 `EvidenceEngine`/`ConfidenceScorer`/`ReasoningEngine`, the Sprint 4.5 Event Log, and the Sprint 4.4 duplicate-matching service.
- `KnowledgeValidationPanel` (`components/knowledge-validation/`) — one reusable, type-agnostic panel; embedded once, on the Knowledge Object Detail page, replacing the old "Approvals" placeholder card.
- `lib/knowledge-validation/approval-query.ts` — Delta answers "Why should this be approved?" / "Who should review this?" / "What's missing?" by reshaping the same `KnowledgeValidation` object into the existing `DeltaRelatedResult`/`DeltaUnknownResult` kinds. Wired into `delta-query-resolver.ts` as one new, narrowly-gated early-exit branch.
- `lib/actions/knowledge-validation-actions.ts` — the client-callable surface (`getKnowledgeValidation` + four transition actions).

## Out of Scope

Explicitly excluded by the brief: notifications, automation rules, assignments, multi-stage approval workflows, escalations, permissions, email integration. Also out of scope, by design decision (see Implementation Notes): a "conflicting knowledge" check, and resetting `validationState` on `revise()`.

---

# Files Expected to Change

New:
- `types/knowledge-validation.ts`
- `lib/knowledge-validation/knowledge-validation-engine.ts`
- `lib/knowledge-validation/approval-query.ts`
- `lib/actions/knowledge-validation-actions.ts`
- `components/knowledge-validation/KnowledgeValidationPanel.tsx`

Changed:
- `types/knowledge-object.ts` (`ValidationState`, `KnowledgeObject.validationState`)
- `lib/knowledge-object-types.ts` (validation state labels/badge classes)
- `lib/repositories/knowledge-object-repository.ts` (`setValidationState`, `create()` default)
- `data/knowledge-objects.ts` (seed object gets `validationState: "pending"`)
- `lib/services/knowledge-object-service.ts` (four transition methods)
- `lib/events/event-types.ts` (four `APPROVAL_*` constants)
- `lib/events/timeline-projection.ts` (`categorize()`, `SUMMARY_BUILDERS`)
- `lib/intelligence-engine/delta-query-resolver.ts` (one new early-exit branch)
- `components/knowledge-objects/KnowledgeObjectDetail.tsx` (ValidationState badge, panel embedded, "Approvals" placeholder removed)
- `app/projects/[id]/knowledge/[objectId]/page.tsx` (assembles and passes `KnowledgeValidation`)

---

# Files That Must Not Change

`lib/comprehension/*`, `lib/intelligence-engine/context-engine.ts`/`orchestrator.ts`/`response-planner.ts`/`intelligence-engine.ts`/`evidence-engine.ts`/`confidence-scorer.ts`/`reasoning-engine.ts` (only `delta-query-resolver.ts` gained one branch, exactly as Sprint 4.6 did), `lib/knowledge-capture/*`, `lib/events/event-bus.ts`/`event-publisher.ts`/`timeline-grouping.ts`, all existing repositories' pre-existing methods, `components/timeline/*` (reused as-is), `components/delta/DeltaResponsePanel.tsx`/`EvidenceDisplay.tsx`/`useDeltaPanel.ts` (reused as-is).

---

# Constraints

- No `RequirementApproval`/`DecisionApproval`/`IssueApproval`/`ActionApproval` — one generic `KnowledgeValidationEngine` and one generic `KnowledgeValidationPanel` for every type.
- No Approval-specific database/store — `validationState` is a field on the existing `KnowledgeObject`; history lives entirely in the Event Log.
- No new AI pipeline — Delta's approval answers reuse the same Evidence/Confidence/Reasoning engines the panel itself calls.
- No fabricated checks or reviewers — every Validation Check and Suggested Reviewer traces to a real, already-computed signal.
- Nothing blocks approval — checks are informational only.

---

# Implementation Notes (Architecture Decisions)

- **`ValidationState` is a second axis, not a repurposing of `status`.** `KnowledgeObjectStatus` (draft/open/approved/resolved/archived) is the domain lifecycle, already type-specific in spirit and set to diverge further as rich per-type schemas land (`DIGA-CORE-ARCHITECTURE-V2.md` §2.4). `ValidationState` is the one thing that means the same thing for every type: has a human reviewed and trusted this. Confirmed with the user before writing any code (see Background).
- **No transition-validity gating.** All four actions (Request/Approve/Reject/Revoke) are always available in the panel, regardless of current `validationState`. A state machine enforcing valid transitions would be exactly the "multi-stage approval workflow"/"automation rules" logic this sprint's brief explicitly excludes.
- **"Conflicting knowledge" was deliberately not implemented as a check.** The brief lists it as one *example* of a validation check, but there is no "conflict" relationship type in the graph and no conflict detector anywhere in the codebase — building one would mean fabricating a signal, which violates "never fabricate" (the brief's own §7 instruction for Delta's reasoning). The five checks that were implemented (missing evidence, missing relationships, low confidence, possible duplicate, no suggested reviewers) all trace to signals the engine already computes for other reasons.
- **`revise()` does not reset `validationState`.** An object approved, then later revised, keeps showing "Approved" until someone explicitly revokes it. This is a real, known gap — but touching `KnowledgeObjectService.revise()`'s existing behavior was outside this task's assigned scope (`04_ACTIVE_TASK.md`: "Do not redesign features outside the assigned scope"). Documented here rather than silently left unmentioned, matching this codebase's own precedent for every other cross-cutting gap.
- **Delta's approval Q&A runs *before* comprehension, not after — unlike Sprint 4.6's timeline branch.** The first implementation placed the new branch after the clarification check, mirroring `timeline-query.ts` exactly. Two real problems surfaced during the smoke test: (1) any question containing "approve"/"approval" — including "Why should this be approved?" — was being intercepted by `detectTimelineQuery()`'s own `onlyApprovals` regex, since the timeline branch was checked first; (2) "Who should review this?" and "What's missing?" don't match any dictionary-driven `DeltaIntent` confidently, so `IntelligenceEngine` set `needsClarification: true` and returned a clarifying question before either special-case branch ever ran. Both are fixed by checking `detectApprovalQuestion()` first, ahead of `intelligenceEngine.process()` entirely, gated on `context.knowledgeObjectId` — safe because these are a fixed set of page-scoped trigger phrases (the panel's own preset buttons) with no real ambiguity to clarify, unlike free-form Delta queries. It uses raw `text`, not the (not-yet-computed) translated text — an accepted limitation, since these presets are always English.
- **Timeline of recent changes reuses `TimelineEntryCard` directly**, not a new rendering component — the panel filters the same `getEvents()`/`timelineProjection.project()` pipeline to events whose `sourceNode`/`targetNode` id matches the object, most-recent-first, capped at 8.
- **Suggested Reviewers never reads `notify`.** Only `raisedTo`, `approvalRequiredFrom`, and linked Discussions' `participants` are considered — `notify` is a Notifications-shaped concern, explicitly out of scope.

---

# Acceptance Criteria

- [x] Every Knowledge Object can be validated before approval (one generic panel, all 5 types).
- [x] Approval decisions are evidence-backed (Evidence/Related Knowledge/Impacts/Confidence/Reasoning all real, reused from Sprint 4.3's engines).
- [x] Delta explains why knowledge should or should not be approved, who should review it, and what's missing.
- [x] Approval actions generate Events (`approval.requested/granted/rejected/revoked.v1`).
- [x] The Timeline updates automatically through the existing Event projection — no Timeline-specific code added.
- [x] No approval-specific architecture (no new store, no per-type approval types).

---

# Validation

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`)
- [x] Temporary smoke-test route (added/removed this session) against the real seed object `requirement-demo-1`: `knowledgeValidationEngine.assemble()` returned real evidence (6 items), related knowledge (3), impacts (6), confidence `"high"`, real reasoning, 5 suggested reviewers, zero checks (correctly — nothing is actually missing on this well-evidenced seed object). All four transitions (`requestApproval`/`approve`/`reject`/`revokeApproval`) correctly updated `validationState` and each appended a correctly-categorized (`"approvals"`), correctly-summarized ("Approved: Weather-protected clearance to accessible entrance", etc.) Timeline entry. `resolveDeltaQuery("Why should this be approved?", ...)`, `"Who should review this?"`, and `"What's missing?"` — all scoped with `knowledgeObjectId` — returned real, non-fabricated `related` results after the branch-ordering fix (see Implementation Notes); the same three questions asked without `knowledgeObjectId` context correctly fall through to ordinary Delta behavior, unaffected. `resolveDeltaQuery("Where is the staircase?")`, a pre-existing unrelated test phrase, was unaffected.
- [ ] Full authenticated visual verification in a browser was not possible in this environment (no test credentials) — same limitation every prior sprint since 4.0 has documented. Verified via code review, `tsc`/lint/build, and the smoke test above only.

---

# Completion Notes

Completed work: see Files Expected to Change above — all items delivered.

Known issues:

- `revise()` does not reset `validationState` (see Implementation Notes) — an approved object silently keeps its "Approved" badge after an unrelated edit until someone explicitly revokes it.
- No transition-validity gating — a freshly-created, never-requested object can be directly "Approved" or "Revoked" without ever passing through "Requested." Deliberate (see Implementation Notes), not an oversight.
- "Conflicting knowledge" is not a real check (see Implementation Notes) — would require fabricating a detector that doesn't exist yet.
- Suggested Reviewers resolves names from free-text fields (`raisedTo`, `approvalRequiredFrom`) and Discussion `Participant.name` — there is no real People/`project_team` lookup yet (same pre-authentication limitation `03_CURRENT_STATE.md` documents everywhere else), so two different people who happen to share a display string would collapse into one suggested reviewer.
- Delta's approval Q&A branch runs on raw, untranslated text — a Hindi/Hinglish phrasing of "who should review this" would not be recognized, unlike the Timeline branch which uses Comprehension's translated text. Acceptable since the panel's own preset buttons are always English; free typing in a non-English language falls through to the ordinary (translated) pipeline.

Follow-up work:

- Once real People/`project_team` data exists, Suggested Reviewers should resolve to real person records instead of display-string matching.
- Consider whether an approved-then-revised object should be flagged (not auto-reset) rather than silently keeping a stale "Approved" badge.
- A `KnowledgeObjectApproval[]`-based aggregate (`DIGA-CORE-ARCHITECTURE-V2.md` §8: "where a Knowledge Object requires multiple named approvers... an approval aggregate — built from approval events") for objects with `approvalRequiredFrom` listing more than one name is unbuilt this sprint; `validationState` currently reflects only the single latest transition, not a per-approver satisfaction count.

Modified files: see Files Expected to Change above.
