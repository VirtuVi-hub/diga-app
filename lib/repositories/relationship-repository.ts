import { relationships as seedRelationships } from "@/data/relationships";
import { isSameRelationshipNode } from "@/lib/relationship-utils";
import type {
  CreateRelationshipInput,
  Relationship,
  RelationshipNodeRef,
  RelationshipQuery,
} from "@/types/relationship";

export interface RelationshipRepository {
  create(input: CreateRelationshipInput): Promise<Relationship>;
  remove(id: string): Promise<void>;
  query(filter?: RelationshipQuery): Promise<Relationship[]>;
  getEvidence(node: RelationshipNodeRef): Promise<Relationship[]>;
  getImpacts(node: RelationshipNodeRef): Promise<Relationship[]>;
}

let store: Relationship[] = [...seedRelationships];
let sequence = 0;

function nextId() {
  sequence += 1;
  return `relationship-${Date.now()}-${sequence}`;
}

function matchesQuery(relationship: Relationship, filter?: RelationshipQuery): boolean {
  if (!filter) return true;
  if (filter.projectId && relationship.projectId !== filter.projectId) return false;
  if (filter.relationshipType && relationship.relationshipType !== filter.relationshipType) return false;
  if (filter.node && !isSameRelationshipNode(relationship.nodeA, filter.node) && !isSameRelationshipNode(relationship.nodeB, filter.node)) {
    return false;
  }
  return true;
}

export class MockRelationshipRepository implements RelationshipRepository {
  async create(input: CreateRelationshipInput): Promise<Relationship> {
    const relationship: Relationship = {
      id: nextId(),
      projectId: input.projectId,
      nodeA: input.nodeA,
      relationshipType: input.relationshipType,
      nodeB: input.nodeB,
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
    };

    store = [...store, relationship];
    return relationship;
  }

  async remove(id: string): Promise<void> {
    store = store.filter((item) => item.id !== id);
  }

  async query(filter?: RelationshipQuery): Promise<Relationship[]> {
    return store.filter((item) => matchesQuery(item, filter));
  }

  async getEvidence(node: RelationshipNodeRef): Promise<Relationship[]> {
    return store.filter((item) => item.relationshipType === "evidence" && isSameRelationshipNode(item.nodeA, node));
  }

  async getImpacts(node: RelationshipNodeRef): Promise<Relationship[]> {
    return store.filter((item) => item.relationshipType === "impact" && isSameRelationshipNode(item.nodeA, node));
  }
}

export const relationshipRepository: RelationshipRepository = new MockRelationshipRepository();
