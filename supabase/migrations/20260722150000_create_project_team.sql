-- =====================================================
-- DIGA - Create Project Team Table
-- =====================================================

CREATE TABLE public.project_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    person_id UUID NOT NULL
        REFERENCES public.people(id)
        ON DELETE CASCADE,

    role_id UUID NOT NULL
        REFERENCES public.roles(id)
        ON DELETE RESTRICT,

    start_date DATE,
    end_date DATE,

    notes TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT project_team_unique_assignment
        UNIQUE (project_id, person_id, role_id)
);

COMMENT ON TABLE public.project_team IS
'Assigns people to projects in a specific role.';

CREATE INDEX idx_project_team_project
ON public.project_team(project_id);

CREATE INDEX idx_project_team_person
ON public.project_team(person_id);

CREATE INDEX idx_project_team_role
ON public.project_team(role_id);

CREATE TRIGGER project_team_set_updated_at
BEFORE UPDATE ON public.project_team
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER project_team_set_updated_by
BEFORE UPDATE ON public.project_team
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.project_team
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project team"
ON public.project_team
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert project team"
ON public.project_team
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update project team"
ON public.project_team
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete project team"
ON public.project_team
FOR DELETE
TO authenticated
USING (true);