-- =====================================================
-- DIGA - Extend Projects for Governance (Sprint 5.7)
-- =====================================================
-- Module 15 "Project Activation": every project now carries a lifecycle
-- stage, replacing the old `project_onboarding.current_step` as the thing
-- that gates access to the collaborative workspace (Dashboard/Timeline/
-- Knowledge/Journal/Recommendations/Delta).
--
-- Backfill mechanism: the column DEFAULT itself backfills every
-- pre-existing project (including the Samir Vihar demo project) to
-- 'active' as part of this ALTER TABLE — no separate UPDATE statement is
-- needed, and no pre-existing project is ever locked out of functionality
-- it already had. `createProjectFromWizard()` (Sprint 5.3) is updated in
-- this sprint to explicitly insert `lifecycle_stage: 'draft'` for every
-- NEW project, which is the only place a project starts anywhere other
-- than 'active'.
--
-- Module 9 "Main Client": a dedicated FK, not a role-uniqueness
-- constraint on `project_team` — this is the only way to cleanly enforce
-- "exactly one Main Client per project" while "Main Client" still exists
-- as an ordinary `roles` row for display/participant-list purposes.

ALTER TABLE public.projects
ADD COLUMN lifecycle_stage TEXT NOT NULL DEFAULT 'active'
    CHECK (lifecycle_stage IN (
        'draft',
        'agreement_review',
        'agreement_accepted',
        'project_setup',
        'delta_review',
        'active'
    )),
ADD COLUMN main_client_person_id UUID
    REFERENCES public.people(id)
    ON DELETE SET NULL;

CREATE INDEX idx_projects_lifecycle_stage ON public.projects(lifecycle_stage);

COMMENT ON COLUMN public.projects.lifecycle_stage IS
'Governance Engine lifecycle (Sprint 5.7): draft -> agreement_review -> agreement_accepted -> project_setup -> delta_review -> active. The collaborative workspace only unlocks at "active". Pre-existing projects default and backfill to "active" so they are never retroactively locked out.';

COMMENT ON COLUMN public.projects.main_client_person_id IS
'Module 9: exactly one Main Client per project, who has decision authority by default. Set when a Main Client invitation (project_invitations.is_main_client_invite) is accepted.';
