-- =====================================================
-- DIGA - Create Requirement Categories
-- =====================================================

CREATE TABLE public.requirement_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,

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

COMMENT ON TABLE public.requirement_categories IS
'Reusable categories used to classify project requirements.';

COMMENT ON COLUMN public.requirement_categories.code IS
'Short unique identifier (e.g. CLIENT, SITE, REGULATORY, BUDGET).';

CREATE INDEX idx_requirement_categories_name
ON public.requirement_categories(name);

CREATE INDEX idx_requirement_categories_code
ON public.requirement_categories(code);

CREATE INDEX idx_requirement_categories_sort_order
ON public.requirement_categories(sort_order);

CREATE TRIGGER requirement_categories_set_updated_at
BEFORE UPDATE ON public.requirement_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER requirement_categories_set_updated_by
BEFORE UPDATE ON public.requirement_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.requirement_categories
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view requirement categories"
ON public.requirement_categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert requirement categories"
ON public.requirement_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update requirement categories"
ON public.requirement_categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete requirement categories"
ON public.requirement_categories
FOR DELETE
TO authenticated
USING (true);