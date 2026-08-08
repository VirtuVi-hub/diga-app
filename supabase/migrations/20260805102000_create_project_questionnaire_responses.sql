-- =====================================================
-- DIGA - Create Project Questionnaire Responses (Module 4)
-- =====================================================
-- One row per question per project — the raw, structured answer. Module 4
-- also requires each substantive answer to become real project Knowledge
-- (a Knowledge Object), not just a form-field row; this table is the
-- resumable-form backing store, and `OnboardingService` additionally calls
-- the unmodified `KnowledgeObjectService.create()` for each answer when the
-- Questionnaire step is confirmed — never a parallel Knowledge store.

CREATE TABLE public.project_questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    question_key TEXT NOT NULL,
    question_label TEXT NOT NULL,
    answer_text TEXT,

    -- Set once this specific answer has been turned into a real Knowledge
    -- Object (`knowledge_object_id` is a mock-repository id, not a
    -- Postgres FK — Knowledge Objects live in the in-memory repository
    -- every intelligence sprint already uses, per "Do NOT duplicate the
    -- Knowledge Graph").
    knowledge_object_id TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT project_questionnaire_responses_unique_question UNIQUE (project_id, question_key)
);

COMMENT ON TABLE public.project_questionnaire_responses IS
'Client Questionnaire answers (Sprint 5.4, Module 4) — one row per question per project.';

CREATE INDEX idx_project_questionnaire_responses_project ON public.project_questionnaire_responses(project_id);

CREATE TRIGGER project_questionnaire_responses_set_updated_at
BEFORE UPDATE ON public.project_questionnaire_responses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.project_questionnaire_responses
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view questionnaire responses"
ON public.project_questionnaire_responses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert questionnaire responses"
ON public.project_questionnaire_responses
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update questionnaire responses"
ON public.project_questionnaire_responses
FOR UPDATE
TO authenticated
USING (true);

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_questionnaire_responses TO authenticated, service_role;
