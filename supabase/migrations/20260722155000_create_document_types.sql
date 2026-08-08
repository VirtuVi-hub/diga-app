-- =====================================================
-- DIGA - Create Document Types Table
-- =====================================================

CREATE TABLE public.document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,
    description TEXT,

    file_extension TEXT,
    mime_type TEXT,

    icon TEXT,
    color TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE public.document_types IS
'Reusable document type definitions for project files.';

CREATE INDEX idx_document_types_name
ON public.document_types(name);

CREATE INDEX idx_document_types_sort_order
ON public.document_types(sort_order);

CREATE INDEX idx_document_types_extension
ON public.document_types(file_extension);

CREATE TRIGGER document_types_set_updated_at
BEFORE UPDATE ON public.document_types
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER document_types_set_updated_by
BEFORE UPDATE ON public.document_types
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.document_types
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view document types"
ON public.document_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert document types"
ON public.document_types
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update document types"
ON public.document_types
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete document types"
ON public.document_types
FOR DELETE
TO authenticated
USING (true);