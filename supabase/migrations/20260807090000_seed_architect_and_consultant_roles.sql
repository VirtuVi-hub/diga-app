-- =====================================================
-- DIGA - Seed Architect & Consultant Roles (Sprint 5.9, Module 6)
-- =====================================================
-- Two gaps found while building the One Invitation Engine's role
-- vocabulary (Sprint 5.9's own 15-role example list): a plain "Architect"
-- role does not exist under Design Team (only "Structural Architect" and
-- "Project Architect" do), and no project-level "Consultant" role exists
-- (the only "Consultant" row is under the Firm-level "General" team_type,
-- unreachable via `getProjectRoles()`). Same reuse-the-existing-tables
-- discipline as every prior role-seeding migration
-- (20260806106000_seed_governance_participant_roles.sql).

INSERT INTO public.roles (team_type_id, name, abbreviation, sort_order)
SELECT tt.id, r.name, r.abbreviation, r.sort_order
FROM public.team_types tt
CROSS JOIN (VALUES
    ('Architect', 'Ar.', 20)
) AS r(name, abbreviation, sort_order)
WHERE tt.name = 'Design Team'
ON CONFLICT (team_type_id, name) DO NOTHING;

INSERT INTO public.roles (team_type_id, name, abbreviation, sort_order)
SELECT tt.id, r.name, r.abbreviation, r.sort_order
FROM public.team_types tt
CROSS JOIN (VALUES
    ('Consultant', 'CNS', 7)
) AS r(name, abbreviation, sort_order)
WHERE tt.name = 'Delivery Team'
ON CONFLICT (team_type_id, name) DO NOTHING;
