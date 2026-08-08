# Sprint: Project Onboarding

Status: Complete
Sprint ID: 5.4
Target Version: v5.4
Owner: Delta engineering
Created: 2026-08-04
Last Updated: 2026-08-04

---

# Objective

Give a freshly created Project a guided, resumable Onboarding Wizard instead of dropping a new user straight into an empty Journal. Five steps — Project Details, Project Team, Initial Project Knowledge (documents), Client Questionnaire, and a deterministic Summary — connect the new project to the platform's existing intelligence (Knowledge Graph, Recommendation Engine, Event Engine, Timeline, Gateway, Delta) rather than adding a new one. This sprint establishes the flow only; it does not implement OCR, document parsing, drawing analysis, or BOQ intelligence.

---

# Background

Sprint 5.3 ended with `ProjectWizard.tsx` creating a real project and landing the user directly on the Journal — functional, but with no guided path from "project just created" to "project has enough real content for Delta to be useful." This sprint builds that path, reusing every piece of infrastructure Sprints 4.0–5.3 already built: the participant model (`team_types`/`roles`/`project_team`) for team assignment, the real Document upload architecture (`uploadDocumentFile`, Supabase Storage) plus the Sprint 5.2 Project Intelligence Gateway (`ingestSource`) for Initial Project Knowledge, the Knowledge Object service for turning questionnaire answers into real `Requirement`/`Risk` objects, the Event Engine/Timeline for progress history, the Recommendation Engine for gap detection, and the Delta query-resolver pattern for onboarding Q&A. Like Sprint 5.3, this sprint writes to real, Postgres-backed Supabase tables (not a mock in-memory repository), against the same live hosted project (`iymgueflxrplvbidinyw`).

---

# Scope

## In Scope

- **Module 1 (Project Details)**: a form step extending `projects` with `project_stage`, `gross_floor_area`, `target_completion_date`, `time_zone`.
- **Module 2 (Project Team)**: assign Firm members to project-specific roles (Lead Architect, Structural Engineer, MEP Engineer, Client Representative, and others), reusing the `team_types`/`roles`/`project_team` architecture with a new "Delivery Team" team type and additions to "Design Team".
- **Module 3 (Initial Project Knowledge)**: upload documents into 8 categories (Agreement, Drawings, Site Photos, Survey, Brief, BOQ, Specifications, Other), reusing the existing Document upload architecture and registering each upload with the Sprint 5.2 Gateway.
- **Module 4 (Client Questionnaire)**: 10 structured questions, each answer becoming a real Knowledge Object (`Requirement` or `Risk`) anchored to one shared onboarding Discussion.
- **Module 5 (Project Summary)**: a deterministic, template-composed draft summary (never an LLM call), editable before confirming.
- **Module 6 (Dashboard)**: onboarding progress (percentage + checklist) shown on the existing Project Dashboard with a "Continue Onboarding"/"Revisit Onboarding" CTA.
- **Module 7 (Timeline)**: five new Event types recording onboarding milestones.
- **Module 8 (Recommendations)**: gap-detection rules (missing core roles, missing key document types, incomplete questionnaire) surfaced through the existing Recommendation Engine.
- **Module 9 (Delta)**: four new onboarding-progress questions ("What's still missing?", "What documents should I upload?", "Who has not been assigned yet?", "What have we completed?"), alongside Sprint 5.3's original four.
- **Module 10 (Navigation)**: `ProjectWizard.tsx` now redirects to `/projects/[id]/onboarding` instead of the Journal after project creation.

## Out of Scope

OCR, document parsing/text extraction, drawing analysis, BOQ intelligence, permission management, billing/subscriptions, real email delivery — none of this sprint's document uploads are read for content; they only register with the Gateway and land honestly in `needs_review` where no capability exists yet (Brief/BOQ/Agreement/Specification/Site Photos/Survey/Other), exactly as Sprint 5.2 already documented.

---

# Files Expected to Change

