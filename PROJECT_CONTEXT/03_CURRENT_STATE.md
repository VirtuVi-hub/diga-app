# Current Project State

This document describes the current implementation status of Delta.

It should always reflect the latest completed state of the project.

---

# Product

Delta is a Knowledge Operating System (Knowledge OS) for Architecture Projects.

The application is currently focused on building the core knowledge workspace before expanding into advanced knowledge intelligence features.

---

# Current Development Stage

Current Sprint

Sprint 5.9 — Guided Project Setup & Notification Center complete (implementation; live two-browser verification handed to the user, pending as of this writing). Completes the onboarding journey from Agreement Approval to Project Activation. A real, persisted Notification Center (new `notifications` table) replaces the decorative TopBar bell — 6 types (Agreement approved/discussion started/discussion replied, Invitation accepted, Team member joined, Waiting for your approval), every recipient resolved from real project data, wired into the unmodified Event Engine via a rewritten `notifications-subscriber.ts` (Module 1). One invitation engine, two branches (`ParticipantEngineService`, `AddParticipantFlow`) replaces three previously separate, hand-rolled invite forms — existing Firm members get instant internal assignment, external people get the existing invite-and-accept flow (Module 3). Project Setup now progresses fully automatically from real state (Lead Architect/Main Client/Consultants/Client Representatives/Questionnaire/Delta Review) with no manual "Mark Complete" anywhere, reordered into Design Team → Consultants → Client Representatives → Import → Client Questionnaire → Delta Review, progress shown at the bottom (Modules 2, 4, 5). Role architecture correction: the account that creates a Firm or Project becomes "Lead Architect," never "Owner" — fixed at both assignment sites plus a one-time hosted-data migration for every project/Firm created by earlier sprints, closing a real, confirmed pre-existing bug where the creator was excluded from the Delegation authority-holder list (Module 6). A real client-bundle-leak bug (the same class Sprint 5.4 first documented) was found and fixed during this sprint's own build verification — the Notifications subscriber is the first to need real persistence inside the subscriber chain, which is transitively reachable from a client bundle; fixed with the service-role client plus routing through an existing `"use server"` action. `tsc`/`lint`/`build` all pass clean, the dev server restarted cleanly, and all 3 new migrations were applied to the real, hosted Supabase project. See `PROJECT_CONTEXT/SPRINTS/Sprint-5.9-Guided-Project-Setup-and-Notification-Center.md` for full detail.

Previous Sprint

Sprint 5.8 — External Access & Guided Experience complete. Not new intelligence — the presentation and access layer on top of Sprint 5.7's Governance Engine, so a Lead Architect can actually run a real project through Delta with a real client. Invitation links now build from `NEXT_PUBLIC_APP_URL` (Module 1), never `window.location.origin`. The Invite Main Client form collects Name/WhatsApp Number (required)/Email (optional) and the invitation UI never shows an invite code, raw URL, or internal id — exactly two actions, Copy Invitation Link and Share on WhatsApp, the latter deep-linking straight to the invitee's own number (Module 2). The Agreement page is now a status board (Agreement Uploaded/Main Client/Invitation Status/Agreement Status/Discussion Status/Current Version, plus a computed Waiting For/Next Action line) rather than a form-first page (Module 3). A shared `useUploadAction` state machine (idle/uploading/success/error, duplicate-submit-proof) now backs every upload button — Agreement upload, Agreement revision, and the Import Workspace's per-category uploads, the last of which previously had no success confirmation at all (Module 4). `/setup` and `/setup/review` now redirect back to `/agreement` if the Agreement hasn't been accepted yet — neither page had a guard of its own before this sprint (Module 5). The last 3 user-facing "DIGA" strings became "Delta" (Module 6). All 6 auth-adjacent pages (`/auth`, `/register`, `/forgot-password`, `/reset-password`, `/verify`, `/logout`) were rebuilt on a shared `AuthShell` using the app's real design tokens, replacing a hardcoded slate/cyan palette that looked like a different product (Module 7). The same Waiting-For/Next-Action guidance now also appears on Project Setup and Delta Review (Module 8). Every workspace page now scrolls independently (one `overflow-y-auto` on `AppShell`'s content slot), the Sidebar prioritizes project work over Firm/All Projects when inside a project, and `/firm` — which had no navigation shell at all before this sprint, a real dead end — now renders inside the same shell as everywhere else (Module 9). A real account menu (name/email, honest "Soon" Profile/Account stubs, a real Sign Out) replaced the TopBar's hardcoded, non-interactive avatar button (Module 10). Verified against the **real, hosted Supabase project**, same as Sprints 5.3–5.7, with zero regressions and zero bugs found in the main flow (two additional live checks confirmed the Module 5 redirect guard and the Module 9 `/firm` fix, which an action-level test alone couldn't exercise). See `PROJECT_CONTEXT/SPRINTS/Sprint-5.8-External-Access-and-Guided-Experience.md` for full detail.

Previous Sprint

