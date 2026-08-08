/**
 * Project Invitation types (Sprint 5.7, Modules 5-6). Snake_case, mirroring
 * the Supabase schema directly — same convention as `lib/types/firm.ts`'s
 * `FirmInvitation`. Deliberately separate from Firm invitations: "Project
 * invitations are completely separate from Firm invitations" (Module 5).
 */

export type ProjectInvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export type ProjectInvitation = {
  id: string;
  project_id: string;
  invitee_name: string | null;
  email: string | null;
  phone: string | null;
  role_id: string;
  role_name?: string;
  invite_code: string;
  status: ProjectInvitationStatus;
  is_main_client_invite: boolean;
  invited_by: string | null;
  invited_by_name?: string;
  created_at: string;
  accepted_at: string | null;
};

export type InviteProjectMemberInput = {
  projectId: string;
  email?: string;
  phone?: string;
  roleId: string;
  isMainClientInvite?: boolean;
};

/** What the pre-auth `/invite/[code]` landing page needs — a denormalized, read-only projection, never the raw row. */
export type ProjectInvitationLanding = {
  invitation: ProjectInvitation;
  projectId: string;
  projectName: string;
  roleName: string;
  invitedByName: string;
};
