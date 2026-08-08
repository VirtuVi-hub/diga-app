-- =====================================================
-- DIGA - Create Documents Table
-- =====================================================

CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    deliverable_id UUID
        REFERENCES public.deliverables(id)
        ON DELETE SET NULL,

    document_type_id UUID NOT NULL
        REFERENCES public.document_types(id)
        ON DELETE RESTRICT,

    name TEXT NOT NULL,

    description TEXT,

    version TEXT NOT NULL DEFAULT '1.0',

    original_filename TEXT NOT NULL,

    storage_path TEXT NOT NULL,

    file_extension TEXT,

    mime_type TEXT,

    file_size BIGINT,

    checksum TEXT,

    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE public.documents IS
'Metadata for documents stored in Supabase Storage.';

CREATE INDEX idx_documents_project
ON public.documents(project_id);

CREATE INDEX idx_documents_deliverable
ON public.documents(deliverable_id);

CREATE INDEX idx_documents_document_type
ON public.documents(document_type_id);

CREATE INDEX idx_documents_storage_path
ON public.documents(storage_path);

CREATE INDEX idx_documents_uploaded_at
ON public.documents(uploaded_at);

CREATE TRIGGER documents_set_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER documents_set_updated_by
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.documents
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents"
ON public.documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete documents"
ON public.documents
FOR DELETE
TO authenticated
USING (true);