-- =====================================================
-- DIGA - Create Project Tags Table
-- =====================================================

CREATE TABLE public.project_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    tag_id UUID NOT NULL
        REFERENCES public.tags(id)
        ON DELETE CASCADE,

    notes TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT project_tags_unique
        UNIQUE (project_id, tag_id)
);

COMMENT ON TABLE public.project_tags IS
'Associates reusable tags with projects.';

CREATE INDEX idx_project_tags_project
ON public.project_tags(project_id);

CREATE INDEX idx_project_tags_tag
ON public.project_tags(tag_id);

CREATE TRIGGER project_tags_set_updated_at
BEFORE UPDATE ON public.project_tags
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER project_tags_set_updated_by
BEFORE UPDATE ON public.project_tags
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.project_tags
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project tags"
ON public.project_tags
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert project tags"
ON public.project_tags
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update project tags"
ON public.project_tags
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete project tags"
ON public.project_tags
FOR DELETE
TO authenticated
USING (true);