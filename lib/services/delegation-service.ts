import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { DelegationRepository } from "@/lib/repositories/delegation-repository";
import type { CreateDelegationInput, Delegation } from "@/lib/types/delegation";

/**
 * Sprint 5.7, Module 8: Authority & Delegation. Every write here is
 * permanent — `revoke()` never deletes a row, matching Module 8's "every
 * approval must permanently record" requirement.
 */
export class DelegationService {
  static async delegate(input: CreateDelegationInput, delegatePersonName: string): Promise<Delegation> {
    if (!input.reason.trim()) {
      throw new Error("A reason is required to delegate approval authority.");
    }

    const delegation = await DelegationRepository.create(input);

    await publishSafely({
      eventType: EVENT_TYPES.DELEGATION_CREATED,
      actor: { type: "person", id: input.createdByName },
      projectId: input.projectId,
      reason: input.reason,
      metadata: { title: delegatePersonName, delegationId: delegation.id, startDate: input.startDate, endDate: input.endDate },
    });

    return delegation;
  }

  static async revoke(id: string, actorId: string, actorName: string, reason?: string): Promise<Delegation> {
    const delegation = await DelegationRepository.revoke(id, actorId, reason);

    await publishSafely({
      eventType: EVENT_TYPES.DELEGATION_REVOKED,
      actor: { type: "person", id: actorName },
      projectId: delegation.project_id,
      reason,
      metadata: { title: delegation.delegate_person_name, delegationId: delegation.id },
    });

    return delegation;
  }

  static async listByProject(projectId: string): Promise<Delegation[]> {
    return DelegationRepository.listByProject(projectId);
  }

  static async listActiveForPerson(projectId: string, personId: string): Promise<Delegation[]> {
    return DelegationRepository.listActiveForPerson(projectId, personId);
  }
}
