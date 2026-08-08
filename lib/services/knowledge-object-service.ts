import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { knowledgeObjectRepository } from "@/lib/repositories/knowledge-object-repository";
import { knowledgeObjectTypeOrder } from "@/lib/knowledge-object-types";
import type {
  CreateKnowledgeObjectInput,
  KnowledgeObject,
  KnowledgeObjectType,
  ReviseKnowledgeObjectInput,
  ValidationState,
} from "@/types/knowledge-object";

type ValidationAction = "requested" | "granted" | "rejected" | "revoked" | "discussion_requested";

/** One event type per validation transition (Sprint 4.7; `discussion_requested` added Sprint 4.9) — see `EVENT_TYPES`. */
const VALIDATION_EVENT_TYPES: Record<ValidationAction, string> = {
  requested: EVENT_TYPES.APPROVAL_REQUESTED,
  granted: EVENT_TYPES.APPROVAL_GRANTED,
  rejected: EVENT_TYPES.APPROVAL_REJECTED,
  revoked: EVENT_TYPES.APPROVAL_REVOKED,
  discussion_requested: EVENT_TYPES.APPROVAL_DISCUSSION_REQUESTED,
};

const VALIDATION_STATE_BY_ACTION: Record<ValidationAction, ValidationState> = {
  requested: "pending",
  granted: "approved",
  rejected: "rejected",
  revoked: "revoked",
  discussion_requested: "needs_discussion",
};

export class KnowledgeObjectService {
  static async listAll(): Promise<KnowledgeObject[]> {
    return knowledgeObjectRepository.listAll();
  }

  static async listByDiscussion(discussionId: string): Promise<KnowledgeObject[]> {
    return knowledgeObjectRepository.listByDiscussion(discussionId);
  }

  static async countsByDiscussion(discussionId: string): Promise<Record<KnowledgeObjectType, number>> {
    const objects = await knowledgeObjectRepository.listByDiscussion(discussionId);

    const counts = Object.fromEntries(
      knowledgeObjectTypeOrder.map((type) => [type, 0]),
    ) as Record<KnowledgeObjectType, number>;

    for (const object of objects) {
      counts[object.type] += 1;
    }

    return counts;
  }

  static async get(id: string): Promise<KnowledgeObject | null> {
    return knowledgeObjectRepository.get(id);
  }

  static async create(input: CreateKnowledgeObjectInput): Promise<KnowledgeObject> {
    if (!input.title.trim()) {
      throw new Error("Title is required.");
    }

    const object = await knowledgeObjectRepository.create(input);

    await publishSafely({
      eventType: EVENT_TYPES.KNOWLEDGE_OBJECT_CREATED,
      actor: { type: "person", id: input.createdBy },
      sourceNode: { id: object.id, type: object.type },
      projectId: object.projectId,
      // Notification Foundation (Sprint 4.9): captures who was on the notify
      // list at the moment this fact occurred — no delivery mechanism, just
      // an honest record of who *should* have been told.
      metadata: { title: object.title, knowledgeObjectType: object.type, notify: object.notify ?? [] },
    });

    return object;
  }

  static async revise(id: string, input: ReviseKnowledgeObjectInput): Promise<KnowledgeObject> {
    if (!input.title.trim()) {
      throw new Error("Title is required.");
    }

    const object = await knowledgeObjectRepository.revise(id, input);

    await publishSafely({
      eventType: EVENT_TYPES.KNOWLEDGE_OBJECT_UPDATED,
      actor: { type: "person", id: input.createdBy },
      sourceNode: { id: object.id, type: object.type },
      projectId: object.projectId,
      metadata: { title: object.title, revisionNumber: object.revisions.length, notify: object.notify ?? [] },
    });

    return object;
  }

  static async relinkDiscussion(id: string, discussionId: string): Promise<KnowledgeObject> {
    return knowledgeObjectRepository.relinkDiscussion(id, discussionId);
  }

  /**
   * Knowledge Validation & Approval Intelligence (Sprint 4.7). A real
   * Knowledge Graph write (`validationState`, a generic axis independent of
   * the type-specific `status` lifecycle) plus a matching Event, in one call
   * — the same "real write + `publishSafely`" shape `create()`/`revise()`
   * above already use. No transition-validity gating: every action is
   * always available regardless of current `validationState`, deliberately
   * — that would be the multi-stage workflow logic this sprint excludes.
   */
  private static async transitionValidation(
    id: string,
    action: ValidationAction,
    actorId: string,
    reason?: string,
  ): Promise<KnowledgeObject> {
    const validationState = VALIDATION_STATE_BY_ACTION[action];
    const object = await knowledgeObjectRepository.setValidationState(id, validationState);

    await publishSafely({
      eventType: VALIDATION_EVENT_TYPES[action],
      actor: { type: "person", id: actorId },
      sourceNode: { id: object.id, type: object.type },
      projectId: object.projectId,
      reason,
      metadata: { title: object.title, knowledgeObjectType: object.type, validationState, reason, notify: object.notify ?? [] },
    });

    return object;
  }

  static async requestApproval(id: string, actorId: string, reason?: string): Promise<KnowledgeObject> {
    return KnowledgeObjectService.transitionValidation(id, "requested", actorId, reason);
  }

  static async approve(id: string, actorId: string, reason?: string): Promise<KnowledgeObject> {
    return KnowledgeObjectService.transitionValidation(id, "granted", actorId, reason);
  }

  static async reject(id: string, actorId: string, reason?: string): Promise<KnowledgeObject> {
    return KnowledgeObjectService.transitionValidation(id, "rejected", actorId, reason);
  }

  static async revokeApproval(id: string, actorId: string, reason?: string): Promise<KnowledgeObject> {
    return KnowledgeObjectService.transitionValidation(id, "revoked", actorId, reason);
  }

  /** Approval Workflow Foundation (Sprint 4.9) — the 5th, real, human-triggered transition. See `ValidationState`'s own doc comment. */
  static async flagForDiscussion(id: string, actorId: string, reason?: string): Promise<KnowledgeObject> {
    return KnowledgeObjectService.transitionValidation(id, "discussion_requested", actorId, reason);
  }
}
