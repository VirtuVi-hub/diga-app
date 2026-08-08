import type { KnowledgeObjectType } from "./knowledge-object";

/**
 * Every kind of node the graph can connect. Knowledge Object types are
 * reused directly instead of duplicated, so the graph never needs its own
 * separate enum for Requirement/Decision/Action/Issue/Risk.
 */
export type RelationshipNodeType =
  | KnowledgeObjectType
  | "discussion"
  | "meeting"
  | "drawing"
  | "document"
  | "photo"
  | "video"
  | "reference";

/**
 * How two nodes are connected. Deliberately generic — never entity-specific
 * (no "RequirementToDrawing", etc.). `evidence` and `impact` are directional
 * (nodeA is the subject); `related` is used bidirectionally.
 */
export type RelationshipType = "evidence" | "impact" | "related";

/** A bare reference to any node in the graph, used to query by node. */
export type RelationshipNodeRef = {
  id: string;
  type: RelationshipNodeType;
};

/**
 * A reference to any node in the graph, as stored on a relationship.
 * `label` is a denormalized display string — a mock-data-era substitute for
 * a real cross-entity resolver, so generic UI can render a relationship
 * without knowing how to fetch every possible node type.
 */
export type RelationshipNode = RelationshipNodeRef & {
  label: string;
};

export type Relationship = {
  id: string;
  projectId: string;
  nodeA: RelationshipNode;
  relationshipType: RelationshipType;
  nodeB: RelationshipNode;
  createdAt: string;
  createdBy?: string;
};

export type CreateRelationshipInput = {
  projectId: string;
  nodeA: RelationshipNode;
  relationshipType: RelationshipType;
  nodeB: RelationshipNode;
  createdBy?: string;
};

export type RelationshipQuery = {
  projectId?: string;
  node?: RelationshipNodeRef;
  relationshipType?: RelationshipType;
};
