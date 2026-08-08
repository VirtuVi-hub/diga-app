"use server";

import { getCurrentPerson } from "@/lib/auth/current-person";
import { createKnowledgeObject } from "@/lib/actions/knowledge-object-actions";
import { listProjectTeam, getProjectMainClient } from "@/lib/actions/project-actions";
import { listProjectDelegations } from "@/lib/actions/delegation-actions";
import { GovernanceRulesRepository } from "@/lib/governance/governance-rules-repository";
import { computeGovernanceRoster } from "@/lib/governance/governance-roster";
import { analyzeLabelImpact, analyzeNodeImpact } from "@/lib/impact-engine/impact-engine";
import type { GovernanceRoster } from "@/lib/governance/governance-types";
import type { CreateKnowledgeObjectInput } from "@/types/knowledge-object";
import type { RelationshipNodeRef } from "@/types/relationship";

/**
 * Sprint 5.7, Modules 10-11: the one place every governance-aware feature
 * (Knowledge Object creation, Agreement Review, Drawing Revision Issues)
 * asks "who is required to approve, and who must be notified?" Always a
 * fresh, live computation (`computeGovernanceRoster` is a pure function) —
 * never a cached/stored answer, so a Delegation created a minute ago is
 * already reflected.
 */
export async function getGovernanceRoster(params: {
  projectId: string;
  objectType: string;
  creatorPersonId: string;
  creatorPersonName: string;
  node?: RelationshipNodeRef;
  text?: string;
}): Promise<GovernanceRoster> {
  const [rules, delegations, projectTeam, mainClient] = await Promise.all([
    GovernanceRulesRepository.listActiveRules(params.objectType),
    listProjectDelegations(params.projectId),
    listProjectTeam(params.projectId),
    getProjectMainClient(params.projectId),
  ]);

  const impact = params.node
    ? await analyzeNodeImpact({ id: params.node.id, type: params.node.type, projectId: params.projectId, text: params.text ?? "" })
    : await analyzeLabelImpact({ elementLabel: params.text ?? "", scopes: [{ level: "project", projectId: params.projectId }] });

  return computeGovernanceRoster({
    creatorPersonId: params.creatorPersonId,
    creatorPersonName: params.creatorPersonName,
    impact,
    rules,
    delegations,
    projectTeam: projectTeam.map((member) => ({ personId: member.personId, name: member.name, role: member.role })),
    mainClientPersonId: mainClient.personId,
    mainClientPersonName: mainClient.personName,
  });
}

/**
 * Module 11: "Users never choose approvers manually." The write-time
 * counterpart of `createKnowledgeObject` — computes the Governance Roster
 * once at creation and snapshots it into the object's existing
 * `approvalRequiredFrom`/`notify` fields (so `computeApprovalRoster()`, the
 * Knowledge Validation Panel, etc. keep working unmodified), while the
 * live roster remains the source of truth for display everywhere else.
 * `KnowledgeObjectModal.tsx` calls this instead of `createKnowledgeObject`
 * directly, and no longer collects approver/notify input from the user.
 */
export async function raiseGovernedKnowledgeObject(input: Omit<CreateKnowledgeObjectInput, "approvalRequiredFrom" | "notify">) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to raise this.");

  const creatorPersonName = `${person.first_name} ${person.last_name}`.trim();

  const roster = await getGovernanceRoster({
    projectId: input.projectId,
    objectType: input.type,
    creatorPersonId: input.createdBy,
    creatorPersonName,
    text: `${input.title} ${input.description}`,
  });

  return createKnowledgeObject({
    ...input,
    approvalRequiredFrom: roster.requiredApprovers.map((entry) => entry.personName ?? entry.roleName),
    notify: roster.mandatoryNotify.map((entry) => entry.personName ?? entry.roleName),
  });
}
