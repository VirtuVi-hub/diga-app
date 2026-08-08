-- =====================================================
-- DIGA - Create Project Disciplines Table
-- =====================================================

CREATE TABLE public.project_disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    discipline_id UUID NOT NULL
        REFERENCES public.disciplines(id)
        ON DELETE RESTRICT,

    lead BOOLEAN NOT NULL DEFAULT FALSE,

    notes TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT project_disciplines_unique
        UNIQUE (project_id, discipline_id)
);

COMMENT ON TABLE public.project_disciplines IS
'Associates disciplines with projects.';

CREATE INDEX idx_project_disciplines_project
ON public.project_disciplines(project_id);

CREATE INDEX idx_project_disciplines_discipline
ON public.project_disciplines(discipline_id);

CREATE INDEX idx_project_disciplines_lead
ON public.project_disciplines(lead);

CREATE TRIGGER project_disciplines_set_updated_at
BEFORE UPDATE ON public.project_disciplines
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER project_disciplines_set_updated_by
BEFORE UPDATE ON public.project_disciplines
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.project_disciplines
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project disciplines"
ON public.project_disciplines
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert project disciplines"
ON public.project_disciplines
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update project disciplines"
ON public.project_disciplines
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete project disciplines"
ON public.project_disciplines
FOR DELETE
TO authenticated
USING (true);