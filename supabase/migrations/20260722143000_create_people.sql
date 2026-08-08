-- =====================================================
-- DIGA - Create People Table
-- =====================================================

CREATE TABLE public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    first_name TEXT NOT NULL,
    last_name  TEXT NOT NULL,

    email TEXT,
    phone TEXT,

    company_id UUID REFERENCES public.companies(id)
        ON DELETE SET NULL,

    notes TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE public.people IS
'People that can participate in projects.';

CREATE INDEX idx_people_last_name
ON public.people(last_name);

CREATE INDEX idx_people_company
ON public.people(company_id);

CREATE TRIGGER people_set_updated_at
BEFORE UPDATE ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER people_set_updated_by
BEFORE UPDATE ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.people
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view people"
ON public.people
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert people"
ON public.people
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update people"
ON public.people
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete people"
ON public.people
FOR DELETE
TO authenticated
USING (true);