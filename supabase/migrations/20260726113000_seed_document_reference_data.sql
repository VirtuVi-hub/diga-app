-- =====================================================
-- DIGA - Seed Document Reference Data
-- =====================================================

---------------------------------------------------------
-- Document Types
---------------------------------------------------------

INSERT INTO public.document_types (
    name,
    description,
    active
)
VALUES
(
    'Agreement',
    'Contracts, MoUs and agreements.',
    TRUE
),
(
    'Drawing',
    'Architectural and engineering drawings.',
    TRUE
),
(
    'Specification',
    'Technical specifications.',
    TRUE
),
(
    'Meeting Minutes',
    'Meeting records and minutes.',
    TRUE
),
(
    'Report',
    'Reports and studies.',
    TRUE
),
(
    'Site Photograph',
    'Site photographs and images.',
    TRUE
),
(
    'Permit',
    'Government approvals and permits.',
    TRUE
),
(
    'Other',
    'Other project documents.',
    TRUE
);

---------------------------------------------------------
-- Document Statuses
---------------------------------------------------------

INSERT INTO public.document_statuses (
    name,
    code,
    description,
    sort_order,
    active
)
VALUES
(
    'Draft',
    'DRAFT',
    'Initial working revision.',
    1,
    TRUE
),
(
    'Under Review',
    'UNDER_REVIEW',
    'Revision is under review.',
    2,
    TRUE
),
(
    'Approved',
    'APPROVED',
    'Revision has been approved.',
    3,
    TRUE
),
(
    'Superseded',
    'SUPERSEDED',
    'Revision has been replaced.',
    4,
    TRUE
);
