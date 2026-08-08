-- =====================================================
-- DIGA - Create Firm Invitations
-- =====================================================
-- Module 3 "Invite Team" / Module 2 "Join Firm (invite code placeholder)".
-- A deliberately simple invite-by-code mechanism for this foundation
-- sprint — NOT the fuller "invitation link + Lead Architect review" model
-- docs/architecture/002-authentication-and-authorization.md describes for
-- Project-level assignment. See the Sprint 5.3 doc for why the two differ
-- and how this can evolve toward that fuller model later without a
-- breaking change.

CREATE TABLE public.firm_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    firm_id UUID NOT NULL
        REFERENCES public.firms(id)
        ON DELETE CASCADE,

    email TEXT NOT NULL,

    role_id UUID NOT NULL
        REFERENCES public.roles(id)
        ON DELETE RESTRICT,

    invite_code TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),

    invited_by UUID REFERENCES public.people(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ,

    CONSTRAINT firm_invitations_invite_code_key UNIQUE (invite_code)
);

COMMENT ON TABLE public.firm_invitations IS
'A pending invitation to join a Firm with a specific role. No real email delivery this sprint — the invite code/link is displayed on-screen for the inviter to share manually (Module 1: "Do not implement real email delivery. Architecture only.").';

CREATE INDEX idx_firm_invitations_firm ON public.firm_invitations(firm_id);
CREATE INDEX idx_firm_invitations_email ON public.firm_invitations(lower(email));

ALTER TABLE public.firm_invitations
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view firm invitations"
ON public.firm_invitations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert firm invitations"
ON public.firm_invitations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update firm invitations"
ON public.firm_invitations
FOR UPDATE
TO authenticated
USING (true);
