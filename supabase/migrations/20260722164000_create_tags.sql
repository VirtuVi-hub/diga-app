-- =====================================================
-- DIGA - Create Tags Table
-- =====================================================

CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,

    description TEXT,

    color TEXT,

    icon TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE public.tags IS
'Reusable user-defined tags for classifying projects, documents, deliverables, people, and other entities.';

CREATE INDEX idx_tags_name
ON public.tags(name);

CREATE INDEX idx_tags_sort_order
ON public.tags(sort_order);

CREATE TRIGGER tags_set_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tags_set_updated_by
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.tags
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tags"
ON public.tags
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert tags"
ON public.tags
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update tags"
ON public.tags
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete tags"
ON public.tags
FOR DELETE
TO authenticated
USING (true);