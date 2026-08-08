-- =====================================================
-- DIGA - Create Deliverable Types Table
-- =====================================================

CREATE TABLE public.deliverable_types (
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

COMMENT ON TABLE public.deliverable_types IS
'Reusable categories of project deliverables.';

CREATE INDEX idx_deliverable_types_name
ON public.deliverable_types(name);

CREATE INDEX idx_deliverable_types_sort_order
ON public.deliverable_types(sort_order);

CREATE TRIGGER deliverable_types_set_updated_at
BEFORE UPDATE ON public.deliverable_types
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER deliverable_types_set_updated_by
BEFORE UPDATE ON public.deliverable_types
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.deliverable_types
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view deliverable types"
ON public.deliverable_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert deliverable types"
ON public.deliverable_types
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update deliverable types"
ON public.deliverable_types
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete deliverable types"
ON public.deliverable_types
FOR DELETE
TO authenticated
USING (true);