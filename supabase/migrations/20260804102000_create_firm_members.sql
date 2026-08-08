-- =====================================================
-- DIGA - Create Firm Members, Remove people.company_id
-- =====================================================
-- docs/database/schema-review.md's own reviewed decision for
-- 20260722143000_create_people.sql: "Remove company_id — a person should
-- not belong directly to a single Firm... Introduce firm_members" (a
-- Person ↓ Firm Membership ↓ Firm model, since one person may belong to
-- multiple Firms — e.g. an external consultant).

ALTER TABLE public.people DROP COLUMN IF EXISTS company_id;

CREATE TABLE public.firm_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    firm_id UUID NOT NULL
        REFERENCES public.firms(id)
        ON DELETE CASCADE,

    person_id UUID NOT NULL
        REFERENCES public.people(id)
        ON DELETE CASCADE,

    role_id UUID NOT NULL
        REFERENCES public.roles(id)
        ON DELETE RESTRICT,

    -- Module 3: "No permissions engine yet. Just role assignment." — status
    -- tracks whether the invitation this membership originated from (if
    -- any) has been accepted yet, not any access-control decision.
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('invited', 'active', 'removed')),

    invited_by UUID REFERENCES public.people(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT firm_members_unique_membership UNIQUE (firm_id, person_id)
);

COMMENT ON TABLE public.firm_members IS
'Firm membership: Person -> Firm Membership -> Firm. A person may belong to multiple firms (docs/architecture/002-authentication-and-authorization.md).';

CREATE INDEX idx_firm_members_firm ON public.firm_members(firm_id);
CREATE INDEX idx_firm_members_person ON public.firm_members(person_id);

CREATE TRIGGER firm_members_set_updated_at
BEFORE UPDATE ON public.firm_members
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.firm_members
ENABLE ROW LEVEL SECURITY;

-- Permissive RLS, matching every other table's current development-stage
-- policy (docs/database/schema-review.md: "suitable only during early
-- development... will later be replaced with membership-based access").
-- Explicitly out of scope for this sprint: "Do NOT build permission
-- management."
CREATE POLICY "Authenticated users can view firm members"
ON public.firm_members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert firm members"
ON public.firm_members
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update firm members"
ON public.firm_members
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete firm members"
ON public.firm_members
FOR DELETE
TO authenticated
USING (true);
