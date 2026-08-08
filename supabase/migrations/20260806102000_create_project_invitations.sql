-- =====================================================
-- DIGA - Create Project Invitations (Sprint 5.7)
-- =====================================================
-- Module 6 "Invitations": project invitations are completely separate
-- from Firm invitations ("A person may belong to many projects. Project
-- invitations are completely separate from Firm invitations."). Direct
-- project-scoped mirror of `firm_invitations` (same code/status/invited_by
-- shape) extended with `phone` and `is_main_client_invite`, since Module 6
-- primarily supports WhatsApp/SMS sharing (a phone-carried invite, not
-- necessarily an email) and Module 1 needs to mark the Main Client
-- invitation specifically.
--
-- Registration happens AFTER invitation (Module 6: "Users do not discover
-- projects. Projects invite users.") — this table, not a public directory,
-- is the only way a person is offered project access.
--
-- No real multi-channel delivery infrastructure this sprint (matching
-- firm_invitations' own "no real email delivery" scope) — WhatsApp/SMS/
-- Email are client-constructed deep links around the `invite_code`/URL.

CREATE TABLE public.project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    email TEXT,
    phone TEXT,

    role_id UUID NOT NULL
        REFERENCES public.roles(id)
        ON DELETE RESTRICT,

    invite_code TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),

    is_main_client_invite BOOLEAN NOT NULL DEFAULT FALSE,

    invited_by UUID REFERENCES public.people(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ,

    CONSTRAINT project_invitations_invite_code_key UNIQUE (invite_code),
    CONSTRAINT project_invitations_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

COMMENT ON TABLE public.project_invitations IS
'A pending invitation to join a Project with a specific role (Sprint 5.7, Module 6). Separate from firm_invitations by design — Project Membership and Firm Membership are independent (Module 5). is_main_client_invite marks the one invitation that, on acceptance, sets projects.main_client_person_id (Module 9).';

CREATE INDEX idx_project_invitations_project ON public.project_invitations(project_id);
CREATE INDEX idx_project_invitations_email ON public.project_invitations(lower(email));

ALTER TABLE public.project_invitations
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project invitations"
ON public.project_invitations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert project invitations"
ON public.project_invitations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update project invitations"
ON public.project_invitations
FOR UPDATE
TO authenticated
USING (true);

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_invitations TO authenticated, service_role;
