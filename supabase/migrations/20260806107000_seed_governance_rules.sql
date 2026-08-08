-- =====================================================
-- DIGA - Seed Default Governance Rules (Sprint 5.7, Module 11)
-- =====================================================
-- Default global governance rules, resolved by role name against the
-- already-seeded `roles` table. These are the concrete examples Module 11
-- itself gives: "Client raises Requirement -> Lead Architect required ->
-- Structural Engineer required if structural impact exists" and
-- "Architect raises Drawing Revision -> Client required -> Lead Architect
-- required -> affected consultants required according to impact."
-- "Client required" resolves to the Main Client specifically (Module 9:
-- decision authority belongs to the Main Client, not Client
-- Representatives, by default).

INSERT INTO public.governance_rules (object_type, required_role_id, requirement_kind, trigger, sort_order)
SELECT v.object_type, r.id, v.requirement_kind, v.trigger, v.sort_order
FROM (VALUES
    ('agreement',        'Main Client',         'approver', 'always',    1),

    ('requirement',      'Lead Architect',      'approver', 'always',    1),
    ('requirement',      'Structural Engineer', 'notify',   'on_impact', 2),
    ('requirement',      'MEP Engineer',        'notify',   'on_impact', 3),

    ('constraint',       'Lead Architect',      'approver', 'always',    1),
    ('preference',       'Lead Architect',      'approver', 'always',    1),

    ('decision',         'Lead Architect',      'approver', 'always',    1),

    ('drawing_revision', 'Main Client',         'approver', 'always',    1),
    ('drawing_revision', 'Lead Architect',      'approver', 'always',    2),
    ('drawing_revision', 'Structural Engineer', 'notify',   'on_impact', 3),
    ('drawing_revision', 'MEP Engineer',        'notify',   'on_impact', 4)
) AS v(object_type, role_name, requirement_kind, trigger, sort_order)
JOIN public.roles r ON r.name = v.role_name
ON CONFLICT DO NOTHING;
