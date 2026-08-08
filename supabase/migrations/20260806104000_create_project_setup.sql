-- =====================================================
-- DIGA - Create Project Setup (Sprint 5.7, Modules 12-14)
-- =====================================================
-- Replaces `project_onboarding` (Sprint 5.4) as the resumable-progress
-- table for the post-Agreement-acceptance phase of the project lifecycle.
-- Structurally the same pattern as `project_onboarding` (one row per
-- project, `current_step` records where to resume, `*_completed_at`
-- columns record when each step was confirmed done — deliberately NOT a
-- rigid state machine over the project's own data), but a new,
-- incompatible step vocabulary (Team/Consultants/Client Representatives/
-- Import/Questionnaire/Review, replacing Details/Team/Documents/
-- Questionnaire/Summary), so it is a new table rather than an ALTER of
-- `project_onboarding`'s CHECK constraint.
--
-- `review_completed_at` is Module 14's "Lead Architect confirms Delta's
-- understanding is correct" — explicitly NOT project approval, just
-- confirmation that the project's knowledge was initialized correctly.
-- `understanding_text` is the deterministic (never LLM-generated — this
-- codebase has no LLM/AI SDK anywhere) Project Understanding narrative,
-- same pattern as `project_onboarding.summary_text`.

CREATE TABLE public.project_setup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL UNIQUE
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    current_step TEXT NOT NULL DEFAULT 'team'
        CHECK (current_step IN (
            'team',
            'consultants',
            'client_representatives',
            'import',
            'questionnaire',
            'review',
            'completed'
        )),

    team_completed_at TIMESTAMPTZ,
    consultants_completed_at TIMESTAMPTZ,
    client_representatives_completed_at TIMESTAMPTZ,
    import_completed_at TIMESTAMPTZ,
    questionnaire_completed_at TIMESTAMPTZ,
    review_completed_at TIMESTAMPTZ,

    discussion_id TEXT,
    understanding_text TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_setup IS
'Resumable Project Setup progress (Sprint 5.7, Modules 12-14) — one row per project. Supersedes project_onboarding, which is retained for historical record but no longer written to.';

COMMENT ON COLUMN public.project_setup.discussion_id IS
'Points into the Discussion mock repository (types/discussion.ts), same non-FK TEXT convention as project_onboarding.discussion_id, since Discussions are not yet a Postgres table.';

CREATE INDEX idx_project_setup_project ON public.project_setup(project_id);

CREATE TRIGGER project_setup_set_updated_at
BEFORE UPDATE ON public.project_setup
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.project_setup
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project setup"
ON public.project_setup
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert project setup"
ON public.project_setup
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update project setup"
ON public.project_setup
FOR UPDATE
TO authenticated
USING (true);

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_setup TO authenticated, service_role;