New:
- `supabase/migrations/20260805100000_extend_projects_for_onboarding.sql`, `20260805101000_create_project_onboarding.sql`, `20260805102000_create_project_questionnaire_responses.sql`, `20260805103000_seed_onboarding_project_roles.sql`, `20260805104000_seed_onboarding_document_types.sql`, `20260805105000_add_onboarding_discussion_id.sql`
- `lib/types/onboarding.ts`
- `lib/repositories/onboarding-repository.ts`, `lib/repositories/questionnaire-repository.ts`
- `lib/services/onboarding-service.ts`
- `lib/onboarding/generate-summary.ts`, `lib/onboarding/onboarding-gaps.ts`
- `lib/actions/onboarding-actions.ts`
- `app/projects/[id]/onboarding/page.tsx`, `components/onboarding/OnboardingWizard.tsx`

Changed:
- `lib/onboarding/onboarding-query.ts` (four new question kinds, Sprint 5.3's four kept unchanged)
- `lib/repositories/firm-repository.ts` (`getProjectRoles()`)
- `lib/actions/project-actions.ts` (`listProjectTeam`, `assignProjectTeamMember`, `removeProjectTeamMember`)
- `lib/recommendations/recommendation-types.ts`, `lib/recommendations/recommendation-rules.ts` (five new onboarding-gap rules)
- `lib/events/event-types.ts`, `lib/events/timeline-projection.ts` (five new event types + summaries)
- `components/project-wizard/ProjectWizard.tsx` (redirect target)
- `app/projects/[id]/dashboard/page.tsx` (onboarding progress banner)

---

# Files That Must Not Change

Every file every prior sprint's own "must not change" list covers — no intelligence engine (Comprehension, Intelligence, Evidence, Reasoning, Recommendation *engine itself*, Revision, Drawing, Gateway) was modified beyond adding new rules/branches in their designated extension points. `HomeWorkspace.tsx` (the Journal) was not touched. `docs/architecture/002-authentication-and-authorization.md` was not touched.

---

# Constraints

- No OCR, document parsing, drawing analysis, or BOQ intelligence.
- No permission management, billing, subscriptions, or real email delivery.
- Reuse the Knowledge Graph, Relationship Engine, Event Engine, Timeline, Recommendation Engine, Drawing Intelligence, Revision Intelligence, Knowledge Capture, Validation, and Notification Foundation — do not duplicate any of them.
- Do not redesign the existing intelligence architecture.

---

# Implementation Notes (Architecture Decisions)

- **Module 2's 10 project roles reuse the existing `team_types`/`roles` architecture, extended rather than replaced.** They're distinct from Sprint 5.3's 7 Firm-membership roles, so rather than inventing a parallel system, "Design Team" gained Project Architect/Designer/Structural Engineer/Landscape Consultant/Interior Designer, and a new "Delivery Team" type seeds Quantity Surveyor/Contractor — consistent with "reuse the participant model."
- **Onboarding-gap logic (roles/documents/questionnaire) is a single shared helper, `lib/onboarding/onboarding-gaps.ts`**, consumed by both the Recommendation Engine's rules and Delta's Q&A — the sprint's own "Do NOT duplicate logic" requirement applied literally. An early draft had each rule and the Delta query separately computing gaps; refactored before either was finished.
- **Onboarding-gap Recommendations have no natural Knowledge Graph node** (no `"project"` `RelationshipNodeType` exists, and adding one to that frozen union was deliberately avoided, matching the "don't touch frozen types" precedent from Sprints 5.0–5.2). They self-deduplicate via a direct `getRecommendations({projectId, status:"open"})` check instead of the standard node-based dedup every other rule uses.
- **Module 4's Knowledge Objects need a `discussionId`** (an existing, unmodified constraint from the Knowledge Object architecture, the same one Sprint 5.0's Revision Intelligence hit). One shared Discussion is created per project onboarding the first time a questionnaire answer is saved; `project_onboarding.discussion_id` (added via a follow-up migration once this need was discovered mid-build) anchors it.
- **A real Next.js 16 breaking-change bug was found and fixed via live testing**: `app/projects/[id]/onboarding/page.tsx` calls the `"use server"` action `startOnboarding()` directly during its own Server Component render (a get-or-create call, needed so the wizard works even for a project onboarding for the first time). `startOnboarding()` originally called `revalidatePath()` after `getOrStart()` — but Next.js 16 disallows calling `revalidatePath` during render ("used ... during render... unsupported"), which live-tested as a 500 on every single visit to `/projects/[id]/onboarding`, the exact page `ProjectWizard.tsx` redirects to immediately after creating a project. Fixed by removing the `revalidatePath` call from `startOnboarding()` — a page that is already mid-render has nothing to revalidate; `revalidatePath` remains on every other mutation in `onboarding-actions.ts` that's actually invoked from client interaction (team assignment, document upload, questionnaire answers, summary, finish), where it's needed and legal.
- **A second real bug, more serious, was found in the same live-testing pass**: `lib/onboarding/onboarding-gaps.ts` and `lib/onboarding/onboarding-query.ts` originally imported `OnboardingService` (a plain class, not a `"use server"` action) directly — and `onboarding-query.ts` feeds into `delta-query-resolver.ts`, which the *client* hook `useDeltaPanel.ts` imports. `OnboardingService` uses `OnboardingRepository`/`QuestionnaireRepository`, which call `createServerSupabaseClient()` (`supabase/server.ts`, which imports `next/headers` — server-only). The result: `next/headers` got pulled into the client bundle, and **the existing Journal page (`/projects/[id]`) started 500ing entirely** — a real regression to unrelated, pre-existing functionality, caught immediately by the dev server's own error trace after the first clean restart. Sibling Delta query files (`drawing-query.ts`, `revision-query.ts`) never hit this because those domains use mock in-memory repositories with no server-only imports; onboarding is the first Delta-integrated domain that is Supabase-backed. Fixed by routing both files through the already-existing `"use server"` action `getOnboardingProgress()` (from `onboarding-actions.ts`) instead of calling `OnboardingService.getProgress()` directly — Next.js treats a `"use server"` export as an RPC stub when imported into client-reachable code, not a full module inclusion. Reverified: Journal returned to 200, `tsc`/lint/build all still pass, and `OnboardingService`/the two repositories are now only reachable from `onboarding-actions.ts` itself (confirmed via a repo-wide grep).
- **Team Step does not require an assignment to proceed** — `completeTeamStep()` advances `current_step` regardless of whether any `project_team` rows exist yet, verified live by deliberately completing onboarding with zero team members assigned, which correctly left `invite_missing_consultants` as an open Recommendation afterward. Onboarding "100% complete" (the wizard was walked through) and "project has no gaps" (Recommendations) are two different, correctly independent signals — verified live that both can be true simultaneously in the expected way (habitually finishing onboarding does not silently dismiss open gap recommendations).
- **One orphaned test-upload file likely remains in the shared `documents` Storage bucket.** The temporary cleanup route's first pass queried `documents` rows by `project_id` to resolve `storage_path` before deleting, but that query returned zero rows for the one project a real file had been uploaded to — by the time this was noticed, the underlying `projects` row (and its `documents` row, via `ON DELETE CASCADE`) had already been deleted, so the exact `storage_path` could no longer be resolved. The blob is a small, non-sensitive test text file ("Sample client brief content for smoke testing.") with a random-UUID filename, unreferenced by any remaining DB row — a minor, honestly-documented residual artifact, not a data-integrity or security issue.

