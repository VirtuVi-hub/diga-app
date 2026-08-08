-- =====================================================
-- DIGA - Create Requirement Document Links
-- =====================================================

CREATE TABLE public.requirement_document_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    requirement_revision_id UUID NOT NULL
        REFERENCES public.requirement_revisions(id)
        ON DELETE CASCADE,

    document_id UUID NOT NULL
        REFERENCES public.documents(id)
        ON DELETE CASCADE,

    relationship_type TEXT NOT NULL DEFAULT 'Supports',

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT uq_requirement_document
        UNIQUE (
            requirement_revision_id,
            document_id
        ),

    CONSTRAINT chk_requirement_document_relationship
        CHECK (
            relationship_type IN (
                'Supports',
                'Defines',
                'Verifies',
                'Implements',
                'References',
                'Supersedes'
            )
        )
);

COMMENT ON TABLE public.requirement_document_links IS
'Links requirement revisions to supporting project documents.';

COMMENT ON COLUMN public.requirement_document_links.relationship_type IS
'Describes how the document relates to the requirement revision.';

CREATE INDEX idx_requirement_document_links_revision
ON public.requirement_document_links(requirement_revision_id);

CREATE INDEX idx_requirement_document_links_document
ON public.requirement_document_links(document_id);

CREATE INDEX idx_requirement_document_links_relationship
ON public.requirement_document_links(relationship_type);

CREATE TRIGGER requirement_document_links_set_updated_at
BEFORE UPDATE
ON public.requirement_document_links
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER requirement_document_links_set_updated_by
BEFORE UPDATE
ON public.requirement_document_links
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.requirement_document_links
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view requirement document links"
ON public.requirement_document_links
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert requirement document links"
ON public.requirement_document_links
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update requirement document links"
ON public.requirement_document_links
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete requirement document links"
ON public.requirement_document_links
FOR DELETE
TO authenticated
USING (true);