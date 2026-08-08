-- =====================================================
-- DIGA - Create Requirement Evidence
-- =====================================================

CREATE TABLE public.requirement_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    requirement_revision_id UUID NOT NULL
        REFERENCES public.requirement_revisions(id)
        ON DELETE CASCADE,

    document_id UUID
        REFERENCES public.documents(id)
        ON DELETE SET NULL,

    evidence_type TEXT NOT NULL,

    title TEXT NOT NULL,

    description TEXT,

    page_reference TEXT,

    excerpt TEXT,

    confidence NUMERIC(5,2),

    verified BOOLEAN NOT NULL DEFAULT FALSE,

    verified_at TIMESTAMPTZ,

    verified_by UUID
        REFERENCES public.people(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT chk_requirement_evidence_type
        CHECK (
            evidence_type IN (
                'Document',
                'Meeting',
                'Email',
                'Photo',
                'Voice Note',
                'Site Visit',
                'AI Extraction',
                'Manual Note'
            )
        ),

    CONSTRAINT chk_requirement_evidence_confidence
        CHECK (
            confidence IS NULL
            OR (confidence >= 0 AND confidence <= 100)
        )
);

COMMENT ON TABLE public.requirement_evidence IS
'Evidence supporting a requirement revision.';

COMMENT ON COLUMN public.requirement_evidence.page_reference IS
'Optional page, sheet, or section reference within the evidence source.';

COMMENT ON COLUMN public.requirement_evidence.excerpt IS
'Relevant quoted or extracted text supporting the requirement.';

CREATE INDEX idx_requirement_evidence_revision
ON public.requirement_evidence(requirement_revision_id);

CREATE INDEX idx_requirement_evidence_document
ON public.requirement_evidence(document_id);

CREATE INDEX idx_requirement_evidence_type
ON public.requirement_evidence(evidence_type);

CREATE INDEX idx_requirement_evidence_verified
ON public.requirement_evidence(verified);

CREATE TRIGGER requirement_evidence_set_updated_at
BEFORE UPDATE
ON public.requirement_evidence
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER requirement_evidence_set_updated_by
BEFORE UPDATE
ON public.requirement_evidence
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.requirement_evidence
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view requirement evidence"
ON public.requirement_evidence
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert requirement evidence"
ON public.requirement_evidence
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update requirement evidence"
ON public.requirement_evidence
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete requirement evidence"
ON public.requirement_evidence
FOR DELETE
TO authenticated
USING (true);