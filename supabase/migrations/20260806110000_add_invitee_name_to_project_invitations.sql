-- =====================================================
-- DIGA - Add Invitee Name to Project Invitations (Sprint 5.8)
-- =====================================================
-- Module 2 "Invitation Experience": the Lead Architect now enters the
-- Main Client's Name alongside their WhatsApp Number/Email when creating
-- an invitation, so the invite share message and the pre-auth landing
-- page (`/invite/[code]`) can greet them by name instead of showing a
-- raw invite code or link. Nullable and optional at the schema level —
-- the invitation flow still works if a name is left blank, same honesty
-- discipline as every other optional field in this table.

ALTER TABLE public.project_invitations
ADD COLUMN invitee_name TEXT;

COMMENT ON COLUMN public.project_invitations.invitee_name IS
'Sprint 5.8, Module 2: the invitee''s display name, entered by whoever creates the invitation. Used only for a friendlier share message/landing page greeting — never required, never validated against the person''s eventual real name.';
