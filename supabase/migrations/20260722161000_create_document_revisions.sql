-- =====================================================
-- DIGA - Create Document Revisions Table
-- =====================================================

CREATE TABLE public.document_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
        REFERENCES public.documents(id)
        ON DELETE CASCADE,

    revision TEXT NOT NULL,

    title TEXT,

    description TEXT,

    status TEXT NOT NULL DEFAULT 'Draft',

    issue_date DATE,

    storage_path TEXT NOT NULL,

    original_filename TEXT NOT NULL,

    file_extension TEXT,

    mime_type TEXT,

    file_size BIGINT,

    checksum TEXT,

    is_current BOOLEAN NOT NULL DEFAULT FALSE,

    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT document_revision_unique
        UNIQUE (document_id, revision)
);

COMMENT ON TABLE public.document_revisions IS
'Stores every revision of a document while preserving complete revision history.';

CREATE INDEX idx_document_revisions_document
ON public.document_revisions(document_id);

CREATE INDEX idx_document_revisions_revision
ON public.document_revisions(revision);

CREATE INDEX idx_document_revisions_current
ON public.document_revisions(is_current);

CREATE INDEX idx_document_revisions_issue_date
ON public.document_revisions(issue_date);

CREATE TRIGGER document_revisions_set_updated_at
BEFORE UPDATE ON public.document_revisions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER document_revisions_set_updated_by
BEFORE UPDATE ON public.document_revisions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.document_revisions
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view document revisions"
ON public.document_revisions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert document revisions"
ON public.document_revisions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update document revisions"
ON public.document_revisions
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete document revisions"
ON public.document_revisions
FOR DELETE
TO authenticated
USING (true);
