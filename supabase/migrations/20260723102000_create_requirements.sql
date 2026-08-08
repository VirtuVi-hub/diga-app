-- =====================================================
-- DIGA - Create Requirements Table
-- =====================================================

CREATE TABLE public.requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    category_id UUID NOT NULL
        REFERENCES public.requirement_categories(id)
        ON DELETE RESTRICT,

    source_id UUID
        REFERENCES public.requirement_sources(id)
        ON DELETE SET NULL,

    requirement_number TEXT NOT NULL,

    title TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'Draft',

    priority TEXT NOT NULL DEFAULT 'Medium',

    verification_status TEXT NOT NULL DEFAULT 'Unverified',

    owner_id UUID
        REFERENCES public.people(id)
        ON DELETE SET NULL,

    current_revision_id UUID,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT uq_project_requirement_number
        UNIQUE (project_id, requirement_number),

    CONSTRAINT chk_requirement_status
        CHECK (
            status IN (
                'Draft',
                'Under Review',
                'Approved',
                'Rejected',
                'Archived'
            )
        ),

    CONSTRAINT chk_requirement_priority
        CHECK (
            priority IN (
                'Low',
                'Medium',
                'High',
                'Critical'
            )
        ),

    CONSTRAINT chk_requirement_verification
        CHECK (
            verification_status IN (
                'Unverified',
                'Partially Verified',
                'Verified'
            )
        )
);

COMMENT ON TABLE public.requirements IS
'Master record for each project requirement. Requirement content is maintained through revisions.';

COMMENT ON COLUMN public.requirements.requirement_number IS
'Human-readable identifier unique within a project (e.g. R-001).';

COMMENT ON COLUMN public.requirements.current_revision_id IS
'Reference to the latest approved or working revision. Added after requirement_revisions is created.';

CREATE INDEX idx_requirements_project
ON public.requirements(project_id);

CREATE INDEX idx_requirements_category
ON public.requirements(category_id);

CREATE INDEX idx_requirements_source
ON public.requirements(source_id);

CREATE INDEX idx_requirements_owner
ON public.requirements(owner_id);

CREATE INDEX idx_requirements_status
ON public.requirements(status);

CREATE INDEX idx_requirements_priority
ON public.requirements(priority);

CREATE INDEX idx_requirements_active
ON public.requirements(active);

CREATE TRIGGER requirements_set_updated_at
BEFORE UPDATE ON public.requirements
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER requirements_set_updated_by
BEFORE UPDATE ON public.requirements
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.requirements
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view requirements"
ON public.requirements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert requirements"
ON public.requirements
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update requirements"
ON public.requirements
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete requirements"
ON public.requirements
FOR DELETE
TO authenticated
USING (true);