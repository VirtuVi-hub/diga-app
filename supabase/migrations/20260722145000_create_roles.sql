-- =====================================================
-- DIGA - Create Roles Table
-- =====================================================

CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    team_type_id UUID NOT NULL
        REFERENCES public.team_types(id)
        ON DELETE RESTRICT,

    name TEXT NOT NULL,
    abbreviation TEXT,

    description TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT roles_team_type_name_unique
        UNIQUE (team_type_id, name)
);

COMMENT ON TABLE public.roles IS
'Roles that people can perform within a team type.';

CREATE INDEX idx_roles_team_type
ON public.roles(team_type_id);

CREATE INDEX idx_roles_sort_order
ON public.roles(sort_order);

CREATE TRIGGER roles_set_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER roles_set_updated_by
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.roles
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert roles"
ON public.roles
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update roles"
ON public.roles
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete roles"
ON public.roles
FOR DELETE
TO authenticated
USING (true);