# Sprint: Guided Project Setup & Notification Center

Status: Complete (implementation) — live two-browser verification pending, handed to the user
Sprint ID: 5.9
Target Version: v5.9
Owner: Delta engineering
Created: 2026-08-07
Last Updated: 2026-08-07

---

# Objective

Complete the onboarding journey from Agreement Approval to Project Activation so the workflow feels like a real product, not a checklist. Four structural gaps closed: (1) nothing notified anyone of anything — the TopBar bell was decorative; (2) Project Setup required a manual "Mark Complete" click per step instead of reflecting real state; (3) two different, inconsistent ways existed to add someone to a project; (4) the project/firm creator was labeled "Owner" (a database implementation detail) instead of "Lead Architect" (the real professional role) — a mislabeling that also caused a real bug (the creator was excluded from the Delegation authority-holder list).

---

# Background

Sprints 5.3–5.8 built the real lifecycle (Agreement → Project Setup → Delta Review → Activation) and its external-access layer, but the lifecycle itself still felt mechanical: approving the Agreement silently unlocked a nav item with no notification; every Project Setup step needed a manual completion click regardless of whether anything real had happened; and Project Setup's own "Invite Project Team" step bypassed the real `project_invitations` engine entirely, instantly assigning existing Firm members with no invite/accept step, a code path duplicated from and inconsistent with the Agreement page's and Participants page's own invite forms.

---

# Scope

## Module 6 — Role Architecture Correction (built first; everything else reads role names)

The platform must never expose "Owner" — it's a database implementation detail, not a professional role. The account that creates a Firm or Project now becomes "Lead Architect" everywhere, never "Owner":

