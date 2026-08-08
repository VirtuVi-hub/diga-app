-- =====================================================
-- DIGA - Seed "General" Team Type and Onboarding Roles
-- =====================================================
-- Module 3's exact role list (Owner, Architect, Designer, Engineer,
-- Client, Consultant, Viewer). Deliberately reuses the EXISTING
-- `team_types`/`roles` tables (the same ones `project_team` already uses)
-- rather than inventing a parallel role vocabulary just for Firm
-- membership — "Reuse the existing participant model where possible"
-- (Module 2). `firm_members.role_id` and `project_team.role_id` both
-- reference these same rows, so one role picker/vocabulary serves both
-- Firm invitations and Project Team assignment.

INSERT INTO public.team_types (name, description, sort_order)
VALUES ('General', 'General Firm and Project roles used during onboarding.', 100)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.roles (team_type_id, name, abbreviation, sort_order)
SELECT tt.id, r.name, r.abbreviation, r.sort_order
FROM public.team_types tt
CROSS JOIN (VALUES
    ('Owner', 'OWN', 1),
    ('Architect', 'ARCH', 2),
    ('Designer', 'DSN', 3),
    ('Engineer', 'ENG', 4),
    ('Client', 'CLT', 5),
    ('Consultant', 'CNS', 6),
    ('Viewer', 'VW', 7)
) AS r(name, abbreviation, sort_order)
WHERE tt.name = 'General'
ON CONFLICT (team_type_id, name) DO NOTHING;
