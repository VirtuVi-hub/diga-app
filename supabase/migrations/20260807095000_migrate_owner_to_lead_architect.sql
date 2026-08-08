-- =====================================================
-- DIGA - Migrate Owner to Lead Architect (Sprint 5.9, Module 6)
-- =====================================================
-- Architectural correction: the platform must not expose an "Owner" role
-- anywhere — the account that creates a Firm or Project becomes "Lead
-- Architect", never "Owner" (a database implementation detail, not a
-- professional role). Going forward, `createFirm()`/`createProject()`
-- (application code, this sprint) assign "Lead Architect" directly. This
-- migration is the one-time fix for rows already created by earlier
-- sprints (5.3-5.8), so no person is ever left dual-labeled.
--
-- firm_members' unique key is (firm_id, person_id) — role_id is NOT part
-- of it, so a plain UPDATE can never collide.
--
-- project_team's unique key is (project_id, person_id, role_id) — the
-- same person could already separately hold a real "Lead Architect" row
-- for the same project (e.g. reassigned during Project Setup in an
-- earlier sprint), so updating the Owner row's role_id in that case would
-- violate the constraint. Strategy: delete the Owner row wherever a
-- Lead Architect row already exists for the same (project_id, person_id)
-- pair (never delete the Lead Architect row itself), then update every
-- remaining Owner row (no conflict possible at that point).
--
-- Idempotent: a second run finds zero "Owner" rows left and no-ops.

DO $$
DECLARE
  owner_role_id UUID;
  lead_architect_role_id UUID;
BEGIN
  SELECT id INTO owner_role_id FROM public.roles WHERE name = 'Owner' LIMIT 1;
  SELECT id INTO lead_architect_role_id FROM public.roles WHERE name = 'Lead Architect' LIMIT 1;

  IF owner_role_id IS NULL OR lead_architect_role_id IS NULL THEN
    RAISE NOTICE 'Owner or Lead Architect role not found - skipping Sprint 5.9 role data migration.';
    RETURN;
  END IF;

  UPDATE public.firm_members
  SET role_id = lead_architect_role_id
  WHERE role_id = owner_role_id;

  DELETE FROM public.project_team pt_owner
  WHERE pt_owner.role_id = owner_role_id
    AND EXISTS (
      SELECT 1 FROM public.project_team pt_lead
      WHERE pt_lead.project_id = pt_owner.project_id
        AND pt_lead.person_id = pt_owner.person_id
        AND pt_lead.role_id = lead_architect_role_id
    );

  UPDATE public.project_team
  SET role_id = lead_architect_role_id
  WHERE role_id = owner_role_id;
END $$;
