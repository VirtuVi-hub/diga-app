-- =====================================================
-- DIGA - Seed Project Team for Samir Vihar (demo/test project)
-- =====================================================

WITH new_team_types AS (
    INSERT INTO public.team_types (name, description, sort_order)
    VALUES
        ('Design Team', 'Architects and engineering consultants.', 1),
        ('Client', 'Client-side stakeholders.', 2)
    RETURNING id, name
),
new_roles AS (
    INSERT INTO public.roles (team_type_id, name, abbreviation, sort_order)
    SELECT tt.id, r.name, r.abbreviation, r.sort_order
    FROM (VALUES
        ('Design Team', 'Lead Architect', 'L Ar.', 1),
        ('Design Team', 'Structural Architect', 'S Ar.', 2),
        ('Design Team', 'MEP Engineer', 'MEP', 3),
        ('Client', 'Client Representative', 'CL', 1)
    ) AS r(team_type_name, name, abbreviation, sort_order)
    JOIN new_team_types tt ON tt.name = r.team_type_name
    RETURNING id, name
),
new_people AS (
    INSERT INTO public.people (first_name, last_name, email)
    VALUES
        ('Maya', 'Chen', 'maya.chen@example.com'),
        ('Omar', 'Vale', 'omar.vale@example.com'),
        ('Priya', 'Nair', 'priya.nair@example.com'),
        ('David', 'Roth', 'david.roth@example.com'),
        ('Rafael', 'Mendes', 'rafael.mendes@example.com')
    RETURNING id, first_name, last_name
)
INSERT INTO public.project_team (project_id, person_id, role_id, active)
SELECT '3c2384a0-bc60-4116-ba8c-5f1f52eedb42'::uuid, p.id, r.id, true
FROM (VALUES
    ('Maya', 'Chen', 'Lead Architect'),
    ('Omar', 'Vale', 'Structural Architect'),
    ('Priya', 'Nair', 'MEP Engineer'),
    ('David', 'Roth', 'Client Representative'),
    ('Rafael', 'Mendes', 'Client Representative')
) AS assign(first_name, last_name, role_name)
JOIN new_people p ON p.first_name = assign.first_name AND p.last_name = assign.last_name
JOIN new_roles r ON r.name = assign.role_name;
