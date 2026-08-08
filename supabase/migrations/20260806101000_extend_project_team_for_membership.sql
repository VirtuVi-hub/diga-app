-- =====================================================
-- DIGA - Extend Project Team for Project Membership (Sprint 5.7)
-- =====================================================
-- Module 5 "Project Membership": separate Project Membership (belongs to
-- Project) from Firm Membership (belongs to Firm, `firm_members`).
-- `project_team` already has project_id/person_id/role_id/active — it only
-- lacked the invited -> active -> removed lifecycle `firm_members.status`
-- already has. Extending it directly (rather than a new parallel table)
-- reuses every existing `project_team` query and keeps one project
-- membership table, matching Module 5's "reuse existing engines" mandate.
--
-- `active` (Sprint 3.x) is left untouched and kept in sync with `status`
-- by the service layer, so every existing `.eq("active", true)` query
-- elsewhere in the codebase keeps working unmodified.

ALTER TABLE public.project_team
ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active', 'removed')),
ADD COLUMN invited_by UUID REFERENCES public.people(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.project_team.status IS
'Project Membership lifecycle (Sprint 5.7), mirroring firm_members.status exactly. Kept in sync with the pre-existing `active` boolean by the service layer.';
