-- =====================================================
-- DIGA - Create Deliverables Table
-- =====================================================

CREATE TABLE public.deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    deliverable_type_id UUID NOT NULL
        REFERENCES public.deliverable_types(id)
        ON DELETE RESTRICT,

    name TEXT NOT NULL,

    description TEXT,

    status TEXT NOT NULL DEFAULT 'Draft',

    version TEXT,

    due_date DATE,

    issue_date DATE,

    file_url TEXT,

    notes TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE public.deliverables IS
'Stores project deliverables such as drawings, reports, specifications, models, and other project outputs.';

CREATE INDEX idx_deliverables_project
ON public.deliverables(project_id);

CREATE INDEX idx_deliverables_type
ON public.deliverables(deliverable_type_id);

CREATE INDEX idx_deliverables_status
ON public.deliverables(status);

CREATE INDEX idx_deliverables_due_date
ON public.deliverables(due_date);

CREATE TRIGGER deliverables_set_updated_at
BEFORE UPDATE ON public.deliverables
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER deliverables_set_updated_by
BEFORE UPDATE ON public.deliverables
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.deliverables
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view deliverables"
ON public.deliverables
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert deliverables"
ON public.deliverables
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update deliverables"
ON public.deliverables
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete deliverables"
ON public.deliverables
FOR DELETE
TO authenticated
USING (true);