/**
 * Delegation types (Sprint 5.7, Module 8). Snake_case, mirroring the
 * `delegations` table directly.
 */

export type DelegationStatus = "active" | "revoked" | "expired";

export type Delegation = {
  id: string;
  project_id: string;
  original_authority_person_id: string;
  original_authority_person_name?: string;
  original_authority_role_id: string;
  original_authority_role_name?: string;
  delegate_person_id: string;
  delegate_person_name?: string;
  reason: string;
  start_date: string | null;
  end_date: string | null;
  status: DelegationStatus;
  revoked_at: string | null;
  revoked_by: string | null;
  revocation_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateDelegationInput = {
  projectId: string;
  originalAuthorityPersonId: string;
  originalAuthorityRoleId: string;
  delegatePersonId: string;
  reason: string;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  createdByName: string;
};
