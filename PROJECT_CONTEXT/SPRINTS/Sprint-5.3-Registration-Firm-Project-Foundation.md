# Sprint: Registration, Firm & Project Foundation

Status: Complete
Sprint ID: 5.3 (originally specified as "5.2" — renumbered; Sprint 5.2, "Project Intelligence Gateway," was already complete and documented earlier in this session under that number. Confirmed with the user before starting.)
Target Version: v5.3
Owner: Delta engineering
Created: 2026-08-04
Last Updated: 2026-08-04

---

# Objective

Make DIGA usable from Day 1. A brand-new user can create an account, create or join a Firm, invite team members, create a Project through a guided wizard, and arrive at a project workspace ready for onboarding. This sprint is explicitly not about adding more intelligence — it builds the registration/organization/project-creation layer underneath the intelligence platform Sprints 4.0–5.2 already built, and does not redesign any of it.

---

# Background

Every prior sprint (4.0–5.2) built real intelligence capabilities on the assumption that a project, a signed-in user, and a team already existed — `lib/permissions/project-info-ui.ts` has carried an explicit "TEMPORARY (pre-authentication)" comment assuming every user is the Lead Architect since Sprint 3.6A. This sprint is the first to actually build that missing foundation. Two things made this materially different from Sprints 5.0–5.2: it works against **real, Postgres-backed Supabase tables**, not the mock in-memory repositories every intelligence sprint uses, and it required real schema migrations against the **live hosted Supabase project** (confirmed explicitly with the user before running `supabase db push`, since this affects a shared database, not a local sandbox). An approved architecture document already existed for this exact problem — `docs/architecture/002-authentication-and-authorization.md` — and a schema review already in progress — `docs/database/schema-review.md` — both read in full before any code was written, and both referenced throughout the decisions below.

---

# Scope

## In Scope

- **Module 1 (Authentication)**: real `signUp()`/`signInWithPassword()`/`signOut()`; Forgot Password / Reset Password / Email Verification as real Supabase Auth calls with no custom email-sending built.
- **Module 2 (Firm)**: `firms` table (evolved from the dormant `companies` table, per the schema review's own decision), Create Firm, Join Firm (invite code), Firm profile fields (logo, address, basic info).
- **Module 3 (Team Management)**: `firm_members` join table, the exact 7 roles (Owner/Architect/Designer/Engineer/Client/Consultant/Viewer), Invite Team (code-based, no email delivery).
- **Module 4 (Project Creation Wizard)**: a real 4-step wizard (Details → Scope & Timeline → Project Team → Review) replacing the old single-page form.
- **Module 5 (Project Home)**: a Welcome banner with suggested next steps, shown only on a genuinely empty project, never forced.
- **Module 6 (Dashboard Foundation)**: a lightweight, read-only Project Dashboard reusing existing projections.
- **Module 7 (Navigation)**: "Firm" and "Dashboard" added to the sidebar.
- **Module 8 (Events)**: four new Event types, reusing the unmodified Event Engine.
- **Module 9 (Delta)**: four onboarding questions answered from real project state, reusing the unmodified Intelligence Engine's Delta pipeline.
- A real, project-root `proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts` — see Implementation Notes) providing session refresh and baseline route protection, closing a real pre-existing gap (no such file existed before this sprint).

## Out of Scope

