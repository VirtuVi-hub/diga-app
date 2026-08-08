# Sprint: Governance Engine & Project Setup Workflow

Status: Complete
Sprint ID: 5.7
Target Version: v5.7
Owner: Delta engineering
Created: 2026-08-05
Last Updated: 2026-08-06

---

# Objective

Not another approval system. A single Governance Engine every future workflow in Delta reuses — Agreements, Requirements, Decisions, Drawings, BOQs, Specifications, Reports, Revisions, and (later) Meetings/RFIs/Site Instructions all resolve "who must approve, who must be notified, and why" from one place. Replaces the one-time Onboarding Wizard (Sprint 5.4) with the real operational lifecycle of an architectural project: Create Project → Upload Agreement → Invite Main Client → Agreement Review → Agreement Accepted → Project Setup → Delta Project Review → Project Activation. The collaborative workspace (Dashboard/Journal/Timeline/Knowledge/Recommendations) only unlocks once a project reaches `active`.

---

# Background

This sprint began in a prior session that ended mid-implementation when its API connection failed while reading project context — no `PROJECT_CONTEXT` handover was written, so the next session (this one) was initially instructed to start from scratch. Before writing any code, a full audit found that session had, in fact, produced a substantial, coherent, and mostly working implementation: ~1,095 lines across 39 new/changed files plus 8 Supabase migrations, all already applied to the real hosted project, with `tsc`/`lint`/`build` passing clean. Rather than discard and redo that work — which this codebase's own discipline treats as unfamiliar in-progress state to investigate, not overwrite — this sprint continued from it: closing gaps, running the first live end-to-end verification against the real hosted Supabase project, fixing three real bugs that verification surfaced, and writing this document.

---

# Projection-First Architecture (confirmed)

