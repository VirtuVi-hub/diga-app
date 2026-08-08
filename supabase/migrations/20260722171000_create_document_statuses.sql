-- =====================================================
-- DIGA - Create Document Statuses Table
-- =====================================================

CREATE TABLE public.document_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,

    description TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    requires_lead_architect_approval BOOLEAN NOT NULL DEFAULT FALSE,
    requires_client_approval BOOLEAN NOT NULL DEFAULT FALSE,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE public.document_statuses IS
'Defines the workflow statuses for document revisions.';

CREATE INDEX idx_document_statuses_name
ON public.document_statuses(name);

CREATE INDEX idx_document_statuses_code
ON public.document_statuses(code);

CREATE INDEX idx_document_statuses_sort_order
ON public.document_statuses(sort_order);

CREATE TRIGGER document_statuses_set_updated_at
BEFORE UPDATE ON public.document_statuses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER document_statuses_set_updated_by
BEFORE UPDATE ON public.document_statuses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.document_statuses
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view document statuses"
ON public.document_statuses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert document statuses"
ON public.document_statuses
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update document statuses"
ON public.document_statuses
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete document statuses"
ON public.document_statuses
FOR DELETE
TO authenticated
USING (true);
