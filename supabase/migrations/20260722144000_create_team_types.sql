-- =====================================================
-- DIGA - Create Team Types Table
-- =====================================================

CREATE TABLE public.team_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,
    description TEXT,

    color TEXT NOT NULL DEFAULT '#6B7280',

    sort_order INTEGER NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE public.team_types IS
'Categories used to group project team members.';

CREATE INDEX idx_team_types_sort_order
ON public.team_types(sort_order);

CREATE TRIGGER team_types_set_updated_at
BEFORE UPDATE ON public.team_types
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER team_types_set_updated_by
BEFORE UPDATE ON public.team_types
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.team_types
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view team types"
ON public.team_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert team types"
ON public.team_types
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update team types"
ON public.team_types
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete team types"
ON public.team_types
FOR DELETE
TO authenticated
USING (true);