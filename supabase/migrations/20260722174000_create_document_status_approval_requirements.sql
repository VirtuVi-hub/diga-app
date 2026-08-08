-- =====================================================
-- DIGA - Create Document Status Approval Requirements
-- =====================================================

CREATE TABLE public.document_status_approval_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_status_id UUID NOT NULL,
    role_id UUID NOT NULL,

    approval_order INTEGER NOT NULL DEFAULT 1,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT fk_dsar_document_status
        FOREIGN KEY (document_status_id)
        REFERENCES public.document_statuses(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_dsar_role
        FOREIGN KEY (role_id)
        REFERENCES public.roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_dsar_status_role
        UNIQUE (document_status_id, role_id)
);

COMMENT ON TABLE public.document_status_approval_requirements IS
'Defines which roles are required to approve each document status.';

CREATE INDEX idx_dsar_document_status
ON public.document_status_approval_requirements(document_status_id);

CREATE INDEX idx_dsar_role
ON public.document_status_approval_requirements(role_id);

CREATE INDEX idx_dsar_order
ON public.document_status_approval_requirements(approval_order);

CREATE TRIGGER document_status_approval_requirements_set_updated_at
BEFORE UPDATE ON public.document_status_approval_requirements
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER document_status_approval_requirements_set_updated_by
BEFORE UPDATE ON public.document_status_approval_requirements
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.document_status_approval_requirements
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approval requirements"
ON public.document_status_approval_requirements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert approval requirements"
ON public.document_status_approval_requirements
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update approval requirements"
ON public.document_status_approval_requirements
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete approval requirements"
ON public.document_status_approval_requirements
FOR DELETE
TO authenticated
USING (true);