-- =====================================================
-- DIGA - Create Delegations (Sprint 5.7)
-- =====================================================
-- Module 8 "Authority & Delegation": authority belongs to a person,
-- responsibility remains with the original role. Approval authority may
-- be delegated (Lead Architect, Main Client, future approvers).
--
-- This is genuinely new, permanent domain state — Original Authority /
-- Delegate / Reason / Period / Revocation is not derivable from anything
-- that already exists in this codebase, unlike Agreement Review (a pure
-- projection over documents + events). Rows are never deleted;
-- `status = 'revoked'` is the only mutation path, satisfying Module 8's
-- "every approval must permanently record" requirement. See
-- docs/architecture/002-authentication-and-authorization.md's "delegated
-- permissions" language, which this table is the first real
-- implementation of.

CREATE TABLE public.delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    original_authority_person_id UUID NOT NULL
        REFERENCES public.people(id)
        ON DELETE RESTRICT,

    original_authority_role_id UUID NOT NULL
        REFERENCES public.roles(id)
        ON DELETE RESTRICT,

    delegate_person_id UUID NOT NULL
        REFERENCES public.people(id)
        ON DELETE RESTRICT,

    reason TEXT NOT NULL,

    start_date DATE,
    end_date DATE,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'revoked', 'expired')),

    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES public.people(id) ON DELETE SET NULL,
    revocation_reason TEXT,

    created_by UUID REFERENCES public.people(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.delegations IS
'Module 8: a permanent, append-only record of delegated approval authority. Every approval made under a delegation records this row''s id in the approval event''s metadata.delegationId, so Original Authority / Delegate / Reason / Period can always be reconstructed for that approval, even after revocation.';

CREATE INDEX idx_delegations_project ON public.delegations(project_id);
CREATE INDEX idx_delegations_delegate ON public.delegations(delegate_person_id);
CREATE INDEX idx_delegations_original_authority ON public.delegations(original_authority_person_id);

CREATE TRIGGER delegations_set_updated_at
BEFORE UPDATE ON public.delegations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.delegations
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view delegations"
ON public.delegations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert delegations"
ON public.delegations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update delegations"
ON public.delegations
FOR UPDATE
TO authenticated
USING (true);

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delegations TO authenticated, service_role;
