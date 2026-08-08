/**
 * Firm / Team types (Sprint 5.3). Snake_case, mirroring the Supabase schema
 * directly — the same convention `lib/types/document.ts` already
 * established for real, Postgres-backed domains (as opposed to the
 * camelCase mock-repository types used by the intelligence-engine
 * sprints).
 */

export type Firm = {
  id: string;
  name: string;
  short_name: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  logo_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  invite_code: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Person = {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type FirmMemberStatus = "invited" | "active" | "removed";

export type FirmMember = {
  id: string;
  firm_id: string;
  person_id: string;
  role_id: string;
  status: FirmMemberStatus;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OnboardingRole = {
  id: string;
  name: string;
  abbreviation: string | null;
};

export type FirmMemberWithDetails = FirmMember & {
  person: Pick<Person, "id" | "first_name" | "last_name" | "email" | "phone"> | null;
  role: OnboardingRole | null;
};

export type FirmInvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export type FirmInvitation = {
  id: string;
  firm_id: string;
  email: string;
  role_id: string;
  invite_code: string;
  status: FirmInvitationStatus;
  invited_by: string | null;
  created_at: string;
  accepted_at: string | null;
};

export type FirmInvitationWithRole = FirmInvitation & {
  role: Pick<OnboardingRole, "id" | "name"> | null;
};

export type CreateFirmInput = {
  name: string;
  short_name?: string;
  website?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};
