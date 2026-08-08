-- =====================================================
-- DIGA - Seed Governance Participant Roles (Sprint 5.7, Module 7)
-- =====================================================
-- Module 7's remaining participant categories, layered onto the EXISTING
-- `team_types`/`roles` tables (same "reuse the existing participant
-- model" discipline as every prior role-seeding migration), rather than
-- lib/requirement-roles.ts's disconnected hardcoded-array pattern.
--
-- Already seeded and reused, NOT re-added here: Lead Architect,
-- Structural Architect, MEP Engineer, Client Representative
-- (20260730100000), Project Architect, Designer, Structural Engineer,
-- Landscape Consultant, Interior Designer (20260805103000), Quantity
-- Surveyor, Contractor (20260805103000).
--
-- "Landscape Architect" is added as a role distinct from the
-- already-seeded "Landscape Consultant" — a different professional title
-- Module 7 asks for by name, not a rename (same caution the
-- 20260805103000 migration's own comment already established for
-- "Structural Engineer" vs "Structural Architect").

INSERT INTO public.roles (team_type_id, name, abbreviation, sort_order)
SELECT tt.id, r.name, r.abbreviation, r.sort_order
FROM public.team_types tt
CROSS JOIN (VALUES
    ('Main Client', 'MC', 0)
) AS r(name, abbreviation, sort_order)
WHERE tt.name = 'Client'
ON CONFLICT (team_type_id, name) DO NOTHING;

INSERT INTO public.roles (team_type_id, name, abbreviation, sort_order)
SELECT tt.id, r.name, r.abbreviation, r.sort_order
FROM public.team_types tt
CROSS JOIN (VALUES
    ('Junior Architect', 'J Ar.', 15),
    ('Intern', 'INTN', 16),
    ('Landscape Architect', 'LSA', 17),
    ('Fire Consultant', 'FC', 18),
    ('Lighting Consultant', 'LC', 19)
) AS r(name, abbreviation, sort_order)
WHERE tt.name = 'Design Team'
ON CONFLICT (team_type_id, name) DO NOTHING;

INSERT INTO public.roles (team_type_id, name, abbreviation, sort_order)
SELECT tt.id, r.name, r.abbreviation, r.sort_order
FROM public.team_types tt
CROSS JOIN (VALUES
    ('PMC', 'PMC', 3),
    ('Site Engineer', 'S Eng.', 4),
    ('Supervisor', 'SUP', 5),
    ('Vendor', 'VND', 6)
) AS r(name, abbreviation, sort_order)
WHERE tt.name = 'Delivery Team'
ON CONFLICT (team_type_id, name) DO NOTHING;
