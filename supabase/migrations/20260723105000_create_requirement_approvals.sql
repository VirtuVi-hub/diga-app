-- =====================================================
-- DIGA - Create Requirement Approvals
-- =====================================================

CREATE TABLE public.requirement_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    requirement_revision_id UUID NOT NULL
        REFERENCES public.requirement_revisions(id)
        ON DELETE CASCADE,

    approver_id UUID NOT NULL
        REFERENCES public.people(id)
        ON DELETE RESTRICT,

    approval_status TEXT NOT NULL DEFAULT 'Pending',

    comments TEXT,

    approved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT chk_requirement_approval_status
        CHECK (
            approval_status IN (
                'Pending',
                'Approved',
                'Rejected',
                'Superseded'
            )
        ),

    CONSTRAINT uq_requirement_approver
        UNIQUE (
            requirement_revision_id,
            approver_id
        )
);

COMMENT ON TABLE public.requirement_approvals IS
'Approval workflow for requirement revisions.';

COMMENT ON COLUMN public.requirement_approvals.comments IS
'Reviewer comments supporting approval or rejection.';

CREATE INDEX idx_requirement_approvals_revision
ON public.requirement_approvals(requirement_revision_id);

CREATE INDEX idx_requirement_approvals_approver
ON public.requirement_approvals(approver_id);

CREATE INDEX idx_requirement_approvals_status
ON public.requirement_approvals(approval_status);

CREATE TRIGGER requirement_approvals_set_updated_at
BEFORE UPDATE
ON public.requirement_approvals
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER requirement_approvals_set_updated_by
BEFORE UPDATE
ON public.requirement_approvals
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_by();

ALTER TABLE public.requirement_approvals
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view requirement approvals"
ON public.requirement_approvals
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert requirement approvals"
ON public.requirement_approvals
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update requirement approvals"
ON public.requirement_approvals
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete requirement approvals"
ON public.requirement_approvals
FOR DELETE
TO authenticated
USING (true);