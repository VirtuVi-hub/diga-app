-- =====================================================
-- DIGA - Create Requirement Revisions
-- =====================================================

CREATE TABLE public.requirement_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    requirement_id UUID NOT NULL
        REFERENCES public.requirements(id)
        ON DELETE CASCADE,

    revision_number INTEGER NOT NULL,

    title TEXT NOT NULL,

    requirement_text TEXT NOT NULL,

    rationale TEXT,

    assumptions TEXT,

    acceptance_criteria TEXT,

    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,

    ai_confidence NUMERIC(5,2),

    approved BOOLEAN NOT NULL DEFAULT FALSE,

    approved_at TIMESTAMPTZ,

    approved_by UUID
        REFERENCES public.people(id)
        ON DELETE SET NULL,

    superseded_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT uq_requirement_revision
        UNIQUE (requirement_id, revision_number),

    CONSTRAINT chk_ai_confidence
        CHECK (
            ai_confidence IS NULL
            OR (
                ai_confidence >= 0
                AND ai_confidence <= 100
            )
        )
);

COMMENT ON TABLE public.requirement_revisions IS
'Immutable revisions of project requirements. New revisions are created instead of overwriting existing content.';

COMMENT ON COLUMN public.requirement_revisions.requirement_text IS
'Canonical wording of the requirement for this revision.';

COMMENT ON COLUMN public.requirement_revisions.ai_generated IS
'Indicates whether this revision originated from AI extraction or suggestion.';

COMMENT ON COLUMN public.requirement_revisions.ai_confidence IS
'AI confidence score between 0 and 100.';

CREATE INDEX idx_requirement_revisions_requirement
ON public.requirement_revisions(requirement_id);

CREATE INDEX idx_requirement_revisions_revision
ON public.requirement_revisions(revision_number);

CREATE INDEX idx_requirement_revisions_approved
ON public.requirement_revisions(approved);

CREATE INDEX idx_requirement_revisions_ai_generated
ON public.requirement_revisions(ai_generated);

CREATE TRIGGER requirement_revisions_set_updated_at
BEFORE UPDATE
ON public.requirement_revisions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER requirement_revisions_set_updated_by
BEFORE UPDATE
ON public.requirement_revisions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.requirement_revisions
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view requirement revisions"
ON public.requirement_revisions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert requirement revisions"
ON public.requirement_revisions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update requirement revisions"
ON public.requirement_revisions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete requirement revisions"
ON public.requirement_revisions
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- Link Requirements to Current Revision
-- =====================================================

ALTER TABLE public.requirements
ADD CONSTRAINT fk_requirements_current_revision
FOREIGN KEY (current_revision_id)
REFERENCES public.requirement_revisions(id)
ON DELETE SET NULL;

ALTER TABLE public.requirement_revisions
ADD CONSTRAINT fk_requirement_revisions_superseded_by
FOREIGN KEY (superseded_by)
REFERENCES public.requirement_revisions(id)
ON DELETE SET NULL;