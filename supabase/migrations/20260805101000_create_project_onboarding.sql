-- =====================================================
-- DIGA - Create Project Onboarding (Module 1)
-- =====================================================
-- One row per project, tracking resumable onboarding progress. Deliberately
-- NOT a rigid state machine over the project's own data (project details,
-- team, documents, and questionnaire answers are persisted directly in
-- their own real tables as each step is completed — this table only
-- records WHICH step to resume at and WHEN each step was confirmed done).
--
-- Grants are included directly in this migration, not a follow-up "fix"
-- migration — Sprint 5.3 discovered live that this project's
-- `auto_expose_new_tables` setting means an RLS policy alone is not
-- sufficient; every new table also needs an explicit GRANT, for every role
-- including `service_role`.

CREATE TABLE public.project_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL UNIQUE
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    current_step TEXT NOT NULL DEFAULT 'details'
        CHECK (current_step IN ('details', 'team', 'documents', 'questionnaire', 'summary', 'completed')),

    details_completed_at TIMESTAMPTZ,
    team_completed_at TIMESTAMPTZ,
    documents_completed_at TIMESTAMPTZ,
    questionnaire_completed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Module 5: the deterministically-generated (never LLM-generated —
    -- this codebase has no LLM/AI SDK anywhere) project summary, editable
    -- by the user before confirming.
    summary_text TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_onboarding IS
'Resumable Project Onboarding progress (Sprint 5.4) — one row per project.';

CREATE INDEX idx_project_onboarding_project ON public.project_onboarding(project_id);

CREATE TRIGGER project_onboarding_set_updated_at
BEFORE UPDATE ON public.project_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.project_onboarding
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project onboarding"
ON public.project_onboarding
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert project onboarding"
ON public.project_onboarding
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update project onboarding"
ON public.project_onboarding
FOR UPDATE
TO authenticated
USING (true);

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_onboarding TO authenticated, service_role;
