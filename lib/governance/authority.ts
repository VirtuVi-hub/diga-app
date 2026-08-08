import type { Delegation } from "@/lib/types/delegation";

/**
 * Sprint 5.7, Module 8/9: pure functions over already-fetched Delegation
 * rows — no I/O, no writes. Used both to gate actions (e.g. "may this
 * person Accept the Agreement on the Main Client's behalf?") and to
 * resolve who a Governance Roster role slot actually points at.
 */

function isDelegationActiveOn(delegation: Delegation, asOfDate: string): boolean {
  if (delegation.status !== "active") return false;
  if (delegation.start_date && asOfDate < delegation.start_date) return false;
  if (delegation.end_date && asOfDate > delegation.end_date) return false;
  return true;
}

/**
 * Given the person who natively holds a role (e.g. `projects.main_client_person_id`,
 * or the person holding "Lead Architect" in `project_team`), find whichever
 * delegation (if any) is currently active for them and return the person who
 * should actually act — the delegate if one applies, otherwise the role
 * holder themselves.
 */
export function resolveEffectiveApprover(params: {
  roleHolderPersonId: string | null;
  delegations: Delegation[];
  asOfDate?: string;
}): { personId: string | null; isDelegated: boolean; delegation?: Delegation } {
  const asOfDate = params.asOfDate ?? new Date().toISOString().slice(0, 10);

  if (!params.roleHolderPersonId) {
    return { personId: null, isDelegated: false };
  }

  const activeDelegation = params.delegations.find(
    (delegation) => delegation.original_authority_person_id === params.roleHolderPersonId && isDelegationActiveOn(delegation, asOfDate),
  );

  if (activeDelegation) {
    return { personId: activeDelegation.delegate_person_id, isDelegated: true, delegation: activeDelegation };
  }

  return { personId: params.roleHolderPersonId, isDelegated: false };
}

/**
 * Module 9: gates actions like "Accept Agreement" — true if `personId` IS
 * the role holder, or is their currently-active delegate. Client
 * Representatives do NOT automatically pass this check (they are not the
 * role holder and have no delegation unless one was explicitly created).
 */
export function canActOnBehalfOf(personId: string, roleHolderPersonId: string | null, delegations: Delegation[]): boolean {
  if (!roleHolderPersonId) return false;
  if (personId === roleHolderPersonId) return true;

  const { personId: effectivePersonId } = resolveEffectiveApprover({ roleHolderPersonId, delegations });
  return effectivePersonId === personId;
}