Explicitly excluded by the brief: subscription management, billing, a permission engine (role *assignment* only — no enforcement of what a role may do), real email delivery (Forgot Password/Verify call real Supabase Auth methods, which only send an email if the hosted project's own SMTP is configured — no custom email infrastructure was built). Also out of scope, and explicitly not what this sprint implements: `docs/architecture/002`'s fuller "invitation link + Lead Architect review" workflow (secure expiring links, profile review before assignment, Co-Authenticators, ownership transfer) — this sprint implements a simpler, direct invite-code mechanism instead, which the brief's own Module 2/3 language ("invite code placeholder") anticipates. See Implementation Notes for how the two relate.

---

# Files Expected to Change

New:
- `supabase/migrations/20260804100000_link_people_to_auth_users.sql`, `20260804101000_rename_companies_to_firms.sql`, `20260804102000_create_firm_members.sql`, `20260804103000_create_firm_invitations.sql`, `20260804104000_seed_general_team_roles.sql`, `20260804105000_extend_projects_for_wizard.sql`, `20260804106000_fix_firm_and_people_permissions.sql`
- `lib/types/firm.ts`, `lib/auth/current-person.ts`
- `lib/repositories/firm-repository.ts`, `lib/services/firm-service.ts`, `lib/actions/firm-actions.ts`, `lib/actions/auth-actions.ts`, `lib/actions/project-actions.ts`
- `lib/onboarding/suggested-next-steps.ts`, `lib/onboarding/onboarding-query.ts`
- `proxy.ts`
- `app/auth/register/page.tsx`, `app/auth/forgot-password/page.tsx`, `app/auth/reset-password/page.tsx`, `app/auth/verify/page.tsx`
- `app/firm/page.tsx`, `components/firm/FirmSetup.tsx`, `components/firm/FirmTeam.tsx`
- `components/project-wizard/ProjectWizard.tsx`
- `app/projects/[id]/dashboard/page.tsx`, `components/project-shell/ProjectWelcomeBanner.tsx`

Changed:
- `app/auth/page.tsx` (added Forgot Password / Create Account links)
- `app/projects/new/page.tsx` (replaced the single-page form with the wizard)
- `app/projects/[id]/page.tsx` (conditionally renders the Welcome banner)
- `components/project-shell/AppSidebar.tsx` (added "Firm" and "Dashboard" nav items)
- `lib/events/event-types.ts` (`USER_REGISTERED`/`FIRM_CREATED`/`MEMBER_INVITED`/`PROJECT_CREATED`)
- `lib/events/timeline-projection.ts` (`SUMMARY_BUILDERS` only)
- `lib/intelligence-engine/delta-query-resolver.ts` (one new onboarding branch)
- `lib/drawing-intelligence/drawing-classifier.ts` (one-line fix, found live during this sprint — see Implementation Notes)

Removed:
- `middleware.ts` (renamed to `proxy.ts` — Next.js 16 convention change, functionality unchanged)

---

# Files That Must Not Change

Every file every prior sprint's own "must not change" list covers — no intelligence engine (Comprehension, Intelligence, Evidence, Reasoning, Recommendation, Revision, Drawing, Gateway) was modified beyond the one classifier fix noted above. `docs/architecture/002-authentication-and-authorization.md` and `docs/database/schema-review.md` were read and honored as design input, not edited. `HomeWorkspace.tsx` (the Journal itself) was not touched — only wrapped with a conditional banner above it.

---

# Constraints

- No billing, no subscription management, no permission engine (role assignment only).
- No real email delivery — every "send" this sprint is either a real Supabase Auth call (which may or may not actually deliver, depending on hosted project configuration this app does not control) or an on-screen invite code shared manually.
- Reuse the Knowledge Graph, Relationship Engine, Timeline, Recommendation Engine, Event Engine — do not duplicate any of them.
- Do not redesign the existing intelligence architecture.

---

# Implementation Notes (Architecture Decisions)

- **Sprint renumbered 5.2 → 5.3 before any work began.** The brief specified "Sprint 5.2," but Sprint 5.2 ("Project Intelligence Gateway") was already complete and documented earlier in this session under that exact number. Rather than silently overwrite or collide with it, this was raised explicitly and the user chose renumbering to 5.3, preserving both sprints' history cleanly.
- **`docs/architecture/002-authentication-and-authorization.md` and `docs/database/schema-review.md` were read in full before writing any code**, and this sprint deliberately implements a *simplified subset* of the former, not a contradiction of it. Doc 002 describes a fuller invitation model: a user generates a secure, expiring, revocable, auditable invitation *link* representing their own profile; a Lead Architect reviews it and assigns Firm + Project + Role; Lead Architects are appointed only by other Lead Architects (a real bootstrapping question doc 002 doesn't itself resolve); Project Owners can appoint Co-Authenticators and transfer ownership. This sprint's brief explicitly asks for something simpler — "Join Firm (invite code placeholder)," "No permissions engine yet" — so this sprint implements direct invite-by-code (a Firm member picks a role and an email, generates a code, shares it manually; anyone who registers can enter that code to join) rather than the review-gated link workflow. The `firm_members`/`firm_invitations` schema this sprint introduces does not preclude building the fuller model later — `status: "invited"` already exists on `firm_members` as an unused-this-sprint value reserved for exactly that evolution — but the fuller workflow (secure links, profile review, Lead-Architect-appoints-Lead-Architect, Co-Authenticators, ownership transfer) is honestly not built here.
- **The Firm/Team schema evolves `docs/database/schema-review.md`'s own already-decided plan, verbatim**: `companies` → `firms` (its exact reviewed decision), `people.company_id` removed in favor of a real `firm_members` join table (its exact reviewed decision, since "a person may belong to multiple Firms"), and `people.auth_user_id` links `auth.users → people` (its exact "Emerging Architecture Decision"). Nothing here was newly decided by this sprint — it was already decided, just not yet implemented.
- **Module 3's 7 roles reuse the EXISTING `team_types`/`roles`/`project_team` tables rather than a parallel role system** — "Reuse the existing participant model where possible" taken literally. A new `"General"` `team_type` seeds the 7 roles (Owner/Architect/Designer/Engineer/Client/Consultant/Viewer), and both `firm_members.role_id` and `project_team.role_id` reference the exact same rows — so a Firm invite's role picker and the Project Wizard's Step 3 role picker are guaranteed to offer identical options, sourced from one place. The pre-existing, orphaned `app/participants/*` pages (found during research to query a `"participants"` table that doesn't exist in any migration — dead code predating this sprint) were deliberately left untouched; fixing unrelated dead code was not this sprint's job.
- **`ensurePersonForAuthUser()` uses the service-role client, not the request-scoped one — a decision forced by a real, live discovery, not a preference.** The hosted Supabase project requires email confirmation before granting a session; immediately after `signUp()`, the request is still Postgres role `anon`, and every `people` RLS policy is `authenticated`-only — so a naive implementation using the regular client throws `permission denied for table people` the moment confirmation is required (confirmed live, not assumed). Creating a professional profile at registration time is a trusted, server-only bootstrap step — exactly the case `createServiceSupabaseClient()` (present since the Foundation migration, unused by any code until this sprint) exists for.
- **A second, more fundamental permissions bug was found through the same live testing, with its own fix migration**: this Supabase project's `auto_expose_new_tables` setting (see `supabase/config.toml`'s own comment: "matching the new cloud default") means an RLS *policy* alone is not sufficient — a table also needs an *explicit `GRANT`*, exactly the pattern `20260723107000_fix_projects_permissions.sql`/`20260725100000_fix_application_permissions.sql` already established for `projects`/`requirements`, but which was never applied to `people`/`firms`(`companies`)/`roles`/`team_types`/`project_team` — and never to `service_role` at all, for any table, since nothing had used it before this sprint. `20260804106000_fix_firm_and_people_permissions.sql` grants full CRUD to both `authenticated` and `service_role` on every table this sprint touches. This is genuinely useful, durable knowledge for future sprints: **a new table in this project needs both an RLS policy and an explicit `GRANT`, or it silently fails for every role, including `service_role`.**
- **`getFirmForPerson()` was fixed mid-sprint after live testing surfaced a real design bug, not just a test artifact.** The first implementation used `.maybeSingle()`, assuming one active Firm membership per person — but `docs/architecture/002` is explicit that "a person may belong to multiple Firms," and re-running Firm creation for the same test person (while iterating on an unrelated bug) immediately produced exactly that state, causing `.maybeSingle()` to throw `JSON object requested, multiple (or no) rows returned`. Fixed to order by `created_at` and take the earliest membership as "the" current Firm context — an honest, documented simplification (no Firm-switcher UI exists this sprint), not a data-integrity assumption that silently breaks the moment reality disagrees with it.
- **A PostgREST ambiguous-embedding error was found and fixed**: `firm_members` has two foreign keys into `people` (`person_id` and `invited_by`), so `.select("...person:people(...)...")` fails with "more than one relationship was found for 'firm_members' and 'people'" — fixed with PostgREST's column-hint syntax, `people!person_id(...)`.
- **Event `actor.id` is a display name, not a UUID — a real convention this sprint had to preserve, not invent.** Every existing Timeline `SUMMARY_BUILDERS` entry (`withActor()`, `timeline-projection.ts`) inserts `actor.id` directly into a human-readable sentence, because every prior sprint's mock data used a display name as the id itself (`"Maya Chen"`, `"Delta"`). Real authentication introduces real UUIDs for `Person.id` — passing one as `actor.id` produced a raw UUID in the Timeline (`"28275ec0-... created a new project"`, caught live). Fixed by threading each action's already-available person display name through to the four new events' `actor.id` instead of the UUID, matching the existing convention rather than changing it (changing `withActor()` itself to resolve a name from an id would require Timeline's pure projection function to depend on the `people` table, a bigger and unnecessary change).
- **`middleware.ts` does not exist in this sprint's final state — it is `proxy.ts`.** Next.js 16 renamed the file convention ("Middleware is now called Proxy... functionality remains the same," confirmed by reading `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`, per this app's own AGENTS.md instruction to check for breaking changes before writing new code). The dev server's own startup warning ("The 'middleware' file convention is deprecated") caught this immediately; the file was renamed and the exported function renamed from `middleware` to `proxy` before any further testing.
- **`proxy.ts` is authentication (is anyone signed in?), not authorization (what may they do?)** — it redirects an unauthenticated request to `/auth` for any path outside `/auth`, `/review` (the standalone static demo), and `/logout`. This closes a real, confirmed-by-research gap: no such file existed before this sprint, so most `/projects/[id]/**` routes had zero auth check at all, and any session-refresh happening inside a Server Component read had nowhere reliable to write a refreshed cookie back to.
- **The Welcome banner's "is this project empty" check deliberately does NOT use Discussion count.** `getDiscussions()` is unfiltered by `projectId` (a pre-existing gap documented since Sprint 4.5 — `Discussion` has no such field) — using it would mean the banner never shows for ANY project once any Discussion exists anywhere in the app, which is already true today from the intelligence sprints' own seed data. Knowledge Object count and Drawing count ARE reliably project-scoped, so those decide emptiness instead; `getSuggestedNextSteps()`'s own per-step `done` flags still inherit the same Discussion-count limitation for the "Start Client Questionnaire"/"Open Journal" steps specifically, which is honestly noted rather than silently propagated into the banner's overall visibility.
- **The Project Dashboard (Module 6) deliberately reuses data, not the interactive UI components.** `getProjectDashboard()` composes the exact same `getTimeline()`/`getRecommendations()`/`getAllKnowledgeObjects()`/`getDrawings()`/`getDiscussions()` calls every other page already uses, rendered as a lightweight, read-only summary — not the full interactive `RecommendationCard`/`TimelineEntryCard` components, which have Accept/Dismiss and click-through behavior that belongs to their own pages, not a dashboard preview blurb.
- **Delta's four onboarding questions and the Welcome banner's next-steps list are the SAME function, not two implementations of the same idea** (`lib/onboarding/suggested-next-steps.ts`) — the "reuse, don't duplicate" discipline every intelligence sprint applies to engines, applied here to onboarding guidance text.

