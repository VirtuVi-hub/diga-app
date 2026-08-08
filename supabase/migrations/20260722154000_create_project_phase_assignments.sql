-- =====================================================
-- DIGA - Create Project Phase Assignments Table
-- =====================================================

CREATE TABLE public.project_phase_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    project_phase_id UUID NOT NULL
        REFERENCES public.project_phases(id)
        ON DELETE RESTRICT,

    status TEXT NOT NULL DEFAULT 'Not Started',

    planned_start_date DATE,
    planned_end_date DATE,

    actual_start_date DATE,
    actual_end_date DATE,

    notes TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT project_phase_assignment_unique
        UNIQUE (project_id, project_phase_id)
);

COMMENT ON TABLE public.project_phase_assignments IS
'Tracks which phases belong to a project and their progress.';

CREATE INDEX idx_project_phase_assignments_project
ON public.project_phase_assignments(project_id);

CREATE INDEX idx_project_phase_assignments_phase
ON public.project_phase_assignments(project_phase_id);

CREATE INDEX idx_project_phase_assignments_status
ON public.project_phase_assignments(status);

CREATE TRIGGER project_phase_assignments_set_updated_at
BEFORE UPDATE ON public.project_phase_assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER project_phase_assignments_set_updated_by
BEFORE UPDATE ON public.project_phase_assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.project_phase_assignments
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project phase assignments"
ON public.project_phase_assignments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert project phase assignments"
ON public.project_phase_assignments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update project phase assignments"
ON public.project_phase_assignments
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete project phase assignments"
ON public.project_phase_assignments
FOR DELETE
TO authenticated
USING (true);