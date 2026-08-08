import { resolveEffectiveApprover } from "./authority";
import type { Delegation } from "@/lib/types/delegation";
import type { ImpactAnalysis } from "@/lib/impact-engine/impact-engine";
import type { GovernanceRoster, GovernanceRosterEntry, GovernanceRule } from "./governance-types";

export type GovernanceRosterInput = {
  creatorPersonId: string;
  creatorPersonName: string;
  impact: ImpactAnalysis;
  rules: GovernanceRule[];
  delegations: Delegation[];
  projectTeam: { personId: string; name: string; role: string }[];
  mainClientPersonId: string | null;
  mainClientPersonName: string | null;
};

function resolveRoleHolder(
  roleName: string,
  input: Pick<GovernanceRosterInput, "projectTeam" | "mainClientPersonId" | "mainClientPersonName">,
): { personId: string | null; personName: string | null } {
  if (roleName === "Main Client") {
    return { personId: input.mainClientPersonId, personName: input.mainClientPersonName };
  }

  const member = input.projectTeam.find((teamMember) => teamMember.role === roleName);
  return member ? { personId: member.personId, personName: member.name } : { personId: null, personName: null };
}

function resolveEntry(rule: GovernanceRule, input: GovernanceRosterInput): GovernanceRosterEntry {
  const roleHolder = resolveRoleHolder(rule.requiredRoleName, input);
  const effective = resolveEffectiveApprover({ roleHolderPersonId: roleHolder.personId, delegations: input.delegations });

  if (effective.isDelegated && effective.delegation) {
    return {
      roleId: rule.requiredRoleId,
      roleName: rule.requiredRoleName,
      personId: effective.personId,
      personName: effective.delegation.delegate_person_name ?? null,
      delegatedFrom: {
        personId: effective.delegation.original_authority_person_id,
        personName: roleHolder.personName ?? effective.delegation.original_authority_person_name ?? "the original authority",
        delegationId: effective.delegation.id,
      },
    };
  }

  return {
    roleId: rule.requiredRoleId,
    roleName: rule.requiredRoleName,
    personId: roleHolder.personId,
    personName: roleHolder.personName,
  };
}

/**
 * Sprint 5.7, Modules 10-11: "Users never choose approvers manually. Delta
 * determines governance automatically." A pure, read-time function —
 * modeled directly on `computeApprovalRoster()` — recomputed fresh from
 * (creator, object type, impact analysis, governance rules, delegations,
 * project team, main client) every time it's read. Never a stored workflow
 * state: calling this twice for the same inputs always returns the same
 * roster, and a Delegation created after an object exists is reflected the
 * very next time this is called, with no migration or backfill needed.
 *
 * `always` rules are included unconditionally; `on_impact` rules are
 * included only when Impact Analysis found at least one `impact`
 * relationship (see `governance_rules`' own seed-migration comment for the
 * known limitation: this cannot yet distinguish which discipline the
 * impact belongs to, so every `on_impact` role for the object type fires
 * together).
 */
export function computeGovernanceRoster(input: GovernanceRosterInput): GovernanceRoster {
  const applicableRules = input.rules.filter((rule) => rule.trigger === "always" || input.impact.impacts.length > 0);

  const requiredApprovers = applicableRules.filter((rule) => rule.requirementKind === "approver").map((rule) => resolveEntry(rule, input));
  const mandatoryNotify = applicableRules.filter((rule) => rule.requirementKind === "notify").map((rule) => resolveEntry(rule, input));

  return {
    creator: { personId: input.creatorPersonId, personName: input.creatorPersonName },
    requiredApprovers,
    mandatoryNotify,
    // Module 10: "Future Watchers (foundation only)" — never populated this sprint.
    watchers: [],
  };
}