Sprint 5.7 — Governance Engine & Project Setup Workflow complete. Not another approval system — a single Governance Engine every future workflow (Agreements, Requirements, Decisions, Drawings, BOQs, Specifications, Reports, Revisions, and later Meetings/RFIs/Site Instructions) resolves "who must approve, who must be notified, why" from one place. Replaces the one-time Onboarding Wizard (Sprint 5.4, now deleted) with the real operational lifecycle: Create Project → Upload Agreement → Invite Main Client → Agreement Review → Agreement Accepted → Project Setup → Delta Project Review → Project Activation — the collaborative workspace (Dashboard/Journal/Timeline/Knowledge/Recommendations) only unlocks once a project reaches `active`. Agreement Review offers Accept / Open Discussion / Request Revision — deliberately no Reject. Governance Rosters (Required Approvers/Mandatory Notify/Watchers) are always computed automatically from creator, object type, a newly extracted Impact Engine, seeded `governance_rules`, and Delegations — never chosen manually. Authority & Delegation is real, permanent domain state (`delegations`, never deleted, only revoked). A generalized Document Revision Intelligence (metadata diff + document-type analyzers, Agreement's own analyzer reading clause Discussions) sits alongside the unmodified, drawing-specific Sprint 5.0 Revision Intelligence, not merged into it. This sprint continued a prior session's own partial implementation (found via audit, not discarded) rather than rebuilding it, and was the first sprint to run a full live verification via a temporary authenticated Route Handler calling the real actions directly. Three real bugs were found and fixed: a PostgREST ambiguous-embedding regression to `project_team` (affecting Dashboard/Journal/Participants, not just new code), a `proxy.ts` gap making `/invite/[code]` unreachable while signed out, and two Delta governance-question routing bugs (a branch-ordering hijack and a missing Agreement-context fallback). Verified against the **real, hosted Supabase project**, same as Sprints 5.3–5.6, with zero regressions. See `PROJECT_CONTEXT/SPRINTS/Sprint-5.7-Governance-Engine-and-Project-Setup.md` for full detail.

Previous Sprint

Sprint 5.6 — Existing Project Import complete. A firm can bring an already-running project's Agreement, Drawings, BOQ, Specifications, Reports, Photos, Meeting Minutes, and General Documents into DIGA in stages through a dedicated `/projects/[id]/import` Import Workspace, reusing Sprint 5.4's own upload + Gateway composition. Verified against the real, hosted Supabase project, zero regressions. See `PROJECT_CONTEXT/SPRINTS/Sprint-5.6-Existing-Project-Import.md` for full detail.

Sprint 5.5 — Project Dashboard / Mission Control complete. Composed everything Sprints 4.0–5.4 already built into one real Mission Control Dashboard, now the project's landing page. See `PROJECT_CONTEXT/SPRINTS/Sprint-5.5-Project-Dashboard-and-Mission-Control.md` for full detail.

Sprint 5.4 — Project Onboarding complete (superseded by Sprint 5.7's Project Setup; `lib/onboarding/` and its route were deleted in Sprint 5.7). A freshly created project routed into a real, resumable 5-step Onboarding Wizard instead of an empty Journal. See `PROJECT_CONTEXT/SPRINTS/Sprint-5.4-Project-Onboarding.md` for full detail. (Sprint 5.3 — Registration, Firm & Project Foundation, and Sprint 5.2 — Project Intelligence Gateway — remain the foundation every later sprint builds on; see `Sprint-5.3-Registration-Firm-Project-Foundation.md`/`Sprint-5.2-Project-Intelligence-Gateway.md`.)

Next Sprint

Not yet defined.

Development Status

Active

---

# Current Workspace

The Unified Workspace shell wraps all real, Supabase-backed project routes with five permanent regions:

- Sidebar (persistent, app-wide) — All Projects, Home, Timeline, Project, Data, Knowledge Bank, Settings. "Project" is always shown: authentication is not implemented yet, so `lib/permissions/project-info-ui.ts` temporarily assumes every signed-in user is the Lead Architect. This is the single isolated place that assumption lives — replace it there once real authentication exists. ("Timeline" here routes to the Sprint 4.6 Project Intelligence Timeline page, not the Evolution Strip rail below — see Project Intelligence Timeline / Project Evolution sections.)
- Evolution Strip (per-project, a narrow icon-only rail; newest items render first) — the "Project Evolution" feature (see below), unrelated to the Sidebar's "Timeline" nav item despite both historically carrying the word "Timeline" in code (`aria-label="Timeline"`).
- Project Journal — persistent Top Bar carries a compact project identity block (name, "CL · client", participants as overlapping avatars, sourced from the real `project_team`/`people`/`roles` tables). The Journal itself shows only a "Journal" title, then the discussion feed: fixed-height cards ordered by latest activity, each with a full-width title, a 3–4 message preview, an inline reply bar, and a dedicated plain-language Delta Summary. "Open Discussion" navigates (real routing, not a modal or in-place state swap) to a dedicated Discussion Detail page at `/projects/[id]/discussions/[discussionId]`, with Header, Delta Summary, Messages, a Knowledge section (see Knowledge below), Linked Content placeholders (Documents/Drawings/Meetings/Photos), and a Related Discussions placeholder.
- Attention panel (per-project, between the Journal and Delta) — placeholder cards for the approved example types, each linking to the project overview as a stand-in for a future Journal topic link
- Delta panel (per-project) — Quick Actions (Request Meeting, Upload Document, Add Requirement, Add Decision — only "Add Requirement" is wired; the other three are known, intentionally-undecorated stubs) as vertically stacked full-width buttons, plus the Delta Project Updates feed (Sprint 4.9: a real projection of the Event stream — the newest entries from `getTimeline()`, not a static fixture)

Individual feature pages (Requirements, Decisions, Contract Package, Participants, References, Settings, Project Documents) render as Journal content. Their internal implementations were not redesigned — only their duplicate outer chrome was removed. Timeline (`/projects/[id]/timeline`) is the exception: as of Sprint 4.6 it is a real, event-driven page (see Project Intelligence Timeline below), not a placeholder.

Root `/` redirects into this real workspace at `/projects`. The original static `DeltaApp` demo (fake project, fake data) remains reachable at `/review` only.

---

# Implemented Features

## Evidence

✓ Meeting Evidence

✓ Document Evidence

✓ Evidence Detail Views

---

## Knowledge Review

✓ Review Packages

✓ Review Workflow

✓ Knowledge Approval

---

## Discussions

✓ Discussion Architecture v1

Discussions are a real data model (`types/discussion.ts`: title, type, summary, participants, topics, status, linked-content arrays, related discussions) with a dedicated, routable Discussion Detail page. Still backed by mock data (`data/discussions.ts`), not Supabase. `topics` is always `[]` — no topic system exists yet.

---

## Knowledge

✓ Knowledge Objects v1 — Requirement, Decision, Action, Issue, Risk can be created manually from a Discussion's "Knowledge" section (modal: Title, Description, Priority, Related Topics, Status) and never edited directly — "Revise" appends an immutable revision to History instead. Built as clean types + a repository/service abstraction (`lib/repositories/knowledge-object-repository.ts`) behind an in-memory mock, so a future Supabase-backed implementation is a one-file swap. Each object has a dedicated detail page (`/projects/[id]/knowledge/[objectId]`) with Description, Revision History, Related Discussions (real, seeded from origin), and Related Documents / Related Drawings / Approvals as placeholders.

Current Status:

No AI, no automatic extraction, no approval workflow yet. Status/Priority use one shared vocabulary across all 5 types.

△ Requirements (legacy, project-level `/requirements`) — a real Supabase schema already exists (`requirements`, `requirement_revisions`, `requirement_approvals`, `requirement_evidence`, `requirement_document_links`) but only read-only `list`/`get` code was ever built; `/requirements/new` is a non-functional static mockup. Intentionally not wired into the new Knowledge Objects architecture — a future step should replace the mock Knowledge Object repository with a real implementation against this schema (or a migrated version of it) behind the same interface.

△ Decisions (legacy, project-level `/decisions`) — still a bare "Coming Soon" placeholder, conceptually superseded by the new Decision knowledge-object type.

---

## Knowledge Graph

✓ Relationship Foundation v1 (Sprint 4.0) — One generic `Relationship` model (`nodeA`, `relationshipType: "evidence" | "impact" | "related"`, `nodeB`) connects any two nodes in the system; deliberately not entity-specific (no `RequirementRelationship`, etc.). Built as `types/relationship.ts` + `lib/repositories/relationship-repository.ts` (interface + `MockRelationshipRepository`, in-memory, mirroring the Knowledge Object repository) + `lib/services/relationship-service.ts` + `lib/actions/relationship-actions.ts`. The Knowledge Object Detail page shows Evidence (Discussions/Meetings/Drawings/Documents/Photos/Videos/References) and Impacts (Requirements/Decisions/Actions/Issues/Risks/Drawings/Meetings) sections, and Delta's discussion insights panel (`DeltaInsights`, used on both the Journal feed card and the Discussion Detail page) shows Evidence / Related Knowledge / Impacts — all queried through `RelationshipRepository`, all mock data (`data/relationships.ts`, plus one seeded demo Knowledge Object in `data/knowledge-objects.ts`).

Current Status:

Foundation only — no graph visualization, semantic search, explainability, revision comparison, or impact-analysis features yet; no UI to create or remove a relationship (query-only so far); no Supabase wiring. This is the architecture those future features will build on.

---

## Delta Comprehension Engine

✓ Comprehension Engine v1 (Sprint 4.1) — The first stage of every Delta interaction: User → Comprehension → Knowledge Graph → Reasoning → Answer. `DeltaComprehensionService` (`lib/comprehension/`) runs six independently-replaceable modules in sequence — `NormalizationService` (spelling/abbreviation/synonym/whitespace/casing, dictionary-driven), `LanguageService` (English/Hindi/Hinglish detection and internal-only translation, rule-based), `IntentClassifier` (17 intents: Location/Status/Approval/Reason/Dimension/Material/Requirement/Decision/Action/Issue/Risk/Conflict/Evidence/Impact/Comparison/Revision/Related Knowledge), `EntityExtractor` (dictionary-driven, open entity-type vocabulary), `ContextResolver` (page/discussion/knowledge object/project), and `DestinationPredictor` (Delta Query/New Discussion/New Requirement/New Decision/New Issue/New Action) — each returning a confidence score, with low overall confidence triggering a clarifying question instead of a guess. Every module is constructor-injected with a default singleton, so a future LLM-backed implementation can replace any one stage without touching the others.

The existing "Ask Delta" flow (`useDeltaPanel` → `resolveDeltaQuery`) now runs every query through this engine first. Queries classified as Evidence/Impact/Related Knowledge with a discussion resolved in context query the real `RelationshipRepository` (Sprint 4.0); everything else falls back to the existing mock scenario matcher, now fed normalized/translated text. `DiscussionPrompt`, `ReplyBar`, `DiscussionMessages`, `DiscussionCard`, `Workspace`, and `DiscussionDetail` were threaded with an optional context argument so each Ask-Delta entry point knows its own discussion/project.

Current Status:

Deterministic/rule-based mock implementation only, per sprint scope — no embeddings, semantic search, graph reasoning, LLM prompting, OCR, upload intelligence, or revision comparison yet. Destination Prediction is surfaced as a non-blocking hint only; it does not change what pressing Enter/Send actually creates. `knowledgeObjectId` context is implemented but currently unused (no Ask-Delta entry point exists yet on the Knowledge Object Detail page).

---

## Intelligence Engine

✓ Intelligence Engine Foundation v1 (Sprint 4.2) — `lib/intelligence-engine/` adds the three modules that complete the architecture around Sprint 4.1's Comprehension Engine: `ContextEngine` (turns resolved context into an ordered, narrowest-first list of searchable scopes — current discussion node, then the whole project), `Orchestrator` (routes a comprehended message to one of 8 destinations — Knowledge Graph query / Requirement / Decision / Issue / Action workflow / Delta response / future upload pipeline / future comparison engine — deciding only, never performing the work), and `ResponsePlanner` (decides how an answer should be presented — short answer, comparison layout, or revision layout — independent of what the answer is). The top-level `IntelligenceEngine` class assembles all of this (plus Module 1) into one canonical `IntelligenceEngineResult` object, following the exact constructor-injection precedent Sprint 4.1 set. `delta-query-resolver.ts` (moved from `lib/comprehension/`) now runs every Ask-Delta query through `IntelligenceEngine.process()`, and genuinely searches the resolved discussion first before falling back to a project-wide, relationship-type-filtered query — the first sprint where "expand to project" is real behavior, not just a documented aspiration.

Current Status:

Deterministic/rule-based mock implementation only, per sprint scope — same exclusions as Sprint 4.1 (no embeddings, semantic search, graph reasoning, LLM prompting, OCR, upload intelligence, revision comparison). `ResponsePlan` is now genuinely consumed (Sprint 4.3) rather than computed-and-ignored. `upload_pipeline`/`comparison_engine` routing targets exist in the type but are unreachable this sprint. `knowledgeObjectId`-derived context scoping remains unimplemented, carried forward from Sprint 4.1.

---

## Evidence-Based Response Engine

✓ Evidence-Based Response Engine v1 (Sprint 4.3) — `lib/intelligence-engine/evidence-engine.ts`, `confidence-scorer.ts`, and `reasoning-engine.ts` complete the pipeline: User → Comprehension → Context → Evidence → Reasoning → Response Planner → UI. `EvidenceEngine` searches the current discussion first, then its linked knowledge objects (via the existing `getKnowledgeObjects` server action), then the whole project, matching generic queries by requiring every extracted entity to match a candidate (excluding the current context's own label from consideration, to avoid trivially matching on the discussion's own name) and preserving the precise narrower-tier-first cascade for Evidence/Impact/Related Knowledge intents. `ConfidenceScorer` derives a deterministic High/Medium/Low/None from the evidence alone. `ReasoningEngine` explains what was found and what's missing without ever inventing a claim the evidence doesn't support. `delta-query-resolver.ts` now uses `ResponsePlanner`'s layout (computed since Sprint 4.2, unused until now) to shape every response as a Simple Answer, Comparison, Related Knowledge listing, or an explicit "not enough evidence" Unknown result — never a guess. `lib/delta-mock-responses.ts` has been deleted; there is no fallback to fabricated data anymore.

Current Status:

Deterministic, relationship-driven, no AI — per sprint scope. High confidence is unreachable for generic (non-graph-native) intents given the current entity dictionary's thin overlap with seeded relationship labels; this is a data/dictionary limitation, not a scorer defect. Comparison's degrade-to-Unknown path was verified by code review only (no two seeded entities currently produce genuinely distinct evidence to compare live). Revision comparison remains explicitly unbuilt — `ResponsePlan.layout === "revision"` returns a plain "not available yet" message rather than being forced through the Answer or Unknown path.

---

## Journal Input Router

✓ Intelligent Input Router v1 (Sprint 4.3.1) — `DiscussionPrompt.tsx`'s Enter/Send action now branches on the Comprehension Engine's own destination classification (the same one already shown as a non-blocking hint since Sprint 4.1) instead of unconditionally creating a Discussion. Delta Query and every non-Discussion destination (Requirement/Decision/Issue/Action) route straight to `delta.ask()` — no Discussion is ever created for them; Requirement/Decision/Issue/Action get Delta's existing honest "this looks like a workflow item" response (Sprint 4.2/4.3, unchanged), not a new draft-creation flow. Only the Discussion destination proceeds to Discussion creation, and only after a new duplicate-detection check: `findMatchingDiscussionForMessage` (`lib/services/discussion-matching.ts`) weights the Comprehension Engine's own extracted entities above incidental keyword overlap, and a new `SimilarDiscussionPrompt` dialog offers "Continue existing discussion" (default) or "Create new discussion" when a sufficiently similar one is found.

Current Status:

No engine changed — this sits one layer above the frozen Comprehension/Intelligence/Evidence/Reasoning Engines and reuses their existing output. Duplicate matching is still literal keyword/entity overlap, not semantic similarity. Requirement/Decision/Issue/Action draft creation from Journal text was unbuilt as of this sprint — completed in Sprint 4.4. Scoped to the top-level Journal input only; `ReplyBar.tsx` (replying inside an already-open Discussion) is unchanged.

---

## Knowledge Capture Engine

✓ Knowledge Capture Engine v1 (Sprint 4.4) — `lib/knowledge-capture/knowledge-capture-engine.ts` completes the destination pipeline: a Requirement/Decision/Issue/Action-shaped Journal statement now generates a structured `KnowledgeDraft` instead of Delta's old text-only "workflow item" reply. One generic engine for every Knowledge Object type — no per-type draft services — reusing the frozen `ContextEngine`/`EvidenceEngine`/`ConfidenceScorer`/`ReasoningEngine` (Sprints 4.2/4.3) exactly as Delta's own answers do, plus a deterministic title heuristic and a type-keyed "why this draft" reasoning line. The review screen (`KnowledgeDraftReview`) supports Approve/Edit/Cancel — Edit opens the existing `KnowledgeObjectModal`, pre-filled — and nothing is created until Approve. Duplicate detection (`findMatchingKnowledgeObject`) now searches every Knowledge Object type via a new `listAll()` repository method, not just Requirements; a match offers "Continue existing" (revises the existing object via the unmodified `reviseKnowledgeObject` action) or "Create new" (resolves a Discussion exactly like the existing QuickActions Requirement flow, via a generalized `RequirementDiscussionPrompt`). Suggested relationships and participants are shown but never auto-created.

Current Status:

Deterministic, relationship-driven, no AI — per sprint scope. Draft titles are a simple heuristic (strip punctuation/obligation phrasing, title-case), not polished prose — refine via Edit before approving. High confidence has the same seed-data/dictionary ceiling as Sprint 4.3's own answers. Issue/Risk drafts that create a new Discussion fall back to the generic `"QRY"` Discussion type code (no dedicated code exists yet for either). Scoped to the top-level Journal input only, matching Sprint 4.3.1.

---

## Event Engine

✓ Event Engine Foundation v1 (Sprint 4.5) — the platform's new pillar, per `docs/architecture/DIGA-CORE-ARCHITECTURE-V2.md`. One generic `Event` model (`types/event.ts` — no `RequirementEvent`/`DecisionEvent`/etc.), an `EventPublisher` every part of the platform publishes through without knowing who's listening, an in-process `EventBus` (no external messaging), and an Event repository/service/action trio matching the existing architecture exactly. Four placeholder subscribers (Timeline, Notifications, Audit, Intelligence) register correctly and prove delivery but perform no real business logic yet. Six real write paths now publish events: Knowledge Object Created/Updated, Relationship Created/Removed, Knowledge Draft Approved, Discussion Created — all wrapped so a bug in the new Event Engine can never break the write it describes. A `TimelineProjection` (pure function, not a UI, not a new store) converts ordered events into timeline entries, filtered to user-facing significance.

Current Status:

Infrastructure only, per sprint scope — no notifications, approvals, or automation were built (Timeline UI followed in Sprint 4.6, see below). This is a transactional-outbox model, not Event Sourcing: the Knowledge Graph remains the sole source of truth for current state. `RelationshipService.create()`/`.remove()`'s event integration is correctly wired but not reachable from any live UI flow yet (no screen creates/removes relationships directly). `discussion.created` events never carry `projectId` (Discussion has no such field yet). `correlationId`/`causationId` exist in the model but aren't populated with real chains yet. No `firmId` field exists at all, pending real Firm/multi-tenancy implementation.

---

## Project Intelligence Timeline

✓ Project Intelligence Timeline v1 (Sprint 4.6) — `/projects/[id]/timeline` (reachable via the Sidebar's new "Timeline" item) renders Sprint 4.5's `TimelineProjection` output: events grouped Today/Yesterday/Earlier, each shown with a human-readable summary (e.g. "Requirement created: X", "Discussion started: Y" — not a raw event-type string), a category badge (Knowledge/Relationships/Discussions/Approvals/Intelligence, derived generically from the event's namespace prefix), the actor when available, and a link to the related Knowledge Object or Discussion detail page when one resolves. Lightweight category filter chips (All/Knowledge/Relationships/Discussions/Intelligence) filter client-side. Delta additionally answers timeline-shaped questions ("What happened yesterday?", "What was recently approved?", "What changed this week?") by pattern-matching temporal keywords on the already-translated Comprehension text and querying the same Event Log — reusing the existing `related` Delta response kind, not a new rendering path or a separate Timeline AI.

Sprint 4.9 humanized every entry's summary into an actor-first sentence ("Client approved Weather-protected clearance to accessible entrance," "Maya Chen flagged X for discussion") instead of "Requirement Updated"-style raw labels, using the event's real `actor.id` (falling back to a passive phrasing, never an invented name, when `actor.id` is `null`). Entries also gained `resultingState` (the `validationState` that resulted from that specific event, frozen at the time — not a live re-lookup, since the log is immutable) and an optional "Next step" line sourced only from a real, currently-open Recommendation for the same node.

Current Status:

`getTimeline()` is called unfiltered by `projectId` (a `discussion.created` events lack `projectId` — Sprint 4.5's own gap — and strict project-scoping would silently drop every Discussion event from the Timeline). Acceptable while the app is effectively single-project; revisit once `Discussion.projectId` exists or multiple real projects are seeded. "Intelligence" and "Relationships" categories exist in the UI/filter taxonomy but currently have no live data source (the Intelligence subscriber does no real work yet; `RelationshipService.create()`/`.remove()` aren't reachable from any live UI flow) — both are ready for when their upstream data exists. No Timeline-specific storage was introduced — this remains a pure projection over the Event Log.

---

## Knowledge Validation

✓ Knowledge Validation & Approval Intelligence v1 (Sprint 4.7) — a reusable `KnowledgeValidationPanel` (`components/knowledge-validation/`), embedded once on the Knowledge Object Detail page (`/projects/[id]/knowledge/[objectId]`), works identically for all 5 Knowledge Object types (no `RequirementApproval`/`DecisionApproval`/etc.). `KnowledgeValidationEngine` (`lib/knowledge-validation/knowledge-validation-engine.ts`) assembles everything the panel shows — Summary, Evidence, Related Knowledge, Potential Impacts, a Timeline of recent changes (reusing `TimelineEntryCard` directly), Confidence, Reasoning, Suggested Reviewers, and informational Validation Checks (missing evidence, missing relationships, low confidence, possible duplicate, no suggested reviewers) — entirely by calling the unmodified Sprint 4.3 `EvidenceEngine`/`ConfidenceScorer`/`ReasoningEngine`, the Sprint 4.5 Event Log, and the Sprint 4.4 duplicate-matching service. Nothing is fabricated; every check and every suggested reviewer traces to a real, already-computed signal.

A `ValidationState` field on `KnowledgeObject` is a second, generic axis deliberately independent of the existing `status` lifecycle field — `pending | approved | rejected | revoked`, and (Sprint 4.9) a 5th real state, `needs_discussion`, a genuine human-triggered flag mirroring exactly how the other 4 work. The panel's five actions (Request Approval / Approve / Reject / Needs Discussion / Revoke Approval) each perform one real repository write plus one matching `approval.*` Event, in the same call — the same "real write + `publishSafely`" shape `create()`/`.revise()` already use. No separate Approval database or parallel workflow system was introduced. Approval events categorize as `"approvals"` and produce human-readable summaries on the existing Sprint 4.6 Timeline page automatically. Delta additionally answers "Why should this be approved?", "Who should review this?", and "What's missing?" when asked with a Knowledge Object *or a Discussion* in context (Sprint 4.9 extended the resolution to fall back to a Discussion's most recently created Knowledge Object when no `knowledgeObjectId` is directly known — e.g. asking from the Journal) — reusing the same assembled data, never a new AI pipeline.

Sprint 4.9 also added an **approval roster** (`ApprovalRoster` on `KnowledgeValidation`, computed by `lib/knowledge-validation/approval-roster.ts`'s `computeApprovalRoster()`): `approvedBy`/`rejectedBy`/`pendingReviewers`, aggregated purely from real `approval.granted`/`approval.rejected` event actors against `approvalRequiredFrom` — read-only visibility, no gating, per the architecture doc's own §8 suggestion. A derived **Current Stage** (`raised` vs `under_review` vs the other `ValidationState`s 1:1) is shown alongside it in a new, generic Workflow section on the Knowledge Object Detail page (Raised By / Current Owner / Reviewers / Approvers / People Notified / Current Stage — works for all 5 types, not just Requirement).

Current Status:

All five transition actions are always available regardless of current `validationState` — no state-machine gating, deliberately (that would be the multi-stage workflow logic this sprint excludes). `revise()` does not reset `validationState` — an approved object keeps its "Approved" badge after an unrelated edit until someone explicitly revokes it. "Conflicting knowledge" is not a real check — no conflict relationship type or detector exists in the graph, and fabricating one was rejected. Suggested Reviewers resolves names from `raisedTo`/`approvalRequiredFrom`/linked-Discussion `participants` only (never `notify` — that's a Notifications concern) and has the same pre-authentication display-string-matching limitation as everywhere else in the app (no real People/`project_team` lookup exists yet) — the same limitation now also applies to the approval roster's `approvedBy`/`rejectedBy` (Sprint 4.9), since every actor in this app is currently a hardcoded stand-in.

---

## Recommendations

✓ Recommendation Engine v1 (Sprint 4.8) — a new, fifth Event subscriber (`lib/events/subscribers/recommendation-subscriber.ts`, registered alongside Timeline/Notifications/Audit/Intelligence, all still placeholders) evaluates every published Event against six rules (`lib/recommendations/recommendation-rules.ts`): Knowledge approved → notify reviewers; Relationship added → review affected Knowledge; Knowledge updated → check related Discussions; low confidence (recomputed live, same call shape as `KnowledgeValidationEngine`) → gather more evidence; a freshly created object with no relationships → link related Knowledge; a Discussion whose summary genuinely classifies as workflow-shaped language (via the unmodified `deltaComprehensionService`) → extract Knowledge. Each rule is independently gated by `eventType` and produces only real, evidence-backed content — nothing is fabricated, and none of the six ever writes to any repository other than the new `RecommendationRepository`.

`Recommendation` (`types/recommendation.ts`) is one generic model — no `RequirementRecommendation`/`DrawingRecommendation`/etc. — with `recommendationType` an open string, matching `Event.eventType`'s own philosophy. Recommendations are their own objects, not Events: a separate repository/service/action trio, auto-persisted on evaluation (unlike Knowledge Drafts, which require approval before creation — a Recommendation record itself never mutates the Knowledge Graph, so no gate is needed to create one). A light de-duplication check (same `recommendationType` + same primary related node, against currently-open recommendations) prevents runaway repeats without any transition-validity gating or workflow logic. A reusable `RecommendationPanel`/`RecommendationCard` (`components/recommendations/`) shows Title/Reasoning/Confidence/Evidence/Related Knowledge with Accept/Dismiss/"Open {node type}" actions (Sprint 4.9: the link text is now type-specific — "Open Requirement," "Open Discussion," "Open Meeting" — instead of a generic "View Related"), mounted on the Project Intelligence Timeline page (`/projects/[id]/timeline`). Accept only flips `status` to `"accepted"` and publishes a `recommendation.accepted.v1` Event — it never executes any work, per the brief's own "AI proposes, humans decide" framing applied to recommendations specifically. Sprint 4.9 fixed a confirmed bug where a resolved card simply vanished with no confirmation: resolved recommendations now stay visible in a dimmed "Resolved" sub-list with an "Accepted"/"Dismissed" tag instead of disappearing. Both new Event types fall into the Timeline's existing `"intelligence"` category with zero new categorization code — that category has been "reserved for forward-compatibility, nothing populating it yet" since Sprint 4.6's own docs said so. Delta additionally answers "What should I do next?", "What requires attention?", and "What recommendations do you have?" (`lib/recommendations/recommendation-query.ts`, wired into `delta-query-resolver.ts` as one more narrowly-gated early-exit branch, after Sprint 4.7's own) by listing real open recommendations.

Current Status:

The placeholder `intelligenceSubscriber` (Sprint 4.5) was deliberately left untouched — this sprint added a new, distinct subscriber rather than wiring that reserved slot, keeping the two capabilities named and scoped separately. Rule 2 (relationship added) only resolves a title for Knowledge Object node types — no lookup service exists for Meeting/Drawing/Document/Photo/Video/Reference nodes, so a relationship touching only those never produces a recommendation. Discussion-sourced recommendations never carry a `projectId` (the same pre-existing `discussion.created.v1` gap as everywhere else); `getRecommendations()` is called unfiltered on the Timeline page for the same reason `getTimeline()` already is. The Recommendation Panel has exactly one mount point this sprint (the Timeline page) — the component itself is generic/reusable, matching how `KnowledgeValidationPanel` (Sprint 4.7) was built reusable but wired into one page first.

---

## Workflow & Experience Polish

✓ Sprint 4.9 — a UX/workflow completion pass over Sprints 4.0–4.8's engines, not a new capability. Fixed five confirmed bugs found in manual browser testing: Journal Delta Q&A silently discarded the user's question (now preserved and shown as a "You asked" line above Delta's answer, for the life of the visible response — not a persistent cross-session log); "Continue Existing" (Knowledge Object duplicate) performed a real write but gave no visible feedback (now navigates to the object/discussion that changed); Knowledge cards inside `DeltaInsights` (the Journal feed's Evidence/Related Knowledge/Impacts rows) weren't clickable at all — the component wasn't even given a `projectId` — now wrapped in real links via the existing `nodeHref()` helper; Recommendation Accept/Dismiss made the card vanish with no confirmation (now moves to a visible "Resolved" section); Delta's approval questions ("Why should this be approved?" etc.) silently failed when asked from the Journal instead of a Knowledge Object's own page (now resolves to the current Discussion's most recent Knowledge Object when no `knowledgeObjectId` is directly known).

A **Notification Foundation** was added alongside the Approval Workflow Foundation (see Knowledge Validation above): `KnowledgeObjectService`'s existing event-publishing calls now copy `object.notify` into each event's `metadata`, and the new Workflow section displays it as "People Notified," honestly labeled "recorded, no delivery mechanism yet" — no notification repository, no real delivery, per the brief's own explicit exclusion.

**Page consistency**: Journal, Timeline, and Knowledge Object Detail now all import the same shared spacing/max-width constants (`lib/workspace-layout.ts`) instead of Timeline having none at all and Knowledge hand-duplicating the identical literal strings — a mechanical unification, not a redesign; `WorkspaceLayout`'s Attention/Actions rails remain Journal-only.

Current Status:

Several of the bug fixes (question preservation, navigation-on-success, resolved-card styling) are pure client-state/rendering changes that could only be verified via code review and the underlying data they depend on (not a full authenticated browser click-through — no test credentials in this environment, same limitation every prior sprint has documented). See `PROJECT_CONTEXT/SPRINTS/Sprint-4.9-Workflow-and-Experience-Completion.md` for the full list of what was and wasn't built, including why "Affected disciplines"/"Affected spaces" (requested as example Potential Impact categories) remain unbuilt — no real data model backs either one anywhere in this codebase.

---

## Revision Intelligence

✓ Revision Intelligence Foundation v1 (Sprint 5.0 — Phase 2, sprint 1) — a new `lib/revision-intelligence/` module (`RevisionComparator`, `ChangeExtractor`, `ChangeClassifier`, `ImpactAnalyzer`, `RevisionReasoner`, `RevisionOrchestrator`, top-level `RevisionEngine`, constructor-injected exactly like `IntelligenceEngine`) turns a detected drawing-revision diff into real project knowledge, never pixels. `RevisionComparator` is the sole seam that will one day be replaced by a real DWG/Revit/IFC/Computer-Vision parser — today it reads seeded mock diff data (`data/revision-changes.ts`). One generic `Revision` model (`types/revision-intelligence.ts`, no `DoorRevision`/`WallRevision`/`RoomRevision`) reuses `Evidence`/`ReasoningResult`/`ConfidenceLevel`/`RelationshipNode` exactly as `Recommendation`/`KnowledgeValidation` already do. `RevisionService` (the only layer that writes) turns every detected change into a real `Issue` Knowledge Object, creates the suggested Relationships (reshaped from real `ImpactAnalyzer`/`EvidenceEngine` matches — never fabricated), and publishes three new events (`revision.uploaded.v1`, `revision.changes_detected.v1`, `revision.reviewed.v1`) through the unmodified Event Engine. A 7th Recommendation rule and three new Timeline `SUMMARY_BUILDERS` entries plug in with zero changes to the Recommendation Engine, subscriber, or Timeline's `categorize()`; a new Delta query branch (`lib/revision-intelligence/revision-query.ts`) answers "What changed?", "Why did it change?", "What should I review?", and five other revision-shaped questions from real, persisted `Revision` records.

Current Status:

Foundation only, per its own brief — no real CAD comparison, DWG/Revit/IFC parsing, OCR, computer vision, or BIM extraction. No new UI was built or is needed yet: Timeline, the Recommendation Panel, and Delta already display everything this sprint produces automatically, since all three are pure projections/subscribers over the reused engines. No UI triggers the pipeline yet — verified end-to-end via a temporary smoke-test route against the real seed project and service layer (added and removed within the session, same technique every prior sprint has used). Relationships are created immediately rather than held behind a human-review gate (Knowledge Drafts have one; Revision Intelligence does not yet). Every detected change becomes an `Issue` Knowledge Object — the closest existing fit among the five closed types, not a dedicated "Revision" type. See `Sprint-5.0-Revision-Intelligence-Foundation.md` for the full list of decisions and honestly-documented limitations.

---

## Drawing Intelligence

✓ Drawing Intelligence Foundation v1 (Sprint 5.1 — Phase 2, sprint 2) — a new `lib/drawing-intelligence/` module (`DrawingParser`, `DrawingClassifier`, `SheetAnalyzer`, `TitleBlockExtractor`, `ViewExtractor`, `AnnotationExtractor`, `DrawingReasoner`, `DrawingOrchestrator`, top-level `DrawingIntelligenceEngine`, constructor-injected exactly like `IntelligenceEngine`/`RevisionEngine`) turns a parsed drawing sheet into real project knowledge. Deliberately NOT "PDF Intelligence" — `DrawingParser` is the sole seam that will one day be replaced by a real DWG/DXF/IFC/Revit/image/CAD-API parser; today it reads seeded mock data (`data/drawing-uploads.ts`), and `DrawingSourceFormat` is never branched on anywhere else in the pipeline. One generic `Drawing` model (`types/drawing-intelligence.ts`) reuses `Evidence`/`ReasoningResult`/`ConfidenceLevel`/`RelationshipNode` exactly as `Recommendation`/`Revision` already do. A Drawing is a real `"drawing"`-type Relationship Graph node (that type has existed since Sprint 4.0) — not wrapped in a Knowledge Object, unlike Sprint 5.0's detected revision changes, since a Drawing already has a proper graph identity. Eight realistic, believable drawings ship seeded (`data/drawings.ts`: Site Plan, Ground Floor Plan, Canopy Detail, First Floor Plan, North Elevation, Section A-A, Door Schedule, Room Schedule), connected to each other and to a newly-real Decision Knowledge Object (`decision-canopy-material`, upgraded from a previously denormalized-only label) completing a real Requirement → Discussion → Decision → Drawing → Revision → Knowledge → Relationships → Recommendations → Timeline → Delta chain. `DrawingService.getRevisionSummary()` composes the unmodified Sprint 5.0 `RevisionService` live — no duplicated revision storage. `DrawingService.analyze()` computes live evidence/reasoning/suggested-relationships for any drawing (seeded or freshly ingested) on demand, never trusting a stale stored snapshot. A new Delta query branch (`lib/drawing-intelligence/drawing-query.ts`) answers "What drawings exist?", "Which is the latest revision?", and "Which drawings relate to X?" from real, persisted `Drawing` records.

Current Status:

Foundation only, per its own brief — no real PDF/DWG/DXF/IFC/Revit parsing, OCR, or computer vision; views/annotations are represented structurally (label and type only, never a coordinate or geometry). No new UI was built. A known `EvidenceEngine` interaction limitation was found and documented: a newly-ingested drawing (always `nodeA` of its own new relationships) cannot be surfaced by "which drawings relate to X" the same way a pre-existing drawing can, since `EvidenceEngine`'s reference-less generic search always returns `nodeB` as "the other side" of a match — a pre-existing engine characteristic, not something this sprint could fix without touching a frozen file. See `Sprint-5.1-Drawing-Intelligence-Foundation.md` for the full list of decisions and honestly-documented limitations.

---

## Project Intelligence Gateway

✓ Project Intelligence Gateway Foundation v1 (Sprint 5.2 — Phase 2, sprint 3) — one unified entry point for every future knowledge source, per `docs/architecture/DIGA-CORE-ARCHITECTURE-V2.md`'s own channel-agnostic-ingestion vision. `lib/project-intelligence-gateway/` (`SourceClassifier`, `CapabilityRouter`, `GatewayOrchestrator`, `ProcessingCoordinator`, `ProcessingTracker`, top-level `ProjectIntelligenceGateway`, constructor-injected exactly like `IntelligenceEngine`/`RevisionEngine`/`DrawingIntelligenceEngine`) identifies a submitted `Source` (one generic model, `types/project-intelligence-gateway.ts` — drawing/document/meeting/photo/video/voice/email/chat/spreadsheet/presentation/specification/schedule/site_report), routes it to a registered capability, coordinates the actual call, and tracks its `ProcessingState` (received → classified → processing → completed/needs_review/failed) — but never performs domain intelligence itself. Three capabilities are registered today (`lib/project-intelligence-gateway/capabilities/`), each a thin adapter calling an existing, unmodified engine: Revision Intelligence (claims a "drawing" source carrying revision metadata), Drawing Intelligence (claims a plain "drawing" source), and Journal Intelligence (claims "chat," calling only `deltaComprehensionService.comprehend()` — never bypassing Knowledge Capture's human-approval gate, so Journal-routed sources always land in `needs_review`, never a fabricated `completed`). Future engines (Meeting/Document/Photo/Voice/BIM Intelligence) register by implementing the same `IntelligenceCapability` interface and appending to one array — the Gateway itself never changes. Six new lifecycle Events (`source.received.v1` through `source.processing_failed.v1`) reuse the unmodified Event Engine with zero Timeline `categorize()` changes. A Gateway Dashboard projection (`gateway-dashboard.ts`) and a Delta integration (`gateway-query.ts`, five distinct real-subset answers) are both built and verified, with no UI yet. Nine realistic sources ship seeded (`data/sources.ts`: an architectural drawing, a client brief, a meeting transcript, a specification, site photographs, a BOQ, an email, a WhatsApp conversation, site visit notes) — seven honestly sit at `needs_review` since no capability exists yet for their type, demonstrating the registration model's extensibility by its own honest absence rather than a fabricated success.

Current Status:

Foundation only. No UI triggers ingestion yet; no Gateway Dashboard page exists (the projection is proven queryable end-to-end, not displayed). `"queued"` (a `ProcessingState`) is never reached — there is no background-job/queue system anywhere in this codebase. A real bug in Sprint 5.1's `DrawingClassifier` (no rule matched "Roof Plan") was found and fixed by this sprint's own end-to-end verification — exactly the kind of gap a real, generic entry point is meant to surface. See `Sprint-5.2-Project-Intelligence-Gateway.md` for the full list of decisions and honestly-documented limitations.

---

## Registration, Firm & Project Foundation

✓ Registration, Firm & Project Foundation v1 (Sprint 5.3) — the complete beginning of the DIGA user journey: Landing → Register → Verify (placeholder) → Create/Join Firm → Invite Team → Create Project → Project Workspace. Real Supabase Auth (`signUp`/`signInWithPassword`/`signOut`/`resetPasswordForEmail`/`updateUser`/`resend`) backs registration, login, logout, and password-reset/email-verification placeholders — no custom email delivery was built; whether an email actually arrives depends on the hosted Supabase project's own SMTP configuration. A real Firm/Organization model (`firms`, evolved from the long-dormant `companies` table exactly per `docs/database/schema-review.md`'s own already-reviewed decision) supports Create Firm, Join Firm (invite code), and basic profile fields (logo, address). A new `firm_members` join table (`Person → Firm Membership → Firm`, per `docs/architecture/002-authentication-and-authorization.md`) replaced the removed `people.company_id`, since a person may belong to multiple Firms. Team invitations (`firm_invitations`) generate an on-screen invite code — no email is sent. Module 3's exact 7 roles (Owner/Architect/Designer/Engineer/Client/Consultant/Viewer) reuse the *existing* `team_types`/`roles`/`project_team` tables under one new `"General"` team type, rather than a parallel role system — the same role picker vocabulary serves both Firm invites and the new Project Creation Wizard's Step 3. The old single-page "New Project" form is now a real 4-step wizard (Details → Scope & Timeline → Project Team → Review), and `projects` gained `firm_id`/`owner_id`/`created_by`/`scope`/`timeline`/`budget` columns. A lightweight Project Dashboard (`/projects/[id]/dashboard`) and a Welcome banner (shown only on a genuinely empty project, using Knowledge/Drawing counts — not the unfiltered Discussion count — to decide emptiness) both reuse existing projections (`getTimeline`/`getRecommendations`/`getAllKnowledgeObjects`/`getDrawings`/`getDiscussions`) rather than new query logic. Four new Events (`user.registered.v1`/`firm.created.v1`/`member.invited.v1`/`project.created.v1`) reuse the unmodified Event Engine and appear on the existing Timeline automatically. Delta answers four onboarding questions ("How do I start?", "What should I upload first?", "Who should I invite?", "What happens next?") from the exact same real project-state data the Welcome banner uses. A project-root `proxy.ts` (Next.js 16 renamed `middleware.ts` — functionality unchanged) now provides session refresh and baseline "must be signed in" route protection, which did not exist in any form before this sprint.

Current Status:

Built and verified against the **real, hosted Supabase project** — the first sprint to do so; every Sprint 4.0–5.2 intelligence feature instead uses in-memory mock repositories. Verification surfaced and fixed several real, non-obvious issues: `service_role` needed an explicit `GRANT` (this project's `auto_expose_new_tables` setting means RLS policies alone are insufficient for ANY role, including `service_role` — a durable finding for future migrations); a PostgREST ambiguous-embedding error (`firm_members` has two FKs into `people`); a multi-Firm-membership bug (`docs/architecture/002` explicitly allows a person to belong to multiple Firms — `getFirmForPerson()` originally assumed exactly one); and a Timeline regression where a real UUID appeared in a summary sentence instead of a name (fixed by threading the person's display name through as `actor.id`, matching every prior sprint's own convention). This sprint deliberately implements a simplified invite-code mechanism, not `docs/architecture/002`'s fuller secure-link-plus-Lead-Architect-review workflow, Co-Authenticators, or ownership transfer — schema (`firm_members.status: "invited"`) already anticipates that evolution without a breaking change. No permission enforcement exists yet (role assignment only, per the brief's own exclusion); `lib/permissions/project-info-ui.ts`'s hardcoded `canViewProjectInfo(): true` was deliberately left untouched (a permission concern, not an authentication one). See `Sprint-5.3-Registration-Firm-Project-Foundation.md` for the full list of decisions and honestly-documented limitations.

---

## Project Onboarding (superseded by Governance Engine & Project Setup, Sprint 5.7)

△ Project Onboarding v1 (Sprint 5.4) — **replaced this sprint.** `lib/onboarding/`, `app/projects/[id]/onboarding/`, and the `project_onboarding`/`project_questionnaire_responses`-driven wizard described below were deleted; `ProjectWizard.tsx` now routes a newly created project to `/agreement` (Sprint 5.7's Agreement First workflow), not this wizard. Kept below only as historical record of what Sprint 5.4 built — a real, resumable 5-step wizard (`/projects/[id]/onboarding`) that `ProjectWizard.tsx` used to route to immediately after project creation, replacing the direct-to-Journal redirect Sprint 5.3 shipped. `project_onboarding` (new table: `current_step` plus five `*_completed_at` timestamps, a `discussion_id`, and `summary_text`) and `project_questionnaire_responses` (new table) persist real state directly — no separate draft/state blob. Step 1 (Details) writes `project_stage`/`gross_floor_area`/`target_completion_date`/`time_zone` onto `projects` directly. Step 2 (Team) reuses the existing `team_types`/`roles`/`project_team` architecture, extended with new Design Team roles (Project Architect/Designer/Structural Engineer/Landscape Consultant/Interior Designer) and a new "Delivery Team" type (Quantity Surveyor/Contractor) — the same reuse discipline Sprint 5.3 established for Firm roles. Step 3 (Documents) reuses the existing Document upload architecture (`uploadDocumentFile`, real Supabase Storage) across 8 categories, then registers each upload with the Sprint 5.2 Project Intelligence Gateway (`ingestSource`) — honestly landing in `needs_review` for every category except a plain drawing, since no Document/BOQ/Agreement Intelligence capability exists yet. Step 4 (Questionnaire) answers 10 structured questions, each becoming a real `Requirement` or `Risk` Knowledge Object anchored to one shared onboarding Discussion (created on first answer). Step 5 (Summary) composes a deterministic, template-based draft from the actually-collected data — never an LLM call — editable before confirming. Five new Events (`onboarding.started.v1` through `onboarding.completed.v1`) reuse the unmodified Event Engine and appear on the existing Timeline automatically. `lib/onboarding/onboarding-gaps.ts` (new, shared) computes missing core roles/document types/questionnaire completion once, consumed by both five new Recommendation rules (self-deduplicating, since onboarding gaps have no natural Knowledge Graph node) and four new Delta onboarding-progress questions ("What's still missing?", "What documents should I upload?", "Who has not been assigned yet?", "What have we completed?"), alongside Sprint 5.3's original four. The Dashboard shows onboarding progress (percentage + checklist) with a "Continue Onboarding"/"Revisit Onboarding" CTA, shown whether onboarding is complete or not.

Current Status:

Built and verified against the real, hosted Supabase project, same as Sprint 5.3. Live testing surfaced and fixed two real regressions to pre-existing functionality, not just new-feature bugs: a Next.js 16 `revalidatePath`-during-render 500 on the onboarding page's own first load (fixed by removing an unnecessary `revalidatePath` call from a Server-Component-invoked action), and a client-bundle `next/headers` leak — `onboarding-query.ts`/`onboarding-gaps.ts` originally imported the Supabase-backed `OnboardingService` directly, which fed into `delta-query-resolver.ts` and from there into the client-side `useDeltaPanel` hook, breaking the existing Journal page (`/projects/[id]`) entirely until fixed by routing through the existing `"use server"` action instead. No OCR, document parsing, drawing analysis, or BOQ intelligence was built — explicitly out of scope. Team assignment is not required to advance past its own step (a project can finish onboarding with zero team members; this is intentional — team completeness is a Recommendation concern, not a step gate). One small, non-sensitive orphaned test-upload file likely remains in the shared Storage bucket (see `Sprint-5.4-Project-Onboarding.md` for detail). See `Sprint-5.4-Project-Onboarding.md` for the full list of decisions and honestly-documented limitations.

---

## Project Dashboard / Mission Control

✓ Project Dashboard / Mission Control v1 (Sprint 5.5) — `/projects/[id]/dashboard` is now the project's landing page (`/projects` links here, not to the Journal), composed entirely from data Sprints 4.0–5.4 already produce, through one aggregator (`getMissionControlData()`, `lib/actions/dashboard-actions.ts`) both the page and Delta share — nothing here is a new intelligence engine and nothing is persisted; the whole page recomputes live on every load. Delta Briefing (Module 2) is a deterministic, template-composed summary over a rolling 7-day window (not the brief's literal "since your last visit," since no visit-tracking storage may be introduced — documented explicitly). Project Health (Module 3) shows 8 real metrics — Knowledge Objects, Discussions, Open Recommendations, Pending Approvals, Open Validation Requests (two genuinely distinct real counts, not the same signal twice), Recent Revisions, Missing Onboarding Items, and Knowledge Coverage (computed from the real `Relationship` graph, showing "Not Available" rather than a fabricated 0% when a project has zero Knowledge Objects). Attention Center (Module 4) aggregates pending approvals, Gateway "needs review" sources, open Recommendations (excluding onboarding-gap ones, to avoid double-counting against the Missing Onboarding item), missing onboarding items, and newly detected revisions into one deduplicated, urgency-sorted list. Project Snapshot (Module 5), Recent Activity (Module 6, reusing `TimelineEntryCard` directly), Recommendations (Module 7, reusing `RecommendationPanel` directly, unmodified), Upcoming (Module 8, with honest empty states for Meetings/Milestones since neither has a real per-project data model yet), Quick Actions (Module 9, routing Requirement/Decision/Issue/Action/Discussion shortcuts to the Journal — the one real place creation happens today), and Recent Documents (Module 10) round out the page. Delta answers "What needs my attention?" (deliberately rerouted from Sprint 4.8's narrower open-Recommendations answer to this sprint's richer, superset Attention Center), "How healthy is this project?", "What approvals are pending?", and "What changed since yesterday?" (Module 12).

Current Status:

Two real bugs were found and fixed via this sprint's own live testing, both in the Delta integration layer, not the new Dashboard code: Sprint 5.0's `detectRevisionQuestion()` was hijacking "What changed since yesterday?" (matching bare "what changed" and running earlier in the resolver chain) before Sprint 4.6's own timeline handling ever ran — fixed with a narrow temporal-qualifier exclusion in `revision-query.ts`. Even after that fix, the phrase still couldn't reach Sprint 4.6's handling because it sits behind the Comprehension Engine's own clarification gate, which this sprint may not modify — fixed by having the new `dashboard-query.ts` call `timeline-query.ts`'s own `detectTimelineQuery`/`answerTimelineQuery` directly, checked earlier in the resolver, exactly where every Sprint 4.7+ branch already sits. No new intelligence, no new storage, no engine redesign. See `Sprint-5.5-Project-Dashboard-and-Mission-Control.md` for the full list of decisions and honestly-documented limitations.

---

## Existing Project Import

✓ Existing Project Import v1 (Sprint 5.6) — a dedicated Import Workspace (`/projects/[id]/import`, reachable via a new sidebar "Import" item) lets a firm bring an already-running project's documents into DIGA across as many sessions as needed, rather than requiring everything during the one-time Onboarding Wizard. Reuses Sprint 5.4's own 9 (8 + Meeting Minutes) asset categories verbatim and the exact same `uploadDocumentFile` + Project Intelligence Gateway `ingestSource` composition — no new upload pipeline, no new Gateway capability. Every category card shows real, independently-true Imported/Pending/Needs Review/Failed counts (never a single collapsed state, never a fabricated percentage). Import Sessions (`lib/import/import-session-projection.ts`) are a pure projection over `Source[]` grouped by a client-generated, ephemeral session id carried only in `Source.metadata` — no new repository, no new table, no job queue; a session's real completion is derived from whether every one of its sources reached a terminal processing state, independent of the optional "Finish this session" button (which only records a Timeline fact). Knowledge Linking reuses the unmodified Relationship Graph (`createRelationship`) to connect any imported asset to a real Knowledge Object. Two new Recommendation Engine rules extend Sprint 5.4's own document-gap checking (missing Specifications; a classified Drawing with zero linked Requirements) and Delta gained five new import-shaped questions ("What documents have been imported?", "What documents are still missing?", "Has the agreement been uploaded?", "What reports exist?", plus "Which drawings are available?" added to the existing Drawing Intelligence Delta branch). The Dashboard's new Import Progress panel and Recent Drawings list reuse the exact same `getMissionControlData()` aggregator (Sprint 5.5) — zero duplicate dashboard logic.

Current Status:

A real, pre-existing Drawing Intelligence limitation (Sprint 5.1: only seeded mock uploads can be parsed, never a real file) is now honestly visible in the Import Workspace's own UI for the first time — a genuinely new Drawings-category import correctly, honestly shows as "Failed," not a fabricated success. No revision-aware import exists (bringing in a drawing's prior revision history from before it joined DIGA) — only a single current-state ingestion, matching Onboarding's own Documents step exactly. "Skipped files" can only ever be shown for the current live session, never reconstructed for past ones, since a client-side-rejected file leaves no persisted trace by definition. Recommendations never auto-resolve when their underlying gap is later filled — a pre-existing Sprint 4.8 design decision, not new to this sprint. See `Sprint-5.6-Existing-Project-Import.md` for the full list of decisions and honestly-documented limitations.

---

## Governance Engine & Project Setup

✓ Governance Engine & Project Setup v1 (Sprint 5.7) — a freshly created project now starts at `lifecycle_stage: "draft"` and walks Agreement → Project Setup → Delta Project Review → Activation before the collaborative workspace (Dashboard/Journal/Timeline/Knowledge/Recommendations, each now gated by `requireActiveProject()`) unlocks. Agreement upload is mandatory (`/projects/[id]/agreement`); review offers Accept / Open Discussion / Request Revision — no Reject action exists. Clause Discussions (`Discussion.clauseRef`) attach to a specific clause and persist across Agreement versions. A generalized Document Revision Intelligence (`lib/document-revision-intelligence/`) compares any two `document_revisions` by metadata, with a real content-level analyzer for Agreements (reading clause Discussions opened since the previous version) and an honest "not available yet" note for every other document type — left entirely separate from the unmodified, drawing-specific Sprint 5.0 `RevisionEngine`. A single Governance Engine (`lib/governance/`) computes a `GovernanceRoster` (Creator/Required Approvers/Mandatory Notify/Watchers) live from a newly extracted `lib/impact-engine/impact-engine.ts`, seeded `governance_rules`, and active Delegations — users never pick approvers manually. Authority & Delegation (`delegations` table, `lib/services/delegation-service.ts`) is real, permanent domain state: a two-step confirm-before-delegate UI, rows never deleted (only `status: "revoked"`), each permanently recording the original authority, delegate, reason, and period. Exactly one Main Client per project (`projects.main_client_person_id`) has decision authority by default; Client Representatives never automatically inherit it. Project Membership (`project_invitations`, WhatsApp/Copy Link/SMS/Email share links via `lib/invitations/share-links.ts`, `/invite/[code]`) is separate from Firm membership — registration happens after invitation, never project discovery. `project_setup` (direct successor to the deleted `project_onboarding`) guides Team/Consultants/Client Representatives/Import/Questionnaire/Review with honest, non-fabricated progress; the Questionnaire produces real, pending Requirement/Constraint/Preference/Risk Knowledge Objects; Delta Project Review composes a deterministic Project Understanding narrative (never an LLM call) and is explicitly not itself an approval step. 10 new Events and 7 new Delta governance questions ("Who still needs to approve?", "Who has delegated authority?", "Why is this waiting?", "What changed in this agreement?", "Which clause changed?", "Why was Version N uploaded?", "Who has been notified?") all reuse the unmodified Event Engine and Delta pipeline — zero new intelligence engine, zero new UI-owned business state.

Current Status:

This sprint continued a prior session's own partial implementation (found via audit — ~1,095 lines and 8 already-applied migrations — rather than discarded per this project's own "investigate unfamiliar state before overwriting" discipline) and performed the sprint's first full live verification, via a temporary, fully-removed Route Handler calling the real actions under genuine authenticated request context (same technique every Sprint 5.x verification has used, extended to real session cookies obtained via `signInWithPassword`). Three real bugs were found and fixed: (1) a PostgREST ambiguous-embedding regression — this sprint's own `project_team.invited_by` column addition broke every pre-existing `people` join on that table (Dashboard team display, Journal Top Bar participants, the Participants page), not just new code, fixed with the `people!person_id(...)` column hint at all four sites; (2) `proxy.ts` never listed `/invite` as a public path, making the pre-auth invitation landing page permanently unreachable; (3) two Delta governance-question bugs — `detectRevisionQuestion()`'s bare "what changed" pattern was hijacking "What changed in this agreement?" (fixed with a narrow `AGREEMENT_QUALIFIER` exclusion, same precedented fix class as Sprint 5.5's own `TEMPORAL_QUALIFIER`), and `answerObjectGovernanceQuestion()` had no fallback to the Agreement's own roster when no Knowledge Object was in context (fixed by reusing `getAgreementReviewContext()`). Watchers (Module 10) is a real field, always empty this sprint — foundation only. No permission/authorization enforcement exists — Delegation changes who a roster resolves to, but nothing yet prevents an arbitrary signed-in user from calling an action directly, the same boundary every prior sprint has drawn. Content-level revision comparison exists only for Agreements; BOQ/Specification/Report/Meeting Minutes show metadata only, honestly labeled — no PDF/DOCX text-extraction pipeline exists anywhere in this codebase. See `Sprint-5.7-Governance-Engine-and-Project-Setup.md` for the full list of decisions and honestly-documented limitations.

---

## External Access & Guided Experience

✓ External Access & Guided Experience v1 (Sprint 5.8) — the presentation and access layer over Sprint 5.7's Governance Engine, validated by actually running real projects through it. Every invitation link is built from `NEXT_PUBLIC_APP_URL` (`lib/invitations/share-links.ts`) — no code change needed to point the app at a Cloudflare tunnel or a production domain. The Invite Main Client form (`AgreementWorkspace.tsx`) collects Name / WhatsApp Number (required) / Email (optional); `project_invitations.invitee_name` is the one new column this sprint added. `InviteShareSheet.tsx` shows exactly two actions — Copy Invitation Link and Share on WhatsApp (a real `wa.me/<number>` deep link) — and never renders an invite code or raw URL. The Agreement page is now a status board (Agreement Uploaded / Main Client / Invitation Status / Agreement Status / Discussion Status / Current Version, plus a computed Waiting For / Next Action line) rather than a form-first page. A shared `useUploadAction` hook (`components/shared/`) gives every upload button — Agreement, Agreement revision, Import Workspace's per-category uploads — the same idle/uploading/success/error states and duplicate-submit protection. `/setup` and `/setup/review` now redirect back to `/agreement` (`requireAgreementAccepted()`) if the Agreement hasn't been accepted, closing a real gap where those pages had no guard of their own. All 6 auth-adjacent pages were rebuilt on a shared `AuthShell` using the app's real design tokens, replacing a hardcoded slate/cyan palette. `/firm` — previously rendered with no navigation shell at all, a genuine dead end — now has a layout matching every other page. A real account menu (`components/delta/AccountMenu.tsx`) replaced the TopBar's non-functional avatar button, with a real Sign Out.

Current Status:

Verified against the real, hosted Supabase project with zero regressions and zero bugs found in the main flow — the first sprint since 5.7 to run a full live verification with none surfaced. Two additional targeted live checks (a direct authenticated page request, not just the action layer) confirmed the `/setup` redirect guard and the `/firm` shell fix actually work, since the primary verification script called actions directly and couldn't exercise page-level redirects on its own. No real WhatsApp Business API integration exists — "Share on WhatsApp" opens a `wa.me` link in the user's own client, per the brief's own explicit scope boundary. No byte-level upload progress exists — every upload shows an honest indeterminate state. Profile and Account menu items are real, visible "Soon" stubs. See `Sprint-5.8-External-Access-and-Guided-Experience.md` for the full list of decisions and honestly-documented limitations.

---

## Guided Project Setup & Notification Center

✓ Guided Project Setup & Notification Center v1 (Sprint 5.9) — completes the onboarding journey from Agreement Approval to Project Activation. A real, persisted Notification Center (new `notifications` table, `lib/services/notification-service.ts`, `components/delta/NotificationBell.tsx`/`NotificationPanel.tsx`) replaces the decorative TopBar bell — 6 types (Agreement approved / Agreement discussion started / Agreement discussion replied / Invitation accepted / Team member joined / Waiting for your approval), every recipient resolved from real `project_team`/`projects.main_client_person_id` data via `lib/notifications/recipient-resolution.ts`, wired into the unmodified Event Engine via a rewritten `notifications-subscriber.ts` (previously a 23-line placeholder since Sprint 4.5). A new `DISCUSSION_REPLIED` event, published with `visibility: "internal"`, feeds the two Agreement-discussion notification types without appearing on the Timeline (its existing `visibility === "project"` filter excludes it automatically). One invitation engine, two branches (`lib/services/participant-engine-service.ts`, `components/participants/AddParticipantFlow.tsx`) replaces three previously separate, hand-rolled invite forms (Participants page, Agreement's Invite Main Client, Project Setup's direct Firm-member picker) — an existing Firm member gets instant internal assignment (no accept step), an external person gets the existing invite-and-accept flow, both decided by one shared component/service. Project Setup (`lib/services/project-setup-service.ts`, `components/project-setup/ProjectSetupChecklist.tsx`) now computes every checklist item live from real state (Lead Architect/Main Client/Consultants/Client Representatives/Client Questionnaire/Delta Review) — the manual "Mark Complete" button is gone everywhere — reordered into Design Team → Consultants → Client Representatives → Import Existing Project → Client Questionnaire → Delta Review, with progress ("X / 6 Complete") shown at the bottom. Role architecture correction (Module 6): `createFirm()`/`createProject()` now assign "Lead Architect" instead of the seeded "Owner" role (a database implementation detail, never a professional role); a one-time hosted-data migration moved every existing `firm_members`/`project_team` "Owner" row to "Lead Architect," and a new `toDisplayRoleName()` safety net guards every role-name render site. This closed a real, confirmed pre-existing bug: a project's own creator was previously excluded from the Delegation authority-holder list, since their row said "Owner," not "Lead Architect."

Current Status:

`tsc --noEmit`, `npm run lint`, and `npm run build` all pass clean; the dev server was restarted cleanly with zero errors; all 3 new migrations (`seed_architect_and_consultant_roles`, `migrate_owner_to_lead_architect`, `create_notifications`) were applied to the real, hosted Supabase project. **A real client-bundle-leak bug was found and fixed during this sprint's own build verification** — the same class of bug Sprint 5.4 first documented: the new Notifications subscriber was the first to need real (not mock/in-memory) persistence inside the subscriber chain, which is transitively reachable from a client bundle (`event-publisher.ts` → `revision-service.ts` → ... → the client hook `useDeltaPanel.ts`); fixed by giving `NotificationRepository` the service-role client (privacy enforced at the query layer, not RLS) and routing `recipient-resolution.ts` through an existing `"use server"` action instead of a raw repository class. No real-time push/websocket infrastructure exists anywhere in this codebase — the Notification Bell polls every 30 seconds, an honest limitation. "Agreement Discussion Started" notifies both parties unconditionally (cannot exclude the actual opener), a direct, unavoidable consequence of `DISCUSSION_CREATED`'s frozen `actor.id: null` limitation (documented and unfixed since Sprint 4.5), not a new gap. **Live two-browser verification (Lead Architect / Main Client) against the real hosted Supabase project was explicitly handed to the user this sprint**, per their own request, rather than the autonomous temp-route-handler-plus-cookie-replay technique every prior sprint (5.3–5.8) used — not yet performed as of this writing; test-data cleanup is pending that session. See `Sprint-5.9-Guided-Project-Setup-and-Notification-Center.md` for the full list of decisions and honestly-documented limitations.

---

## Project Evolution

✓ Evolution Strip (integrated into the Unified Workspace as Region B) — a distinct feature from the Sprint 4.6 Project Intelligence Timeline above; both have historically carried the word "Timeline" in code/labels, but this is the milestone-lineage rail (`ProjectEvolutionStrip`/`EvolutionDetailPanel`), not the Event-Log-driven page.

Current Status:

Present in every project, newest items first, still driven by static milestone data (`data/evolution.ts`). Wiring it to real evolution data is future work — untouched by Sprint 4.6, which built a separate, additive surface instead of reusing this one (different shape: milestone lineage/impact graph vs. flat chronological event stream).

---

## Attention

✓ Attention panel (Region D, between Journal and Delta)

Current Status:

Placeholder cards only, linking to the project overview. Real surfacing of items requiring action depends on the future Conversation Architecture / topic system.

---

## Assistant

✓ Delta Assistant Panel

Current Status:

Functional but requires UX refinement.

---

## Design System

✓ Atelier Design System

✓ Bronze Accent

✓ Dark Theme

✓ Light Theme

✓ Design Tokens

✓ Editorial Typography

---

# Planned Improvements

The following improvements have already been approved.

## Workspace

- Continuous workspace (implemented, Sprint 3.6A)
- Evolution Strip (implemented, Sprint 3.6A, static data)
- Workspace Header
- Project Journal redesign
- Delta Assistant redesign

## Branding

Replace all "AI" terminology with "Delta".

Examples:

AI Review → Delta Review

AI Summary → Delta Summary

Ask AI → Ask Delta

Generated by AI → Generated by Delta

---

# Known UX Issues

The following items are known and intentionally scheduled for future work.

- Sidebar items "Data" and "Knowledge Bank" have no dedicated destination yet (shown disabled, marked "Soon").
- Attention panel shows placeholder cards only; no real detection or Journal topic linking yet.
- Project Top Bar participants will be empty for every project until a UI exists to populate `project_team`.
- Project phase is not shown in the Top Bar — there is no `phase` column on `projects` yet.
- Discussion cards feel too generic.
- Assistant panel contains too much visual weight.
- Workspace header needs refinement.
- Sidebar navigation can be simplified.

---

# Completed Decisions

The following product decisions have already been finalized.

- Meetings are first-class evidence.
- Project Evolution is historical only.
- Future milestones are not displayed.
- Delta is knowledge-first.
- Delta is not a project management application.
- Delta Assistant supports the workspace instead of dominating it.

---

# Current Goal

The immediate objective is to refine the primary workspace into a premium architectural knowledge environment while preserving the existing knowledge workflow.

No major feature expansion is planned until the workspace refinement is complete.