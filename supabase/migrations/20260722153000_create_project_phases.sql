-- =====================================================
-- DIGA - Create Project Phases Table
-- =====================================================

CREATE TABLE public.project_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    description TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE public.project_phases IS
'Reusable project phases such as Concept Design, Schematic Design, Design Development, Construction Documentation, Tender, and Construction Administration.';

CREATE INDEX idx_project_phases_name
ON public.project_phases(name);

CREATE INDEX idx_project_phases_sort_order
ON public.project_phases(sort_order);

CREATE TRIGGER project_phases_set_updated_at
BEFORE UPDATE ON public.project_phases
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER project_phases_set_updated_by
BEFORE UPDATE ON public.project_phases
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.project_phases
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project phases"
ON public.project_phases
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert project phases"
ON public.project_phases
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update project phases"
ON public.project_phases
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete project phases"
ON public.project_phases
FOR DELETE
TO authenticated
USING (true);