---

# Acceptance Criteria

- [x] Registration works (verified live against the real hosted Supabase project).
- [x] Login works (pre-existing, unmodified `signInWithPassword` flow, reverified working after `proxy.ts` was added).
- [x] Firm creation works (verified live — creates a real `firms` row and a real Owner `firm_members` row).
- [x] Team invitation works (verified live — creates a real `firm_invitations` row with a real, on-screen invite code).
- [x] Project wizard works (verified live — creates a real `projects` row with `firm_id`/`owner_id`/`created_by` populated, and a real `project_team` row for the creator).
- [x] Dashboard loads (verified live — correct project summary, team, real Timeline/Recommendation data, correct counts).
- [x] Existing Journal works (verified — `/projects/[id]` loads correctly for an authenticated user; `HomeWorkspace` itself untouched).
- [x] Existing Timeline works (verified — `/projects/[id]/timeline` loads correctly; new event types render with correct humanized summaries).
- [x] Existing Knowledge system works (verified via the Dashboard's own `knowledgeCount`, sourced from the unmodified `KnowledgeObjectService`).
- [x] Existing intelligence has no regressions (`tsc`/lint/build all pass; Drawing/Revision/Gateway/Recommendation/Timeline code paths untouched except the one documented classifier fix).

---

# Validation

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`) — confirms all new routes (`/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify`, `/firm`, `/projects/[id]/dashboard`) and the `Proxy (Middleware)` entry appear in the route manifest.
- [x] Restarted the development server cleanly multiple times during this sprint (once after the `middleware.ts` → `proxy.ts` rename, once after clearing a stale `.next` build cache left over from temporary smoke-test routes, once for final verification) — each restart compiled with zero errors.
- [x] **Full end-to-end verification against the real, hosted Supabase project** (explicitly confirmed with the user first, since this modifies a shared database, not a local sandbox) — not a mock-repository smoke test like Sprints 5.0–5.2, since this domain has no mock layer. Using temporary Route Handlers (added and removed within this session, the same "added and removed" precedent every prior sprint's own validation uses) plus the Admin API to work around a real Supabase email-confirmation rate limit hit mid-session: registered a real user, confirmed a real `people` row was created and linked via `auth_user_id`; created a real Firm and confirmed the creator became its Owner; invited a team member and got back a real, usable invite code; created a real Project through the wizard's own service function and confirmed `firm_id`/`owner_id`/`created_by`/`project_team` were all populated correctly; loaded the real Dashboard and got correct counts (including the pre-existing, unfiltered discussion count from earlier intelligence sprints — an honest inherited limitation, not a bug); asked Delta "How do I start?" and "Who should I invite?" and got real, grounded answers; confirmed the Timeline showed a properly humanized `"Smoke Test User created a new project: Smoke Test Project"` entry, not a raw UUID; confirmed protected routes (`/projects`, `/projects/[id]`, `/projects/[id]/timeline`, `/projects/[id]/dashboard`, `/firm`) correctly redirect to `/auth` when unauthenticated and correctly return 200 when authenticated; confirmed `/projects/new` correctly redirects to `/firm` (not `/auth`) for an authenticated user with no Firm yet. **All test data (auth users, people, firms, firm_members, firm_invitations, projects) was deleted from the hosted project after verification** — nothing from this session's testing remains in the live database.
- [x] Found and fixed five real issues during this live verification, none of which would have surfaced from code review alone (see Implementation Notes for full detail on each): the `middleware.ts` → `proxy.ts` Next.js 16 rename; the service-role requirement for `ensurePersonForAuthUser()`; the missing explicit `GRANT`s (`auto_expose_new_tables`); the PostgREST ambiguous-embedding error on `firm_members` → `people`; the multi-Firm-membership `.maybeSingle()` bug; and the `actor.id` UUID-vs-display-name Timeline regression. All fixed and reverified live before this sprint was considered complete.
- [ ] Full authenticated visual (browser click-through) verification was not possible in this environment — the same limitation every sprint since 4.0 has documented. Verified via code review, `tsc`/lint/build, and the live, real-database end-to-end test above (a stronger form of verification than prior sprints' mock-repository smoke tests, but still not a rendered-UI click-through).

---

# Completion Notes

Completed work: see Files Expected to Change above — a brand-new user can now genuinely register, create or join a Firm, invite teammates, create a Project through a real 4-step wizard, and land in a project workspace with a real, grounded Welcome experience — verified against the real hosted database, not simulated.

Known issues:

- This sprint implements a simplified invite-code Firm-joining/team-invitation mechanism, not `docs/architecture/002`'s fuller secure-link-plus-Lead-Architect-review workflow, Co-Authenticators, or ownership transfer — a deliberate, documented scope decision (see Implementation Notes), not an oversight.
- No permission enforcement exists — every signed-in Firm member can currently invite others, create Projects, etc.; only role *assignment* exists, matching the brief's own explicit exclusion.
- No real email delivery — Forgot Password / Verify Email call real Supabase Auth methods that may or may not actually deliver an email depending on the hosted project's own SMTP configuration, which this app does not control or configure.
- `getFirmForPerson()` returns only the earliest Firm membership when a person belongs to more than one — correct per `docs/architecture/002`'s own multi-Firm model, but there is no Firm-switcher UI this sprint to choose among them.
- The Welcome banner's and Dashboard's `discussionsCount` (and the "Start Client Questionnaire"/"Open Journal" suggested-step `done` flags) inherit the pre-existing, unfiltered-by-`projectId` `getDiscussions()` limitation documented since Sprint 4.5 — not introduced or fixed by this sprint.
- There is no UI to assign an existing Project to a Firm after the fact, or to change a Project's Firm — the wizard requires a Firm to already exist and assigns it once, at creation.
- `proxy.ts`'s route protection is a binary "signed in or not" check — no role- or Firm-membership-based route gating exists (explicitly out of scope: "Do NOT build permission management").
- The orphaned `app/participants/*` pages (querying a `"participants"` table that exists in no migration) were found during research and deliberately left untouched — pre-existing dead code, not part of this sprint's scope.

Follow-up work:

- Building `docs/architecture/002`'s fuller invitation-link-plus-review workflow, Co-Authenticators, and ownership transfer on top of the `firm_members`/`firm_invitations` schema this sprint introduced (the `"invited"` status on `firm_members` is already reserved for exactly this).
- A real permission/authorization layer using Firm and Project membership + role, per `docs/architecture/002`'s own "Access Evaluation" sequence — explicitly deferred, not this sprint's job.
- A Firm-switcher UI, once a person belonging to multiple Firms is a real, common case rather than a discovered-during-testing edge case.
- Revisiting `lib/permissions/project-info-ui.ts`'s hardcoded `canViewProjectInfo(): true` now that real authentication and real Firm/Project membership exist — deliberately left untouched this sprint, since replacing it with a real check is permission logic, not authentication.

Modified files: see Files Expected to Change above.
