/**
 * Governance Roster types (Sprint 5.7, Modules 10-11). Everything here is
 * the shape of a PURE, read-time computation — `computeGovernanceRoster()`
 * in `governance-roster.ts` — not stored workflow state. Modeled directly
 * on `lib/knowledge-validation/approval-roster.ts`'s
 * `computeApprovalRoster()` pattern.
 */

export type GovernanceRequirementKind = "approver" | "notify";
export type GovernanceTrigger = "always" | "on_impact";

export type GovernanceRule = {
  id: string;
  objectType: string;
  requiredRoleId: string;
  requiredRoleName: string;
  requirementKind: GovernanceRequirementKind;
  trigger: GovernanceTrigger;
  sortOrder: number;
};

/**
 * Module 10: Creator / Required Approvers / Mandatory Notifications /
 * Future Watchers. Never "Optional Approver" — `requirementKind` on the
 * source rule is exactly 'approver' | 'notify'.
 */
export type GovernanceRosterEntry = {
  roleId: string;
  roleName: string;
  personId: string | null;
  personName: string | null;
  /** Set when this entry's authority was exercised (or is currently held) via a Delegation, not the role's default holder. */
  delegatedFrom?: { personId: string; personName: string; delegationId: string };
};

export type GovernanceRoster = {
  creator: { personId: string; personName: string };
  requiredApprovers: GovernanceRosterEntry[];
  mandatoryNotify: GovernanceRosterEntry[];
  /** Module 10: "Future Watchers (foundation only)" — always empty this sprint. The field exists so nothing architecturally blocks the feature later. */
  watchers: GovernanceRosterEntry[];
};
