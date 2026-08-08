import { relationshipNodeTypeConfig } from "@/lib/relationship-types";
import type { Evidence } from "@/types/evidence";
import type { Relationship, RelationshipNode, RelationshipNodeRef, RelationshipNodeType, RelationshipType } from "@/types/relationship";

export function isSameRelationshipNode(a: RelationshipNodeRef, b: RelationshipNodeRef): boolean {
  return a.id === b.id && a.type === b.type;
}

/**
 * Reverses `relationshipNodeTypeConfig`'s `type → label` map. Safe because
 * `Evidence.type` is always set FROM that exact config in the first place
 * (`evidence-engine.ts`'s `toEvidence()`), and every label in it is unique —
 * this is a deterministic un-reshape, not a fuzzy guess. Extracted (Sprint
 * 5.1) out of `lib/revision-intelligence/revision-orchestrator.ts`, its
 * original sole caller, once `lib/drawing-intelligence/drawing-orchestrator.ts`
 * needed the exact same reshape — a pure, behavior-preserving refactor,
 * matching the `nodeHref()`/`suggestReviewers()` extraction precedent
 * (Sprint 4.8).
 */
const NODE_TYPE_BY_LABEL = new Map<string, RelationshipNodeType>(
  (Object.entries(relationshipNodeTypeConfig) as [RelationshipNodeType, { label: string }][]).map(([type, config]) => [config.label, type]),
);

export function relationshipNodeFromEvidence(evidence: Evidence): RelationshipNode | undefined {
  const type = NODE_TYPE_BY_LABEL.get(evidence.type);
  return type ? { id: evidence.id, type, label: evidence.title } : undefined;
}

/** Node types backed by `KnowledgeObjectRepository` — the only ones a title/detail page can be resolved for generically. */
export const KNOWLEDGE_OBJECT_NODE_TYPES = new Set<RelationshipNodeType>(["requirement", "decision", "action", "issue", "risk"]);

/**
 * Resolves any graph node to its detail-page route, when one exists.
 * Extracted from `TimelineEntryCard.tsx` (Sprint 4.6) in Sprint 4.8 so the
 * Recommendation Panel shares the exact same mapping instead of duplicating
 * it — only Knowledge Object and Discussion node types have a real detail
 * page; every other node type (Meeting/Drawing/Document/Photo/Video/
 * Reference) has no standalone page in this codebase yet.
 */
export function nodeHref(projectId: string, node: RelationshipNodeRef): string | undefined {
  if (KNOWLEDGE_OBJECT_NODE_TYPES.has(node.type)) return `/projects/${projectId}/knowledge/${node.id}`;
  if (node.type === "discussion") return `/projects/${projectId}/discussions/${node.id}`;
  return undefined;
}

/** Relationships of `relationshipType` where `node` is the subject (nodeA). */
export function filterRelationshipsForNode(
  relationships: Relationship[],
  node: RelationshipNodeRef,
  relationshipType: RelationshipType,
): Relationship[] {
  return relationships.filter(
    (relationship) => relationship.relationshipType === relationshipType && isSameRelationshipNode(relationship.nodeA, node),
  );
}
