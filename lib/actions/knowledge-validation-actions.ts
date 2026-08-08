"use server";

import { knowledgeValidationEngine } from "@/lib/knowledge-validation/knowledge-validation-engine";
import { KnowledgeObjectService } from "@/lib/services/knowledge-object-service";

/**
 * Client-callable entry points for the Knowledge Validation Panel (Sprint
 * 4.7). `getKnowledgeValidation` re-assembles the full `KnowledgeValidation`
 * (used both for the page's initial load and to refresh the panel after an
 * action); the four transition actions are thin wrappers over
 * `KnowledgeObjectService`, matching every other action file's role in this
 * codebase — a callable surface over the service layer, no logic of its own.
 */
export async function getKnowledgeValidation(objectId: string) {
  const object = await KnowledgeObjectService.get(objectId);
  if (!object) return null;

  const validation = await knowledgeValidationEngine.assemble(object);
  return { object, validation };
}

export async function requestKnowledgeObjectApproval(id: string, actorId: string, reason?: string) {
  return KnowledgeObjectService.requestApproval(id, actorId, reason);
}

export async function approveKnowledgeObject(id: string, actorId: string, reason?: string) {
  return KnowledgeObjectService.approve(id, actorId, reason);
}

export async function rejectKnowledgeObject(id: string, actorId: string, reason?: string) {
  return KnowledgeObjectService.reject(id, actorId, reason);
}

export async function revokeKnowledgeObjectApproval(id: string, actorId: string, reason?: string) {
  return KnowledgeObjectService.revokeApproval(id, actorId, reason);
}

export async function flagKnowledgeObjectForDiscussion(id: string, actorId: string, reason?: string) {
  return KnowledgeObjectService.flagForDiscussion(id, actorId, reason);
}
