-- =====================================================
-- DIGA - Create Document Tags Table
-- =====================================================

CREATE TABLE public.document_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
        REFERENCES public.documents(id)
        ON DELETE CASCADE,

    tag_id UUID NOT NULL
        REFERENCES public.tags(id)
        ON DELETE CASCADE,

    notes TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT document_tags_unique
        UNIQUE (document_id, tag_id)
);

COMMENT ON TABLE public.document_tags IS
'Associates reusable tags with documents.';

CREATE INDEX idx_document_tags_document
ON public.document_tags(document_id);

CREATE INDEX idx_document_tags_tag
ON public.document_tags(tag_id);

CREATE TRIGGER document_tags_set_updated_at
BEFORE UPDATE ON public.document_tags
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER document_tags_set_updated_by
BEFORE UPDATE ON public.document_tags
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.document_tags
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view document tags"
ON public.document_tags
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert document tags"
ON public.document_tags
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update document tags"
ON public.document_tags
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete document tags"
ON public.document_tags
FOR DELETE
TO authenticated
USING (true);