- `createFirm()` (`lib/actions/firm-actions.ts`) and `createProject()` (`lib/actions/project-actions.ts`) both now resolve and assign the "Lead Architect" role (via the existing, unscoped `RolesRepository.getRoleIdByName()`) instead of looking up "Owner" under the Firm-level "General" `team_types` bucket. `roles` is one shared table — assigning a Design Team role for Firm membership needed no schema change.
- Two roles the brief's own 15-role invitation list needed didn't exist yet: a plain "Architect" (Design Team — only "Structural Architect"/"Project Architect" existed) and a generic project-level "Consultant" (Delivery Team — the only existing "Consultant" was Firm-level "General," unreachable via `getProjectRoles()`). Seeded via `20260807090000_seed_architect_and_consultant_roles.sql`, following the exact pattern of every prior role-seed migration.
- **Hosted-data migration** (`20260807095000_migrate_owner_to_lead_architect.sql`, applied to the real hosted Supabase project): moves every existing `firm_members`/`project_team` row pointing at "Owner" to "Lead Architect" — `firm_members` via a plain `UPDATE` (unique key excludes `role_id`, no conflict possible), `project_team` via delete-the-Owner-row-if-a-Lead-Architect-row-already-exists-for-the-same-person, then update the rest. Idempotent.
- `lib/permissions/agreement-role.ts`'s `isLeadArchitectFor()` **keeps** its `role === "Lead Architect" || role === "Owner"` fallback deliberately — cheap insurance for any environment where the data migration hasn't run.
- `app/projects/[id]/participants/page.tsx`'s Delegation `authorityHolders` filter now also matches `"Owner"` defensively and passes every role name through the new `toDisplayRoleName()` helper — **a real, confirmed pre-existing bug is fixed here**: a project's own creator was previously excluded from the Delegation candidate list entirely, since their row said "Owner," not "Lead Architect."
- `components/firm/FirmTeam.tsx`/`FirmSetup.tsx` now exclude both "Owner" and "Lead Architect" from the manually-invitable Firm-role dropdown (previously only excluded "Owner" from the *default selection*, not from the rendered options at all — a second, independent bug fixed the same edit touched).
- New `lib/roles/display-role-name.ts` (`toDisplayRoleName()`) — a defensive, display-layer safety net mapping any lingering "Owner" string to "Lead Architect," applied everywhere a role name renders: Participants, Delegation, Firm Team, Dashboard team list, Discussion message attribution (`MessageSpeaker`, `DiscussionCard`), the pre-auth invitation landing page. (The legacy static `/review` demo page — explicitly documented since Sprint 3.x as fake project/fake data, not the real app — was left untouched; it's outside every real data path this correction touches.)

## Module 3 — One Invitation Engine, Two Branches

Per explicit product decision: one engine, two branches, not two systems.

- **Branch A (existing Firm member)**: Choose Existing Firm Member → Assign Project Role → Notify them → added immediately, no accept step.
- **Branch B (external person)**: Choose Role → Generate Invitation → Copy Link/Share WhatsApp → Accept → Sign Up/Sign In → automatically joins the Firm (if appropriate — Main Client invitees never do, since clients aren't Firm members) and the Project with the assigned role.
- New `lib/services/participant-engine-service.ts` (`ParticipantEngineService.addParticipant()`) is the single entry point: if an explicit existing person is picked, or the entered email/phone matches an existing Firm member, it silently takes Branch A; otherwise Branch B via the unmodified `ProjectInvitationService.invite()`.
- `ProjectInvitationService.acceptByCode()` gained the Firm auto-join step Branch B's flow diagram calls for, using the Firm-level "Consultant" role as the generic default.
- New shared `components/participants/AddParticipantFlow.tsx` replaces three previously separate, hand-rolled forms: `ParticipantsClient.tsx`'s inline invite form, `AgreementWorkspace.tsx`'s `InviteMainClientForm`, and Project Setup's direct Firm-member-picker (`TeamSection`). Each caller now just supplies a `section` (which scopes the role dropdown) and its already-fetched `firmMembers`/`projectRoles`.
- New `lib/participants/role-categories.ts` — one shared role-per-section list (Design Team / Consultants / Client Representatives) that both the invite UI's dropdown and Module 4's automatic-progression gate read from, so they can never drift apart.
- **A real, pre-existing authorization gap was found and closed, not silently dropped**: only the Lead Architect could invite the Main Client (enforced in the now-superseded `inviteAgreementMainClient()` action via `requireAgreementRole()`). The new shared `addParticipant()` action re-checks this explicitly whenever `isMainClientInvite` is set, before delegating to the engine — this consolidation could otherwise have quietly removed that check.
- Dead code removed as part of the consolidation: `assignProjectTeamMember`/`removeProjectTeamMember` (project-actions.ts), `assignSetupTeamMember`/`removeSetupTeamMember`/`completeTeamStep`/`completeConsultantsStep`/`completeClientRepresentativesStep`/`completeImportStep` (project-setup-actions.ts/-service.ts), `inviteAgreementMainClient` (agreement-actions.ts), `AgreementReviewService.inviteMainClient()` — each confirmed to have no other caller before deletion.

## Module 4 — Automatic Project Setup Progression

`ProjectSetupService.getProgress()` now computes every item live from real state — no manually-set `*_completed_at` timestamp gates anymore:

- **Lead Architect**: done the moment a `project_team` row says "Lead Architect" (true from creation, per Module 6).
- **Main Client**: done when `projects.main_client_person_id` is set — already true by the time Project Setup is reachable at all, since `requireAgreementAccepted()` already requires an accepted Agreement, which requires a Main Client. Kept as an explicit item anyway (matches the brief's own "2 / 6 Complete" example, which reads as exactly these two already satisfied).
- **Consultants**: done when at least one real `project_team` member holds a role in `CONSULTANTS_SECTION_ROLES`.
- **Client Representatives**: "optional if none" — always counts as done for gating, whether zero or several exist; the section still lists real invited/joined people.
- **Client Questionnaire**: done once every question has a real saved answer — no separate "mark complete" click; saving itself (`ProjectSetupService.processQuestionnaireAnswers()`) creates the real Knowledge Objects for newly-answered questions and, the moment all 12 are answered, marks the step complete and publishes the existing `QUESTIONNAIRE_COMPLETED` event exactly once (idempotent re-check on every save).
- **Delta Review**: unchanged mechanism (`review_completed_at`, set by the existing "Confirm Understanding" action on the review sub-page).

Import Existing Project is **not** one of these 6 gating items (the brief's own count excludes it) — it remains a visible, actionable section with no completion gate, matching its pre-existing "not a step gate" precedent. `readyForReview` (all 5 non-review items done) drives a new "Continue to Delta Review" CTA that only appears once true.

`lib/project-setup/setup-gaps.ts`'s `CORE_PROJECT_ROLES` (the Recommendation Engine's own soft "missing roles" nudge) is deliberately left untouched and independent from `role-categories.ts`'s hard gate — a cross-reference comment now documents why the two lists are allowed to diverge, so a future reader doesn't "helpfully" merge them.

## Module 2 + 5 — Project Setup Reorder, Rename, Actionable Cards

`components/project-setup/ProjectSetupChecklist.tsx` rewritten:

- Order: Design Team → Consultants → Client Representatives → Import Existing Project → Client Questionnaire → Delta Review.
- Titles renamed to match exactly: "Design Team," "Consultants," "Client Representatives," "Import Existing Project," "Client Questionnaire," "Delta Review."
- Progress ("X / 6 Complete," a progress bar, and the "Next: …" hint) moved to the bottom of the page, below every section.
- Every "Mark Complete" button removed. Every Pending section shows a real action — `AddParticipantFlow` for the three participant sections (with real invited/joined lists, Remove/Revoke actions), "Open Import" for Import, the existing questionnaire form (now just "Save"), "Review" for Delta Review — no passive cards.

## Module 1 — Notification Center

Nothing existed before this sprint beyond a decorative Bell and a 23-line placeholder subscriber that appended events to an in-memory array nothing read.

- New, real, persisted `notifications` table (`20260807110000_create_notifications.sql`) — per-recipient, per-project rows with optional primary/secondary action metadata and a `read_at` timestamp. A unique partial index on `dedup_key` is the de-dup mechanism (an insert collision is a safe no-op, not an error).
- Standard 4-layer stack: `lib/types/notification.ts` → `lib/repositories/notification-repository.ts` → `lib/services/notification-service.ts` → `lib/actions/notification-actions.ts`, plus `lib/notifications/recipient-resolution.ts` (real recipients only, never fabricated) and `lib/notifications/notification-copy.ts` (centralizes the exact copy for each of the 6 required types, including the brief's own literal "Agreement Approved" / "Begin Project Setup" / "Later" example).
- `lib/events/subscribers/notifications-subscriber.ts` rewritten to delegate to `NotificationService.handleEvent()` — purely additive to the Event Engine, zero changes to `event-bus.ts`/`event-publisher.ts`.
- New `EVENT_TYPES.DISCUSSION_REPLIED` published from `DiscussionService.addMessage()` (which previously published nothing, deliberately, to avoid Timeline noise) with **`visibility: "internal"`** — reaches the new subscriber but is automatically excluded from the Timeline by its existing `visibility === "project"` filter, so the original "no reply noise" decision is preserved with zero Timeline code changes.
- Event → notification mapping: `AGREEMENT_ACCEPTED` → Agreement Approved (Lead Architect); `AGREEMENT_UPLOADED`/main-client-invite-accepted → Waiting for Your Approval (Main Client, de-duped); `DISCUSSION_CREATED` with a `clauseRef` → Agreement Discussion Started (both parties — the event's own `actor.id` is always `null`, a frozen, documented `DiscussionService.create()` limitation, so the opener also sees their own notification, an honest minor imperfection rather than a guess); `DISCUSSION_REPLIED` with a `clauseRef` → Agreement Discussion Replied (the other party, correctly excluding the real replier since `addMessage()`'s `author.id` is a real id); `PARTICIPANT_JOINED` → Invitation Accepted (the inviter) and Team Member Joined (the rest of the team), now fired by *both* invitation-engine branches.
- New `components/delta/NotificationBell.tsx` (badge, polling every 30s — no websocket/push infrastructure exists anywhere in this codebase, an honest limitation) and `NotificationPanel.tsx` (list, relative timestamps, inline primary/secondary action buttons, mark read/mark all read) replace the inert Bell button in `components/delta/TopBar.tsx`.
- `ProjectIdentityContext`'s `ProjectIdentity` gained an `id` field (previously absent entirely) so the client-side Bell knows which project to fetch notifications for.
- **A real client-bundle-leak bug was found and fixed during this sprint's own build verification, the same class of bug Sprint 5.4 first documented**: `notifications-subscriber.ts` is transitively reachable from a client bundle (`event-publisher.ts` → `revision-service.ts` → `revision-query.ts` → `delta-query-resolver.ts` → the client hook `useDeltaPanel.ts`). `NotificationRepository` was fixed to use the service-role client (`createServiceSupabaseClient()`, no `next/headers` dependency — privacy is enforced at the query layer via `.eq("recipient_person_id", …)`, not RLS, matching this codebase's uniformly permissive-RLS convention) instead of the request-scoped one, and `recipient-resolution.ts` was fixed to call the existing `"use server"` action `getProjectMainClient()` instead of `ProjectGovernanceRepository` directly. `NotificationService` (the subscriber-facing half) now has zero dependency on `getCurrentPerson()`/`next/headers` — "my own notifications" (list/unread-count/mark-read) logic lives entirely in the `"use server"` `notification-actions.ts` instead, where that dependency is safe.

## Module 7 — Regression

Verified via code review and the full `tsc`/`lint`/`build` suite (see Validation): Agreement viewer resolution (`ownerId === personId` is keyed on `projects.owner_id`, never the role name — unaffected by Module 6); Delegation authority-holder list (now correctly includes the creator — an intended fix, not a regression); Firm Team page (creator displays "Lead Architect," dropdown excludes both labels); no dangling callers of any deleted function (grepped before every deletion); no double-publish of `PARTICIPANT_JOINED` (exactly one publish per real join, across both invitation-engine branches); `setup-gaps.ts`'s divergence from `role-categories.ts` is now explicitly documented as intentional.

---

# Files Expected to Change

New:
- `supabase/migrations/20260807090000_seed_architect_and_consultant_roles.sql`, `20260807095000_migrate_owner_to_lead_architect.sql`, `20260807110000_create_notifications.sql`
- `lib/roles/display-role-name.ts`
- `lib/participants/role-categories.ts`, `lib/services/participant-engine-service.ts`, `lib/actions/participant-actions.ts`, `components/participants/AddParticipantFlow.tsx`
- `lib/types/notification.ts`, `lib/repositories/notification-repository.ts`, `lib/services/notification-service.ts`, `lib/actions/notification-actions.ts`, `lib/notifications/recipient-resolution.ts`, `lib/notifications/notification-copy.ts`, `components/delta/NotificationBell.tsx`, `components/delta/NotificationPanel.tsx`

Changed:
- `lib/actions/firm-actions.ts`, `lib/actions/project-actions.ts` (Lead Architect assignment; dead `assignProjectTeamMember`/`removeProjectTeamMember` removed)
- `lib/permissions/agreement-role.ts` (comment only — fallback kept), `app/projects/[id]/participants/page.tsx`, `components/firm/FirmTeam.tsx`, `components/firm/FirmSetup.tsx`
- `lib/repositories/firm-repository.ts` (`listMembers()` now selects `phone`; doc-comment cross-reference), `lib/types/firm.ts` (`FirmMemberWithDetails.person` gained `phone`)
- `lib/services/project-invitation-service.ts` (Firm auto-join on accept), `components/participants/ParticipantsClient.tsx`, `components/agreement/AgreementWorkspace.tsx`, `app/projects/[id]/agreement/page.tsx`
- `lib/actions/agreement-actions.ts`/`lib/services/agreement-review-service.ts` (dead `inviteAgreementMainClient`/`inviteMainClient` removed)
- `lib/types/project-setup.ts`, `lib/services/project-setup-service.ts`, `lib/actions/project-setup-actions.ts`, `components/project-setup/ProjectSetupChecklist.tsx`, `app/projects/[id]/setup/page.tsx` (comment), `lib/project-setup/setup-gaps.ts` (comment)
- `lib/events/event-types.ts` (`DISCUSSION_REPLIED`), `lib/services/discussion-service.ts` (`addMessage()` publishes it), `lib/events/subscribers/notifications-subscriber.ts`
- `components/project-shell/ProjectIdentityContext.tsx`, `ProjectIdentityBridge.tsx`, `components/delta/TopBar.tsx`
- Display-safety sweep: `components/delta/MessageSpeaker.tsx`, `components/delta/DiscussionCard.tsx`, `app/projects/[id]/dashboard/page.tsx`, `app/invite/[code]/page.tsx`, `components/governance/DelegationPanel.tsx`

---

# Files That Must Not Change

Every frozen intelligence engine (Comprehension/Intelligence/Evidence/Reasoning/Drawing/Revision Intelligence's drawing-specific comparator), the Governance Engine's own core (`governance-roster.ts`, `impact-engine.ts`, `governance-rules-repository.ts`), `event-bus.ts`/`event-publisher.ts` (subscriber changes are purely additive), `AgreementReviewService`'s Accept/Discussion/Revision business logic (only its now-dead `inviteMainClient()` helper was removed — Accept/Discussion/Revision themselves untouched), `DiscussionService.create()`'s own `actor.id: null` limitation (not fixed — a frozen, documented gap).

---

# Constraints

- One invitation engine, two branches — confirmed no third, parallel invite-shaped form remains anywhere (`ParticipantsClient`, `AgreementWorkspace`, `ProjectSetupChecklist` all now call the same `AddParticipantFlow`/`addParticipant()`).
- Projection-first for notifications too: `NotificationService` never fabricates a recipient — every recipient comes from real `project_team`/`projects.main_client_person_id` data.
- Prefer refactoring over rewriting — Module 6's role fix reused the existing `RolesRepository.getRoleIdByName()` unchanged; Module 4's progression reused the existing `ProjectSetup`/`ProjectGovernanceRepository` schema unchanged (no new columns needed for gating).

---

# Implementation Notes (Architecture Decisions)

- **"Consultant" now exists as two distinct roles** — the pre-existing Firm-level "General" one (used for Branch B's Firm auto-join default) and the new project-level Delivery Team one (used for the Consultants Project Setup section and its gating check). Deliberately not merged; conflating them would have made `RolesRepository.getRoleIdByName("Consultant")` ambiguous (two rows, one name) — the Firm auto-join resolves its role via `getGeneralRoles()` specifically, never the generic by-name lookup, to avoid that collision.
- **The client-bundle-leak fix (Module 1)** is the same category of bug Sprint 5.4 first hit and documented, now recurring because this is the first subscriber to ever need real (not mock/in-memory) persistence. Documented in `notification-service.ts`'s own header comment as a durable lesson for any future subscriber: never import `getCurrentPerson()`/a raw repository class that uses `next/headers` into subscriber-reachable code — route through an existing `"use server"` action instead, or (for pure system-side-effect writes with query-layer-enforced privacy) use the service-role client.
- **"Agreement Discussion Started" cannot exclude its own opener** — `DISCUSSION_CREATED`'s `actor.id` is permanently `null` by explicit, repeatedly-documented design (every prior sprint's own comment says not to fix it), so both parties are notified unconditionally rather than guessing. "Agreement Discussion Replied" has no such limitation, since `addMessage()`'s `author.id` was always a real id.
- **The legacy static `/review` demo page** (explicitly documented since Sprint 3.x as "the original static DeltaApp demo — fake project, fake data") still displays a literal "Owner" stat label. Left untouched deliberately: it's outside every real data path Module 6 corrects, and redesigning it would be scope creep into unrelated, frozen legacy functionality.

---

# Acceptance Criteria

- [x] Agreement approval shows a Notification Center entry to the Lead Architect (title/body matching the brief's example, "Begin Project Setup"/"Later" actions) — no automatic redirect into Project Setup (confirmed already true pre-sprint; the notification is the new deliverable).
- [x] Notifications exist for all 6 required types: Agreement approved, Agreement discussion started, Agreement discussion replied, Invitation accepted, Team member joined, Waiting for your approval.
- [x] Every Project Setup Pending section shows a real action — no dead cards.
- [x] One invitation engine, two branches, reused by every project participant category (Design Team, Consultants, Client Representatives, Main Client, general Participants).
- [x] "Mark Complete" removed everywhere in Project Setup; progression is fully automatic from real state.
- [x] Project Setup reordered (Design Team → Consultants → Client Representatives → Import → Questionnaire → Delta Review), progress shown at the bottom.
- [x] The account that creates a Firm or Project becomes "Lead Architect," never "Owner" — verified via code (assignment) and a hosted-data migration (existing rows); "Owner" does not render anywhere in the real app's UI (display-safety sweep applied).
- [x] `tsc --noEmit`, `npm run lint`, `npm run build` all pass clean.
- [x] Dev server restarts cleanly with zero errors; homepage responds 200.
- [x] All 3 new migrations applied to the real, hosted Supabase project.

---

# Validation

- [x] `npx tsc --noEmit` — clean.
- [x] `npm run lint` — clean.
- [x] `npm run build` — clean (confirms every route compiles, including the new `notifications` dependency chain with zero client-bundle leaks after the fix above).
- [x] Dev server restarted cleanly (`.next` cleared first) — `✓ Ready in 6.1s`, zero errors; `GET /` confirmed 200 after its expected auth-redirect chain.
- [x] All 3 new migrations applied to the real, hosted Supabase project via `supabase db push`, confirmed with `supabase migration list` (local/remote timestamps match).
- [ ] **Live two-browser verification (Lead Architect / Main Client) against the real hosted Supabase project — explicitly handed to the user per their own request this sprint**, rather than the temp-route-handler-plus-cookie-replay technique every prior sprint (5.3–5.8) used autonomously. Not yet performed as of this document's writing.

---

# Completion Notes

Completed work: see Files Expected to Change above — the Notification Center is real and persisted, Project Setup progresses on its own from real state with zero manual completion clicks, every project participant category shares one invitation engine with two clearly-scoped branches, and the platform has exactly one professional identity for a project's creator ("Lead Architect") both going forward and for every project/Firm created in prior sprints.

Known limitations (honestly disclosed, not fabricated away):

- No real-time push/websocket infrastructure exists anywhere in this codebase — the Notification Bell polls every 30 seconds, an honest limitation, not a fabricated "live" feel.
- "Agreement Discussion Started" notifies both parties unconditionally (cannot exclude the actual opener) — a direct, unavoidable consequence of `DISCUSSION_CREATED`'s frozen `actor.id: null` limitation, not a new gap this sprint introduced.
- Live two-browser verification against the hosted Supabase project has not yet been performed — the user chose to drive it themselves this sprint rather than the autonomous route-handler technique prior sprints used; test-data cleanup should happen after that session.
- The legacy static `/review` demo page still shows a literal "Owner" label — deliberately out of scope (frozen, unrelated legacy surface, not part of the real data-backed app).
- No permission/authorization enforcement engine exists — the one specific check this sprint's consolidation could have silently dropped (only the Lead Architect may invite the Main Client) was found and preserved; the broader "role assignment only, no general authorization" boundary every prior sprint has drawn is unchanged.

Future extension points:

- `lib/participants/role-categories.ts` is the natural place to add new sections (e.g. a dedicated "Vendors" Project Setup step) without touching the invitation engine itself.
- `lib/notifications/notification-copy.ts` is the one place to add a 7th notification type later — `NotificationService.handleEvent()`'s switch is additive by construction.
- `NotificationRepository`'s service-role-client pattern is now the precedent for any future subscriber that needs real persistence — documented explicitly so the next one doesn't rediscover the client-bundle-leak the hard way.

Modified files: see Files Expected to Change above.
