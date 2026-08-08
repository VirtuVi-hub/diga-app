import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { relationshipRepository } from "@/lib/repositories/relationship-repository";
import type {
  CreateRelationshipInput,
  Relationship,
  RelationshipNodeRef,
  RelationshipQuery,
} from "@/types/relationship";

export class RelationshipService {
  static async create(input: CreateRelationshipInput): Promise<Relationship> {
    if (!input.nodeA.id || !input.nodeB.id) {
      throw new Error("Both nodes are required to create a relationship.");
    }

    const relationship = await relationshipRepository.create(input);

    await publishSafely({
      eventType: EVENT_TYPES.RELATIONSHIP_CREATED,
      actor: { type: "person", id: input.createdBy ?? null },
      sourceNode: relationship.nodeA,
      targetNode: relationship.nodeB,
      projectId: relationship.projectId,
      metadata: { relationshipType: relationship.relationshipType },
    });

    return relationship;
  }

  static async remove(id: string): Promise<void> {
    const existing = (await relationshipRepository.query()).find((relationship) => relationship.id === id);

    await relationshipRepository.remove(id);

    if (existing) {
      // `existing.createdBy` is who created the relationship, not who is
      // removing it now — `remove()` has no "who's calling" parameter yet
      // (no UI invokes it today), so the actor is honestly unknown here
      // rather than misattributed to the original creator.
      await publishSafely({
        eventType: EVENT_TYPES.RELATIONSHIP_REMOVED,
        actor: { type: "person", id: null },
        sourceNode: existing.nodeA,
        targetNode: existing.nodeB,
        projectId: existing.projectId,
        metadata: { relationshipType: existing.relationshipType },
      });
    }
  }

  static async query(filter?: RelationshipQuery): Promise<Relationship[]> {
    return relationshipRepository.query(filter);
  }

  static async getEvidence(node: RelationshipNodeRef): Promise<Relationship[]> {
    return relationshipRepository.getEvidence(node);
  }

  static async getImpacts(node: RelationshipNodeRef): Promise<Relationship[]> {
    return relationshipRepository.getImpacts(node);
  }
}
