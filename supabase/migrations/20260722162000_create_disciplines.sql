-- =====================================================
-- DIGA - Create Disciplines Table
-- =====================================================

CREATE TABLE public.disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,

    code TEXT UNIQUE,

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

COMMENT ON TABLE public.disciplines IS
'Reusable disciplines such as Architecture, Structural, Civil, Mechanical, Electrical, Fire, Landscape and Interior Design.';

CREATE INDEX idx_disciplines_name
ON public.disciplines(name);

CREATE INDEX idx_disciplines_code
ON public.disciplines(code);

CREATE INDEX idx_disciplines_sort_order
ON public.disciplines(sort_order);

CREATE TRIGGER disciplines_set_updated_at
BEFORE UPDATE ON public.disciplines
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER disciplines_set_updated_by
BEFORE UPDATE ON public.disciplines
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.disciplines
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view disciplines"
ON public.disciplines
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert disciplines"
ON public.disciplines
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update disciplines"
ON public.disciplines
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete disciplines"
ON public.disciplines
FOR DELETE
TO authenticated
USING (true);