- **Governance Roster** (`lib/governance/governance-roster.ts`'s `computeGovernanceRoster()`) — a pure function recomputed fresh on every read from (creator, object type, Impact Analysis, `governance_rules`, `delegations`, project team, Main Client). Modeled directly on `computeApprovalRoster()` (Sprint 4.9). No stored workflow state, no cache — a Delegation created a second ago is reflected the very next call.
- **Impact Engine** (`lib/impact-engine/impact-engine.ts`) — extracted verbatim (not rewritten) from two call sites that were independently duplicating the same `evidenceEngine.collect()` shape: `KnowledgeValidationEngine`'s inline impact lookup and Revision Intelligence's `RelationshipImpactAnalyzer`. Both callers now delegate here; neither's output changed by even one value.
- **Agreement Review state** — has no dedicated status table. Whether the Agreement is accepted is read live from `document_revisions` (the real current revision) plus `agreement.accepted.v1` events in the Event Log — the same "pure aggregation, no new store" precedent `computeApprovalRoster()` established.
- **Document Revision comparison** (`lib/document-revision-intelligence/`) — a pure, no-I/O metadata diff (`compareRevisionMetadata()`) between two real `document_revisions` rows, plus a document-type-keyed analyzer. No new storage; reads through the existing `documents`/`document_revisions` schema only.
- **Project Setup** (`project_setup` table) — records only which step to resume at and when each was confirmed done, exactly the "resumable progress marker, not a data store" discipline `project_onboarding` (Sprint 5.4) established. Every step's real data lands in its own real table (`project_team`, `documents`, `project_questionnaire_responses`, real Knowledge Objects) via the existing actions, never a parallel copy.
- **Project Setup Gaps** (`lib/project-setup/setup-gaps.ts`) — computed live every time from real `project_team`/`documents`/`project_setup` reads, direct successor to `lib/onboarding/onboarding-gaps.ts` (deleted this sprint along with the rest of the Onboarding module).

No new intelligence engine was introduced. No UI component holds business state beyond ephemeral form state.

---

# Scope

## In Scope (18 modules, per the brief)

1. **Agreement First Workflow** — mandatory upload, no "Skip Agreement," Accept / Open Discussion / Request Revision (deliberately no Reject).
2. **Agreement Discussions** — clause-attached (`Discussion.clauseRef`), persist across versions.
3. **Universal Document Revision Intelligence** — a generic comparator (any versioned document) plus document-type-specific analyzers; Agreement is the one real analyzer this sprint (clause Discussions since the previous version), everything else honestly states content-level comparison isn't available yet. Drawing revisions continue to use the unmodified, drawing-specific Sprint 5.0 `RevisionEngine` — not replaced or duplicated.
4. **Discussion Before Approval** — demonstrated concretely throughout the Agreement workflow (clause Discussions resolve without requiring a version change; a Request Revision always routes through discussion, never a rejection).
5. **Project Membership** — a new `project_invitations`/membership model, separate from Firm membership; a person may belong to many projects.
6. **Invitations** — WhatsApp / Copy Link / SMS / Email share links (`lib/invitations/share-links.ts`), registration-after-invitation via `/invite/[code]`.
7. **Project Participants** — all named categories seeded as real `roles` rows (Main Client, Junior Architect, Intern, Landscape Architect, Fire Consultant, Lighting Consultant, PMC, Site Engineer, Supervisor, Vendor — the rest already existed from Sprints 5.3–5.4).
8. **Authority & Delegation** — `delegations` table, two-step confirm-before-delegate UI, permanent record (rows are never deleted, only `status: "revoked"`).
9. **Main Client** — exactly one per project (`projects.main_client_person_id`), decision authority by default; Client Representatives do not automatically inherit it.
10. **Governance Responsibilities** — Creator / Required Approvers / Mandatory Notifications / Watchers (foundation only, always empty this sprint) — never "Optional Approver."
11. **Automatic Governance** — `governance_rules` (seeded, role-name-keyed, `always` vs `on_impact` triggers) + the Impact Engine; users never pick approvers manually.
12. **Project Setup** — Invite Team / Consultants / Client Representatives, Import (links to the existing Sprint 5.6 workspace), Questionnaire, Review — honest progress, no fabricated percentages.
13. **Client Questionnaire** — 12 questions across Requirement/Constraint/Preference/Risk, completed by the Main Client, becomes real (pending) Knowledge Objects.
14. **Delta Project Review** — Project Understanding / Imported Documents / Requirements-Constraints-Preferences-Risks / Missing Information / Outstanding Discussions, a deterministic never-LLM narrative; explicitly not project approval.
15. **Project Activation** — unlocks Dashboard/Journal/Timeline/Knowledge/Recommendations/Delta only once `lifecycle_stage === "active"`.
16. **Events** — 10 new event types, all through the unmodified Event Engine.
17. **Timeline** — zero new storage; governance activity appears via existing `SUMMARY_BUILDERS`-style humanization.
18. **Delta Questions** — 7 new governance-shaped questions, wired into `delta-query-resolver.ts`.

## Out of Scope

Real permission/authorization enforcement (role assignment only, same boundary Sprint 5.3 drew), real email/SMS delivery, a background job/queue system, Watchers (field exists, never populated), content-level text comparison for BOQ/Specification/Report/Meeting Minutes revisions (metadata-only, honestly labeled), and any generalized "workflow engine" beyond what the Agreement flow concretely demonstrates.

---

# Files Expected to Change

New:
- `lib/governance/` — `governance-types.ts`, `authority.ts`, `governance-roster.ts`, `governance-rules-repository.ts`, `activation-gate.ts`, `governance-query.ts`
- `lib/impact-engine/impact-engine.ts`
- `lib/document-revision-intelligence/` — `types.ts`, `document-revision-comparator.ts`, `document-change-analyzers.ts`
- `lib/services/` — `agreement-service.ts`, `agreement-review-service.ts`, `delegation-service.ts`, `project-setup-service.ts`, `project-invitation-service.ts`, `document-revision-intelligence-service.ts`
- `lib/repositories/` — `delegation-repository.ts`, `project-governance-repository.ts`, `project-invitation-repository.ts`, `project-setup-repository.ts`
- `lib/actions/` — `agreement-actions.ts`, `delegation-actions.ts`, `document-revision-actions.ts`, `governance-actions.ts`, `project-invitation-actions.ts`, `project-setup-actions.ts`
- `lib/types/` — `delegation.ts`, `project-invitation.ts`, `project-setup.ts`
- `lib/project-setup/setup-gaps.ts`, `lib/invitations/share-links.ts`
- `components/governance/` — `DelegationModal.tsx`, `DelegationPanel.tsx`
- `components/agreement/AgreementWorkspace.tsx`
- `components/project-setup/` — `ProjectSetupChecklist.tsx`, `DeltaProjectReviewPanel.tsx`
- `components/invitations/` — `InviteShareSheet.tsx`, `AcceptInvitationButton.tsx`
- `components/participants/ParticipantsClient.tsx`
- `app/projects/[id]/agreement/page.tsx`, `app/projects/[id]/setup/page.tsx`, `app/projects/[id]/setup/review/page.tsx`, `app/projects/[id]/participants/page.tsx`, `app/invite/[code]/page.tsx`
- 8 migrations: `extend_projects_for_governance`, `extend_project_team_for_membership`, `create_project_invitations`, `create_delegations`, `create_project_setup`, `create_governance_rules`, `seed_governance_participant_roles`, `seed_governance_rules`

Changed:
- `lib/events/event-types.ts` (10 new governance event types)
- `lib/intelligence-engine/delta-query-resolver.ts` (Module 18 branch, checked after the Sprint 5.6 import branch)
- `components/project-shell/AppSidebar.tsx` / `ProjectIdentityContext.tsx` (pre-Active nav points at Agreement/Setup instead of Dashboard/Journal/Timeline/Knowledge)
- `app/projects/[id]/dashboard/page.tsx`, `.../[id]/page.tsx` (Journal), `.../[id]/timeline/page.tsx`, `.../[id]/knowledge/[objectId]/page.tsx` — each now calls `requireActiveProject()` first
- `lib/actions/project-actions.ts` (`createProjectFromWizard()` now inserts `lifecycle_stage: "draft"`; `getProjectLifecycleStage()`/`getProjectMainClient()`/`listProjectMembership()`/`removeProjectMember()` added)
- `components/project-wizard/ProjectWizard.tsx` (routes to `/agreement` instead of the deleted onboarding route)
- `proxy.ts` (see bug fixes below)
- **Deleted**: `lib/onboarding/` and `app/projects/[id]/onboarding/` (superseded by Project Setup)

---

# Files That Must Not Change

Every frozen intelligence engine (Comprehension, Intelligence, Evidence, Reasoning, Drawing Intelligence, Revision Intelligence's own drawing-specific comparator, Project Intelligence Gateway's capability set, Recommendation Engine's rule-evaluation core, Event Engine, Timeline projection's core `categorize()`). None were redesigned. `lib/revision-intelligence/` (Sprint 5.0, drawing-specific) is untouched — Module 3's "reuse the existing Drawing Revision Intelligence" is satisfied by leaving it alone, not merging it into the new generic comparator.

---

# Constraints

- One Governance Engine, reused by every object type — confirmed no per-type approval logic exists (`governance_rules` is one table, keyed by `object_type` as an open string, the same "open string, not an enum-per-variant" convention `Event.eventType`/`Recommendation.recommendationType` already use).
- Projection-first: no new intelligence engine, no UI-owned business state.
- Prefer refactoring over rewriting — the Impact Engine extraction preserves both original call sites' exact behavior.

---

# Implementation Notes (Architecture Decisions)

- **A real bug in `ProjectInvitationService.acceptByCode()`** — its `project_team` upsert `.select(..., people(...), ...)` failed with "more than one relationship was found," since this sprint's own `extend_project_team_for_membership` migration added a second FK into `people` (`invited_by`, alongside the pre-existing `person_id`) — the exact same ambiguous-embedding bug class Sprint 5.3 hit once already with `firm_members`. Fixed with the same `people!person_id(...)` column-hint syntax.
- **A real regression to pre-existing functionality, caused by that same migration**: every other `project_team` → `people` join in the codebase (`listProjectTeam()`, `listProjectMembership()`, `getProjectDashboard()`'s team query, and `app/projects/[id]/layout.tsx`'s Top Bar participant loader) became ambiguous the instant `invited_by` was added, even though none of those call sites are new this sprint. Caught only by live verification — Dashboard team display, Journal Top Bar avatars, and the Participants page would all have silently 500'd. Fixed with the same column-hint at all four sites.
- **A real bug in `proxy.ts`**: `/invite/[code]` was never added to `PUBLIC_PATH_PREFIXES`, so an unauthenticated visitor following a real invitation link was redirected straight to `/auth` before ever reaching the landing page — making `InvitePage`'s own signed-out branch (Sign In / Register links, explicitly built for Module 6's "registration happens after invitation") permanently unreachable. Fixed by adding `/invite` to the public-path list.
- **A real bug in `delta-query-resolver.ts` branch ordering**: "What changed in this agreement?" was silently hijacked by Sprint 5.0's `detectRevisionQuestion()` (its bare `/what.*changed/` pattern, checked earlier in the resolver) before the new Module 18 governance branch ever ran — the same precedented bug class Sprint 5.5 already found once for "What changed since yesterday?" and fixed with a narrow exclusion rather than reordering branches. Fixed the same way: an `AGREEMENT_QUALIFIER` exclusion (`agreement`/`clause`) in `revision-query.ts`'s `detectRevisionQuestion()`.
- **A real gap in `governance-query.ts`'s `answerObjectGovernanceQuestion()`**: "Who still needs to approve?", "Why is this waiting?", and "Who has been notified?" — 3 of Module 18's 7 example questions — only worked when a `knowledgeObjectId` was already resolvable from context, which is never true when asking about the Agreement itself (the Agreement Review page has no `knowledgeObjectId`/`discussionId` of its own). Fixed by falling back to `getAgreementReviewContext()`'s own roster (the exact same call the Agreement page itself makes) whenever no Knowledge Object resolves — not a second roster computation, and still an honest empty result when neither exists.
- **`ProjectGovernanceRepository` is deliberately narrow**, not a general `ProjectRepository` — this codebase has never had one (simple `projects` queries have always lived inline in `project-actions.ts`); scoping it to just the governance columns (`lifecycle_stage`, `main_client_person_id`) matches that precedent rather than introducing a new abstraction layer.
- **`requireActiveProject()` is per-page, not layout-based** — this Next.js version's Server Components have no `usePathname`-equivalent server-side segment access, so the gate is called as the first line of every gated page (Dashboard, Journal, Timeline, Knowledge), the same pattern `canViewProjectInfo()` already uses. Agreement/Setup/Participants/Import/Contract Package remain reachable pre-Active, since the Lead Architect needs them to walk the lifecycle.
- **`DocumentRevisionEngine` is named to mirror `RevisionEngine.process()` but is a genuinely separate module**, not a shared interface forced onto structurally different inputs (real `document_revisions` rows vs. Drawing Intelligence's mock diff dictionary) — a naming convention, not a forced abstraction.

---

# Acceptance Criteria

- [x] A new project starts at `lifecycle_stage: "draft"` and routes to `/agreement`, not the (now-deleted) Onboarding Wizard.
- [x] Agreement upload is mandatory; no skip path exists.
- [x] Agreement Review offers Accept / Open Discussion / Request Revision — no Reject action exists anywhere in the codebase.
- [x] Clause Discussions attach to a manually entered clause reference and persist across Agreement versions.
- [x] Uploading a new Agreement version produces a real metadata diff plus clause-Discussion-derived "what changed" narrative.
- [x] The Main Client — and only the Main Client, or their active delegate — can Accept the Agreement.
- [x] Project Setup guides Team / Consultants / Client Representatives / Import / Questionnaire / Review with honest, non-fabricated progress.
- [x] The Client Questionnaire produces real, pending Requirement/Constraint/Preference/Risk Knowledge Objects.
- [x] Delta Project Review composes a real, deterministic Project Understanding narrative and is not itself an approval step.
- [x] Project Activation is blocked until Delta Project Review is confirmed, and unlocks Dashboard/Journal/Timeline/Knowledge/Recommendations immediately after.
- [x] Governance Rosters are always computed automatically (creator/object type/impact/rules/delegations) — no UI ever asks a user to pick an approver.
- [x] Delegation requires a reason, shows a confirmation of implications before committing, and is permanently recorded (never deleted, only revoked).
- [x] All 7 Module 18 Delta governance questions return real, evidence-backed answers when a Governance-relevant item is in scope.
- [x] Existing Registration, Firm Management, Dashboard, Journal, Timeline, Knowledge, Recommendations, Import Workspace, Revision Intelligence, and Drawing Intelligence all have no regressions.

---

# Validation

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`) — confirms `/projects/[id]/agreement`, `/setup`, `/setup/review`, `/participants`, `/invite/[code]` all appear in the route manifest, and no temporary smoke-test routes remain.
- [x] Restarted the development server cleanly for final verification — zero errors.
- [x] **Full end-to-end verification against the real, hosted Supabase project**, using a temporary Route Handler (`app/api/smoke-5-7/route.ts`, added and fully removed within this session, along with its one-line `proxy.ts` allowance) that called the real `"use server"` actions directly under genuine authenticated request context — real Supabase sessions obtained via `signInWithPassword`, cookies captured and replayed exactly as a browser would. Two real users (a Lead Architect and a Main Client) were created via the Admin API (bypassing the hosted project's email-confirmation requirement for testing only, same precedent as Sprint 5.3), and the complete lifecycle was walked live: Firm created → Project created (`draft`) → Agreement uploaded → Main Client invited → invitation landing page viewed pre-auth → invitation accepted (`agreement_review`) → clause Discussion opened and resolved without a version change → Request Revision → Agreement v2 uploaded → Document Revision comparison correctly showed `changed: true` with the clause Discussion surfaced → Agreement Accepted (`agreement_accepted`) → Project Setup walked (Team/Consultants/Client Reps/Import steps, Questionnaire producing 3 real Knowledge Objects: 1 requirement, 1 constraint, 1 preference) → Delta Project Review confirmed → Project Activated (`active`). Delegation was independently verified (Main Client delegates Agreement-acceptance authority to the Lead Architect; the Governance Roster correctly showed the delegate with `delegatedFrom`; revoked cleanly). All 7 Delta governance questions were verified to return real, correct answers after the two bugs above were fixed. Regression-checked live: Dashboard (`getMissionControlData` returned correct health metrics), Timeline (23 correctly humanized entries), Knowledge (3 real objects from the questionnaire), Recommendations (10 real, correctly typed), Drawing Intelligence (8 seeded drawings, unaffected), Revision Intelligence (0 drawing revisions, unaffected), Import Workspace (9 categories), Discussions (unaffected), and 3 pre-existing Delta question types (attention/recent-changes/drawings) — all correct, all zero-regression. **All test data — 2 auth users, 2 people, 1 Firm, 1 Project (cascading `project_team`/`project_setup`/`project_invitations`/`delegations`/`documents`), and every orphaned Storage blob created during verification (including one leftover project from an earlier run that crashed on the pre-fix ambiguous-embedding bug before reaching its own cleanup step) — was deleted from the hosted project afterward**, verified via a final Storage listing showing only pre-existing files from before this session.

---

# Completion Notes

Completed work: see Files Expected to Change above — Delta now manages a project's real beginning (Agreement first, discussion before approval, automatic governance, delegated authority, universal document revision awareness, activation only after proper setup), replacing the one-time Onboarding Wizard with a lifecycle every future workflow can build on without inventing a second approval system.

Known limitations (honestly disclosed, not fabricated away):

- Content-level revision comparison exists only for Agreements (via clause Discussions) — BOQ, Specification, Report, and Meeting Minutes revisions show metadata only (uploader, timestamp, whether the file changed), honestly labeled, per the sprint's own locked scope decision (no PDF/DOCX text-extraction pipeline exists anywhere in this codebase).
- Watchers (Module 10) is a real field on `GovernanceRoster`, always empty this sprint — foundation only, so nothing architecturally blocks the feature later.
- No permission/authorization enforcement exists — Delegation changes who a Governance Roster resolves to, but nothing prevents an arbitrary signed-in user from calling an action directly (the same pre-existing boundary every prior sprint has drawn: role assignment only, not an authorization engine).
- No real email/SMS delivery — invitations produce a shareable code/link only (WhatsApp/Copy Link/SMS/Email are all client-constructed deep links), matching Firm invitations' existing scope.
- Recommendations still never auto-resolve when their underlying gap is filled — a pre-existing Sprint 4.8 decision, unchanged by this sprint.
- One pre-existing class of bug (PostgREST ambiguous embedding whenever a table gains a second FK into `people`) has now been hit and fixed three separate times across three sprints (`firm_members` in 5.3, `project_team` in 5.7). A future sprint should consider whether every `people` join in this codebase ought to be hinted defensively rather than fixed reactively each time a new FK is added.

Future extension points:

- Watchers can be populated without a schema change once a concrete "who watches without approving" use case is scoped.
- A real content-diffing pipeline (once one exists anywhere in this codebase) would let `DOCUMENT_CHANGE_ANALYZERS` grow beyond Agreement with zero changes to `document-revision-intelligence-service.ts`'s own dispatch logic.
- `governance_rules` is already a real, seedable table — a future Firm-level settings UI could let a Lead Architect customize required approvers per object type without any code change.

Modified files: see Files Expected to Change above.
