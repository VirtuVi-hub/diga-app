# Sprint: Project Dashboard / Mission Control

Status: Complete
Sprint ID: 5.5
Target Version: v5.5
Owner: Delta engineering
Created: 2026-08-04
Last Updated: 2026-08-04

---

# Objective

Not a new intelligence capability. Bring together everything Sprints 4.0–5.4 already built into one coherent Project Dashboard ("Mission Control") that becomes the primary landing page after entering a project — so a user immediately understands what happened, what needs attention, what is missing, what changed, and what should happen next, without visiting five separate pages first.

---

# Background

Sprint 5.3 built a lightweight Project Dashboard (`getProjectDashboard`, stat cards, a short activity/recommendation preview) as a foundation, and Sprint 5.4 added an onboarding-progress banner to it. Everything else this sprint needed already existed and was already real: the Recommendation Engine (4.8), the Event Log/Timeline Projection (4.5/4.6), Knowledge Validation's `ValidationState` (4.7), the Knowledge Graph's `Relationship` model (4.0), Drawing/Revision Intelligence (5.0/5.1), the Project Intelligence Gateway's `Source`/`needs_review` model (5.2), and Project Onboarding's gap-detection (5.4). This sprint's entire job was composition and honest aggregation, not construction.

---

# Scope

## In Scope

- **Module 1 (Mission Control Layout)**: rebuilds `/projects/[id]/dashboard` as a full composed page — header, Delta briefing, Project Health, Attention Center, Project Snapshot, Recent Activity, Recommendations, Upcoming, Quick Actions, Recent Documents — keeping Sprint 5.4's onboarding-progress banner immediately below the header.
- **Module 2 (Delta Daily Briefing)**: a deterministic, template-composed "since last visit"-style summary.
- **Module 3 (Project Health)**: 8 real, derived metrics; "Not Available" instead of a fabricated number where one can't be honestly computed.
- **Module 4 (Attention Center)**: a single, deduplicated, urgency-sorted aggregation of pending approvals, Gateway review requests, open Recommendations, onboarding gaps, and newly detected revisions.
- **Module 5 (Project Snapshot)**: plain totals — Requirements/Decisions/Issues/Actions/Risks/Drawings/Documents/Discussions/Timeline Events/Participants.
- **Module 6 (Recent Activity)**: reuses `TimelineEntryCard` directly.
- **Module 7 (Recommendations Panel)**: reuses `RecommendationPanel` directly, unmodified.
- **Module 8 (Upcoming)**: a foundation panel with honest empty states where no real data model exists yet.
- **Module 9 (Quick Actions)**: shortcuts into existing workflows.
- **Module 10 (Recent Documents)**: the newest uploaded documents.
- **Module 11 (Navigation)**: `/projects` now links into the Dashboard, not the Journal — the Dashboard becomes the project's landing page.
- **Module 12 (Dashboard Questions)**: Delta answers "What needs my attention?", "How healthy is this project?", and "What approvals are pending?" from the same Mission Control data the page renders.

## Out of Scope

Any new intelligence engine, any new storage/persistence, redesigning or replacing an existing engine, real meeting scheduling, real per-project milestone data, permission management, billing, or real email delivery.

---

# Files Expected to Change

New:
- `lib/types/dashboard.ts`, `lib/dashboard/mission-control-types.ts`, `lib/dashboard/project-health.ts`, `lib/dashboard/attention-center.ts`, `lib/dashboard/generate-briefing.ts`, `lib/dashboard/dashboard-query.ts`
- `lib/actions/dashboard-actions.ts`
- `components/dashboard/DeltaBriefing.tsx`, `ProjectHealthGrid.tsx`, `AttentionCenterPanel.tsx`, `ProjectSnapshotGrid.tsx`, `RecentActivityFeed.tsx`, `UpcomingPanel.tsx`, `QuickActionsGrid.tsx`, `RecentDocumentsPanel.tsx`