---

# Acceptance Criteria

- [x] A freshly created project routes to the Onboarding Wizard, not the Journal.
- [x] Each of the 5 onboarding steps persists real data and is resumable (`project_onboarding.current_step` plus per-step timestamps).
- [x] Project Team assignment reuses the Firm-member/role model (verified live — real `project_team` rows via `assignProjectTeamMember`).
- [x] Document uploads reuse the existing upload architecture and register with the Gateway (verified live — real `documents` row + `source.received`/`source.classified`/`source.needs_review` events).
- [x] Questionnaire answers become real Knowledge Objects (verified live — 4 answered questions produced 4 real `Requirement`/`Risk` objects, linked back via `knowledge_object_id`).
- [x] The Summary step composes a real, deterministic draft from actually-collected data (verified live, no LLM call).
- [x] Dashboard shows onboarding progress and a Continue/Revisit CTA.
- [x] Timeline records all 5 new onboarding event types with humanized, actor-named summaries.
- [x] Recommendations fire for genuine onboarding gaps and self-deduplicate.
- [x] Delta answers all 4 new onboarding questions plus Sprint 5.3's original 4.
- [x] Existing Journal, Timeline, Dashboard, and intelligence engines have no regressions (two real regressions were found and fixed during this sprint's own verification — see Implementation Notes).

---

# Validation

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`) — confirms `/projects/[id]/onboarding` appears in the route manifest and no temporary smoke-test routes remain.
- [x] Restarted the development server cleanly multiple times during this sprint (after the initial client-bundle regression was found, after both fixes, and once more for final verification) — the final restart compiled with zero errors.
- [x] **Full end-to-end verification against the real, hosted Supabase project**, using the same temporary-Route-Handler-plus-Admin-API technique Sprint 5.3 established: registered real users, created real firms/projects, and ran the complete onboarding flow (details → team → documents → questionnaire → summary → finish) through the real service/action layer four separate times (once as the main flow test, three more to confirm the cold-page-load fix was not a fluke). Confirmed: onboarding progress moved 0% → 40% → 100% correctly; 5 onboarding-gap Recommendations appeared while incomplete (`invite_missing_consultants`, `upload_missing_agreement`, `upload_missing_boq`, `upload_missing_drawings`, `complete_questionnaire`) and did not duplicate across repeated checkpoint events; one real document upload produced a real `documents` row and correctly landed in `needs_review` via the Gateway (no capability registered for a Brief); 4 questionnaire answers produced 4 real Knowledge Objects (3 Requirements, 1 Risk), each linked back via `knowledge_object_id`; the Timeline showed all 13 expected events with correctly humanized, actor-named summaries (not raw UUIDs); all 4 new Delta onboarding questions returned real, evidence-backed answers; the existing Journal (`/projects/[id]`), Dashboard, and Timeline pages all returned 200 for an authenticated user throughout. **All test data (4 auth users, 4 people, 4 firms, 4 projects, and their associated `project_onboarding`/`project_questionnaire_responses`/`documents` rows) was deleted from the hosted project after verification** — a full listing confirmed zero remaining rows matching the test naming pattern, except one orphaned Storage blob (see Implementation Notes).
- [x] Found and fixed two real regressions during this live verification that would not have surfaced from code review alone: the Next.js 16 `revalidatePath`-during-render 500 on the onboarding page itself, and the client-bundle `next/headers` leak that broke the existing Journal page. Both fixed and reverified live before this sprint was considered complete.

---

# Completion Notes

Completed work: see Files Expected to Change above — a freshly created project now goes through a real, resumable 5-step Onboarding Wizard connecting Project Details, Team, Documents, Questionnaire, and Summary into the existing Knowledge Graph, Event Engine, Recommendation Engine, and Delta — verified against the real hosted database, not simulated.

Known issues:

- One orphaned test-upload blob likely remains in the shared `documents` Storage bucket — small, non-sensitive test content, unreferenced by any database row (see Implementation Notes).
- Document uploads during onboarding are registered with the Gateway but never read for content — every category except a plain drawing lands in `needs_review`, honestly, since no Document/BOQ/Agreement Intelligence capability exists yet (explicitly out of scope this sprint, per Sprint 5.2's own registration model).
- The Team step does not require any assignment to advance — a project can finish onboarding with zero team members, which is correct per this sprint's brief (team completeness is a Recommendation concern, not a step-gating one), but worth knowing if a future sprint wants to make specific roles mandatory.
- No permission enforcement exists — any signed-in Firm member with access to a project can complete or revisit its onboarding.
- No real email delivery, no OCR, no document parsing, no drawing analysis, no BOQ intelligence — all explicitly out of scope, matching Sprint 5.2/5.3's own exclusions.

Follow-up work:

- Document Intelligence / BOQ Intelligence / OCR, whenever those become their own sprints, will let onboarding document uploads move out of `needs_review` and into real extracted content — no changes to this sprint's upload flow should be needed, only new Gateway capabilities.
- Resolving the one orphaned Storage blob, if a future sprint wants a Storage-bucket audit tool (not worth building for a single known test artifact).
- Reconsidering whether any of the 4 `CORE_PROJECT_ROLES` should be mandatory before a project can exit onboarding, once real usage shows whether the advisory Recommendation is sufficient.

Modified files: see Files Expected to Change above.
