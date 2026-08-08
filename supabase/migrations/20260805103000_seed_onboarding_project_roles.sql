-- =====================================================
-- DIGA - Seed Onboarding Project Roles (Module 2)
-- =====================================================
-- Module 2's exact role list, layered onto the EXISTING `team_types`/
-- `roles` tables rather than a parallel vocabulary (the same "reuse the
-- existing participant model" discipline Sprint 5.3 already applied to its
-- own 7 Firm roles). "Lead Architect"/"Structural Architect"/"MEP
-- Engineer"/"Client Representative" already exist, seeded by
-- `20260730100000_seed_samir_vihar_project_team.sql` — Module 2 asks for
-- "Structural Engineer" specifically (a distinct professional title from
-- the pre-existing "Structural Architect"), so it is added as a new role
-- rather than assumed to be a rename of the existing one, which could
-- silently reinterpret already-seeded assignments.
--
-- "Quantity Surveyor"/"Contractor" go into a new "Delivery Team" team
-- type — cost/construction-side roles, conceptually distinct from the
-- design-side "Design Team" and the "Client" team.

INSERT INTO public.roles (team_type_id, name, abbreviation, sort_order)
SELECT tt.id, r.name, r.abbreviation, r.sort_order
FROM public.team_types tt
CROSS JOIN (VALUES
    ('Project Architect', 'P Ar.', 10),
    ('Designer', 'DSN', 11),
    ('Structural Engineer', 'S Eng.', 12),
    ('Landscape Consultant', 'LSC', 13),
    ('Interior Designer', 'INT', 14)
) AS r(name, abbreviation, sort_order)
WHERE tt.name = 'Design Team'
ON CONFLICT (team_type_id, name) DO NOTHING;

INSERT INTO public.team_types (name, description, sort_order)
VALUES ('Delivery Team', 'Cost and construction delivery roles.', 3)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.roles (team_type_id, name, abbreviation, sort_order)
SELECT tt.id, r.name, r.abbreviation, r.sort_order
FROM public.team_types tt
CROSS JOIN (VALUES
    ('Quantity Surveyor', 'QS', 1),
    ('Contractor', 'CTR', 2)
) AS r(name, abbreviation, sort_order)
WHERE tt.name = 'Delivery Team'
ON CONFLICT (team_type_id, name) DO NOTHING;
