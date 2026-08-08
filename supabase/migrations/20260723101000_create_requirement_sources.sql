-- =====================================================
-- DIGA - Create Requirement Sources
-- =====================================================

CREATE TABLE public.requirement_sources (
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

COMMENT ON TABLE public.requirement_sources IS
'Defines where a requirement originated.';

COMMENT ON COLUMN public.requirement_sources.code IS
'Examples: QUESTIONNAIRE, MEETING, PDF, IMAGE, VIDEO, WHATSAPP, SITE_VISIT, CLIENT_EMAIL.';

CREATE INDEX idx_requirement_sources_name
ON public.requirement_sources(name);

CREATE INDEX idx_requirement_sources_code
ON public.requirement_sources(code);

CREATE INDEX idx_requirement_sources_sort_order
ON public.requirement_sources(sort_order);

CREATE TRIGGER requirement_sources_set_updated_at
BEFORE UPDATE ON public.requirement_sources
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER requirement_sources_set_updated_by
BEFORE UPDATE ON public.requirement_sources
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.requirement_sources
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view requirement sources"
ON public.requirement_sources
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert requirement sources"
ON public.requirement_sources
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update requirement sources"
ON public.requirement_sources
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete requirement sources"
ON public.requirement_sources
FOR DELETE
TO authenticated
USING (true);