Changed:
- `app/projects/[id]/dashboard/page.tsx` (rewritten — full Mission Control composition, replacing Sprint 5.3/5.4's lightweight version)
- `app/projects/page.tsx` (project card links now point to `/projects/${id}/dashboard`, not `/projects/${id}`)
- `lib/intelligence-engine/delta-query-resolver.ts` (one new branch, Module 12)
- `lib/revision-intelligence/revision-query.ts` (one narrow bugfix — see Implementation Notes)

---

# Files That Must Not Change

Every frozen intelligence engine (Comprehension, Intelligence, Evidence, Reasoning, Recommendation Engine's own rules, Knowledge Validation Engine, Revision Engine, Drawing Intelligence Engine, Gateway) — none were redesigned. `HomeWorkspace.tsx` (the Journal) was not touched; its own URL (`/projects/[id]`) is unchanged. `RecommendationPanel.tsx`/`TimelineEntryCard.tsx` were reused exactly as they already existed, not modified.

---

# Constraints

- Reuse the Knowledge Graph, Relationship Engine, Timeline, Recommendation Engine, Validation, Event Engine, Notification Foundation, Drawing Intelligence, Revision Intelligence, Project Onboarding — do not duplicate any of them.
- Do not introduce new intelligence engines or new storage.
- The Dashboard is projection-based — everything recomputes live on each page load.

---

# Implementation Notes (Architecture Decisions)

- **One aggregator, `getMissionControlData()` (`lib/actions/dashboard-actions.ts`), is the single fetch both the page AND Delta's dashboard questions call** — satisfying "Do NOT duplicate data" literally. The pure computation functions (`computeProjectHealth`, `computeAttentionCenter`, `generateDashboardBriefing`) take an already-fetched `MissionControlRawData` bundle and never fetch anything themselves, matching the existing `TimelineProjection`/`GatewayDashboard` "pure projection" precedent.
- **A real client-bundle regression class from Sprint 5.4 was deliberately avoided from the start, not fixed after the fact this time.** `lib/dashboard/dashboard-query.ts` is reachable from the client hook `useDeltaPanel.ts` (via `delta-query-resolver.ts`), so it never imports `dashboard-actions.ts`'s Supabase-touching internals directly — it only calls the exported `"use server"` function `getMissionControlData()`, which Next.js treats as an RPC stub when referenced from client-reachable code. This is the exact lesson Sprint 5.4 learned the hard way (breaking the Journal page); applying it proactively here meant zero regressions were found in this sprint's `npm run build` (no `next/headers`-in-client-bundle warnings at all, unlike Sprint 5.4's first build).
- **Two real bugs were found via this sprint's own live testing, both in the Delta integration layer, not the new Dashboard code itself:**
  1. Sprint 5.0's `detectRevisionQuestion()` matches bare "what changed" and is checked earlier in `delta-query-resolver.ts` than Sprint 4.6's timeline branch — so "What changed since yesterday?" (this sprint's own Module 12 example question) was silently hijacked into an unhelpful "no revisions detected" answer instead of a real recent-activity listing. Fixed with a narrow, explained `TEMPORAL_QUALIFIER` exclusion in `revision-query.ts`: a phrase carrying an explicit temporal window (yesterday/today/this week/since/recently) is unambiguously a Timeline question, not a Revision one, so `detectRevisionQuestion()` now defers to it instead of claiming it. This is the same precedented category of cross-sprint bugfix every prior sprint's live testing has produced (Sprint 5.2 fixed Sprint 5.1's `DrawingClassifier`; Sprint 5.3 fixed a Timeline actor-naming regression).
  2. Even after that fix, the phrase still never reached Sprint 4.6's own timeline handling, because that branch runs *after* the Comprehension Engine's clarification gate in `delta-query-resolver.ts`, and "what changed since yesterday" doesn't classify confidently enough to survive it — a pre-existing Comprehension Engine limitation, and that pipeline is frozen (fixing Comprehension's own confidence scoring is far outside this sprint's "reuse only" mandate). The honest, narrow fix: `dashboard-query.ts`'s new `"recent_changes"` kind calls `timeline-query.ts`'s own `detectTimelineQuery`/`answerTimelineQuery` directly, checked *before* Comprehension runs at all — exactly where every Sprint 4.7+ branch already sits, for exactly this reason. No new time-windowing logic was written; the same Sprint 4.6 function does the actual work.
- **"What needs my attention?" is a deliberate, explained exception to "reuse, don't reroute."** Sprint 4.8 already claims that exact phrase for a plain open-Recommendations list. This sprint's Attention Center is a strict superset of that (open Recommendations are one of its five categories, alongside pending approvals, Gateway review requests, onboarding gaps, and new revisions) — so the richer answer wins by being checked earlier in the resolver, without editing Sprint 4.8's own frozen `recommendation-query.ts` file at all. Every other phrase Sprint 4.8 already owns ("What should I do next?", "What recommendations do you have?", bare "What's missing?") is untouched and still answers exactly as before.
- **Project Health's "Pending Approvals" and "Open Validation Requests" are two genuinely distinct real counts, not the same signal shown twice**: Pending Approvals is the narrower set (`validationState === "pending"` AND a named approver via `approvalRequiredFrom`); Open Validation Requests is the broader set (every Knowledge Object not yet validated at all). Verified live that these can differ (1 vs 3 in the smoke test) — a genuinely informative distinction, not a fabricated one.
- **Knowledge Coverage is computed from the real Knowledge Graph (`queryRelationships({projectId})`), not from `KnowledgeObject.relatedDocuments`/`relatedDrawings`/`relatedDiscussions`.** Those three array fields were checked first and rejected: `relatedDiscussions` is always seeded with the object's own origin discussion at creation (never a genuine "is this cross-linked" signal), and nothing in this codebase ever writes to `relatedDocuments`/`relatedDrawings` at all. A bulk, project-scoped `Relationship` query — the same live signal the Recommendation Engine's own `link_related_knowledge` rule already uses — is the honest, already-precedented source of truth instead. Shows "Not Available" (never `0%`) when a project has zero Knowledge Objects, since 0/0 is undefined.
- **Attention Center deliberately excludes "open discussions" as its own category**, even though the brief lists it as an example: `Discussion.status === "open"` is the default, normal state for nearly every discussion, not a signal that something needs attention — surfacing all of them would be noise, not prioritization.
- **Attention Center avoids the one real duplicate risk**: onboarding-gap Recommendations (Sprint 5.4's five rules) are excluded from the generic Recommendations bucket, since the single "Missing onboarding" item already surfaces that same underlying gap once, not per-role/per-document.
- **Quick Actions honestly reuse ONE real destination for five of the nine shortcuts.** Requirement/Decision/Issue/Action/Discussion creation all genuinely happen the same way today — typed naturally into the Journal, where the existing Input Router (4.3.1) and Knowledge Capture Engine (4.4) do the classification and drafting. There is no dedicated "New Requirement" form to route to honestly (the legacy `/projects/[id]/requirements/new` page is a non-functional static mockup, deliberately not used), so all five route to the Journal with an explanatory caption, rather than fabricating five distinct destinations that don't exist.
- **Upcoming's "Meetings" and "Future Milestones" sections are always empty, honestly.** Meetings exist only as an Evidence *type* in this codebase, never a scheduled, dated entity; `data/evolution.ts` (Project Evolution) is static demo content, not real per-project data — reusing it here for "milestones" would be fabrication, not reuse. Both sections show a clear, honest empty state instead.
- **The Delta Daily Briefing does not implement the brief's literal "Since your last visit" framing.** No visit-tracking mechanism exists anywhere in this codebase, and this sprint may not introduce new storage to add one. The briefing instead uses a rolling 7-day trailing window, labeled honestly as "In the last 7 days" — matching `timeline-query.ts`'s own precedent for "recently" (Sprint 4.6).

---

# Acceptance Criteria

- [x] `/projects/[id]/dashboard` renders a full Mission Control composition, not the Sprint 5.3/5.4 lightweight preview.
- [x] `/projects` links into the Dashboard as the project's landing page.
- [x] Delta Briefing shows real, deterministic lines derived from real data, with an honest "all caught up" fallback.
- [x] Project Health shows 8 real metrics, correctly distinguishing Pending Approvals from Open Validation Requests, and correctly showing "Not Available" for Knowledge Coverage when no Knowledge Objects exist.
- [x] Attention Center aggregates 5 real categories, sorted by a fixed urgency ranking, with no duplicate items between onboarding gaps and onboarding-gap Recommendations.
- [x] Project Snapshot, Recent Activity, Recommendations, Upcoming, Quick Actions, and Recent Documents all render real data or an honest empty state.
- [x] Delta answers "What needs my attention?", "How healthy is this project?", "What approvals are pending?", and "What changed since yesterday?" correctly.
- [x] Existing Journal, Timeline, registration, Firm management, project creation, and Project Onboarding all have no regressions.

---

# Validation

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`) — confirms the route manifest is unchanged apart from the rebuilt `/projects/[id]/dashboard`, and no temporary smoke-test routes remain.
- [x] Restarted the development server cleanly multiple times during this sprint (after the initial build, after each of the two Delta-integration bugfixes, and once more for final verification) — the final restart compiled with zero errors and, unlike Sprint 5.4's first build, zero client-bundle warnings.
- [x] **Full end-to-end verification against the real, hosted Supabase project**, using the same temporary-Route-Handler-plus-Admin-API technique every prior sprint has used. Ran the complete flow (register → create Firm → create Project → complete Onboarding, including one document upload and three questionnaire answers, plus a real revision granting one Knowledge Object a named approver) three times while iterating on the two Delta bugfixes below, then once more for final confirmation. Verified live: Project Health's 8 metrics computed correctly and matched hand-checked expectations (3 Knowledge Objects, 1 Pending Approval vs 3 Open Validation Requests, 0% Knowledge Coverage honestly reflecting that onboarding creates no Relationships); Attention Center produced 9 correctly sorted, deduplicated items across all 5 categories with correct `href`s; the Delta Briefing produced 5 correct, real lines; Recent Documents/Snapshot/Recent Activity all matched real counts; all 4 Delta dashboard questions returned correct, evidence-backed answers; `/projects/[id]/dashboard`, `/projects/[id]` (Journal), and `/projects/[id]/timeline` all returned 200 for an authenticated user throughout; `/projects` correctly linked to the Dashboard. **All test data (3 auth users, 3 people, 3 firms, 3 projects, and their associated `project_onboarding`/`project_questionnaire_responses`/`documents` rows) was deleted from the hosted project afterward** — a full listing confirmed zero remaining rows matching the test naming pattern, except a small number of orphaned Storage blobs whose exact paths could no longer be resolved after their owning projects were already deleted (the same cosmetic gap in the temporary cleanup script's own document-lookup query first noted in Sprint 5.4 — harmless, non-sensitive test content, not a production code path).
- [x] Found and fixed two real bugs during this live verification, both in the Delta integration layer (see Implementation Notes for full detail): Sprint 5.0's revision-question detector hijacking a temporally-qualified "what changed" phrase, and Sprint 4.6's timeline branch being unreachable behind Comprehension's clarification gate for that same phrase. Both fixed and reverified live before this sprint was considered complete.

---

# Completion Notes

Completed work: see Files Expected to Change above — every project now has a real Mission Control Dashboard composing Sprints 4.0–5.4's existing intelligence into one landing page, verified against the real hosted database, not simulated.

Known issues:

- A small number of orphaned test-upload blobs likely remain in the shared `documents` Storage bucket across Sprints 5.4 and 5.5 — small, non-sensitive test content, unreferenced by any database row (see Implementation Notes).
- Knowledge Coverage will read 0% for any project whose Knowledge Objects were created without an explicit `Relationship` (e.g. straight from Onboarding's Questionnaire step, which only creates a shared Discussion link, not a graph Relationship) — an honest reflection of real state, not a bug, but worth knowing when reading the metric.
- Discussions counts (Health, Snapshot, and the Briefing's "discussions were resolved" line) inherit the pre-existing, unfiltered-by-`projectId` `getDiscussions()` limitation documented since Sprint 4.5 — not introduced or fixed by this sprint.
- Upcoming's Meetings and Future Milestones sections are permanently empty until a real, dated data model exists for either — an honest foundation, not a placeholder bug.
- Quick Actions' Requirement/Decision/Issue/Action/Discussion shortcuts all route to the Journal (with an explanatory caption) rather than five distinct destinations, since that is genuinely how creation works in this codebase today.
- No permission enforcement, no real meeting scheduling, no real email delivery — all explicitly out of scope, matching every prior sprint's own exclusions.

Follow-up work:

- Once Document/BOQ/Agreement Intelligence exists, Attention Center's Gateway "Needs Review" items can gain real detail pages to link to (they currently render without an `href`, since none exists yet).
- Once a real meeting-scheduling or milestone data model exists, Upcoming's two empty sections can be filled in without changing this sprint's own structure.
- Revisiting whether Onboarding's Questionnaire step should create real Knowledge Graph Relationships (not just a shared Discussion link) now that Knowledge Coverage makes the absence visible on every new project's Dashboard.

Modified files: see Files Expected to Change above.
