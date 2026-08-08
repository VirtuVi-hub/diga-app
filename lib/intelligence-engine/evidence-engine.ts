import { getDiscussion } from "@/lib/actions/discussion-actions";
import { getKnowledgeObject, getKnowledgeObjects } from "@/lib/actions/knowledge-object-actions";
import { getEvidenceForNode, getImpactsForNode, queryRelationships } from "@/lib/actions/relationship-actions";
import { relationshipNodeTypeConfig } from "@/lib/relationship-types";
import { isSameRelationshipNode } from "@/lib/relationship-utils";
import type { ExtractedEntity } from "@/types/comprehension";
import type { Evidence } from "@/types/evidence";
import type { ContextScope } from "@/types/intelligence-engine";
import type { Relationship, RelationshipNode, RelationshipNodeRef, RelationshipNodeType, RelationshipType } from "@/types/relationship";

const TIER_WEIGHT = { node: 1, linkedKnowledgeObject: 0.75, project: 0.5 } as const;
type Tier = keyof typeof TIER_WEIGHT;

const MAX_EVIDENCE_ITEMS = 6;

const KNOWLEDGE_OBJECT_TYPES = new Set<RelationshipNodeType>(["requirement", "decision", "action", "issue", "risk"]);

const STOPWORDS = new Set([
  "is", "are", "was", "were", "be", "been", "do", "does", "did",
  "the", "a", "an", "this", "that", "these", "those",
  "at", "in", "on", "of", "to", "for", "and", "or", "with",
]);

type Candidate = { relationship: Relationship; tier: Tier; reference?: RelationshipNodeRef };

export interface EvidenceEngine {
  collect(params: {
    text: string;
    entities: ExtractedEntity[];
    scopes: ContextScope[];
    relationshipType?: RelationshipType;
  }): Promise<Evidence[]>;
}

function findNodeScope(scopes: ContextScope[]): RelationshipNodeRef | undefined {
  const scope = scopes.find((candidate): candidate is Extract<ContextScope, { level: "node" }> => candidate.level === "node");
  return scope?.node;
}

function findProjectId(scopes: ContextScope[]): string | undefined {
  const scope = scopes.find((candidate): candidate is Extract<ContextScope, { level: "project" }> => candidate.level === "project");
  return scope?.projectId;
}

async function resolveLinkedKnowledgeObjectNodes(node: RelationshipNodeRef | undefined): Promise<RelationshipNodeRef[]> {
  if (!node || node.type !== "discussion") return [];
  const knowledgeObjects = await getKnowledgeObjects(node.id);
  return knowledgeObjects.map((object) => ({ id: object.id, type: object.type }));
}

function otherNode(relationship: Relationship, reference?: RelationshipNodeRef): RelationshipNode {
  if (reference && isSameRelationshipNode(relationship.nodeA, reference)) return relationship.nodeB;
  if (reference && isSameRelationshipNode(relationship.nodeB, reference)) return relationship.nodeA;
  return relationship.nodeB;
}

function toEvidence(relationship: Relationship, reference: RelationshipNodeRef | undefined, tier: Tier, relevance: number, excerpt?: string): Evidence {
  const node = otherNode(relationship, reference);
  return {
    id: node.id,
    title: node.label,
    type: relationshipNodeTypeConfig[node.type].label,
    relationship: relationship.relationshipType,
    relevance,
    confidence: TIER_WEIGHT[tier] * relevance,
    excerpt,
  };
}

function dedupeCandidates(candidates: Candidate[]): Candidate[] {
  const tierRank: Record<Tier, number> = { node: 0, linkedKnowledgeObject: 1, project: 2 };
  const bestByRelationshipId = new Map<string, Candidate>();

  for (const candidate of candidates) {
    const existing = bestByRelationshipId.get(candidate.relationship.id);
    if (!existing || tierRank[candidate.tier] < tierRank[existing.tier]) {
      bestByRelationshipId.set(candidate.relationship.id, candidate);
    }
  }

  return [...bestByRelationshipId.values()];
}

function dedupeAndRank(evidence: Evidence[]): Evidence[] {
  const bestById = new Map<string, Evidence>();
  for (const item of evidence) {
    const existing = bestById.get(item.id);
    if (!existing || item.confidence > existing.confidence) bestById.set(item.id, item);
  }
  return [...bestById.values()].sort((a, b) => b.confidence - a.confidence).slice(0, MAX_EVIDENCE_ITEMS);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 1.0 whole-word match, 0.7 substring match, 0 no match. */
function matchStrength(term: string, text: string | undefined): number {
  if (!text) return 0;
  const escaped = escapeRegExp(term);
  if (new RegExp(`\\b${escaped}\\b`, "i").test(text)) return 1;
  if (text.toLowerCase().includes(term.toLowerCase())) return 0.7;
  return 0;
}

function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[?.,!]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function extractExcerpt(term: string, text: string): string | undefined {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.find((sentence) => matchStrength(term, sentence) > 0)?.trim();
}

async function richerContentFor(ref: RelationshipNodeRef): Promise<string | undefined> {
  if (ref.type === "discussion") {
    const discussion = await getDiscussion(ref.id);
    return discussion ? [...discussion.summary, ...discussion.messages.map((message) => message.text)].join(" ") : undefined;
  }
  if (KNOWLEDGE_OBJECT_TYPES.has(ref.type)) {
    const knowledgeObject = await getKnowledgeObject(ref.id);
    return knowledgeObject ? `${knowledgeObject.title} ${knowledgeObject.description}` : undefined;
  }
  return undefined;
}

/**
 * The sides of a relationship worth matching against — excluding whichever
 * side equals the caller's own reference node (the discussion/knowledge
 * object we're already scoped to), so a query never "matches" purely
 * because the current context's own label happens to contain the term.
 * Without this, every piece of evidence attached to a discussion named e.g.
 * "Entrance Accessibility" would trivially match a query mentioning
 * "entrance," regardless of whether that evidence has anything to do with
 * it.
 */
function candidateSides(relationship: Relationship, reference?: RelationshipNodeRef): RelationshipNode[] {
  const sides = [relationship.nodeA, relationship.nodeB];
  if (!reference) return sides;
  return sides.filter((side) => !isSameRelationshipNode(side, reference));
}

async function matchTermOnCandidate(term: string, relationship: Relationship, reference: RelationshipNodeRef | undefined): Promise<{ strength: number; excerpt?: string } | null> {
  const sides = candidateSides(relationship, reference);
  if (sides.length === 0) return null;

  const labelStrength = Math.max(...sides.map((side) => matchStrength(term, side.label)));
  if (labelStrength > 0) return { strength: labelStrength };

  const contents = await Promise.all(sides.map((side) => richerContentFor(side)));
  for (const content of contents) {
    if (matchStrength(term, content) > 0) {
      return { strength: 0.5, excerpt: extractExcerpt(term, content ?? "") };
    }
  }
  return null;
}

/**
 * `requireAll` is true when `terms` are extracted entities (every entity
 * must match somewhere on this candidate — an AND, not an OR — so a
 * compound question like "is the staircase at the entrance" only matches a
 * node that genuinely mentions both, never a node that only mentions one).
 * It's false only for the rare fallback case (zero entities extracted),
 * where `terms` are plain significant words from the query text and any one
 * matching is enough.
 */
async function matchCandidate(relationship: Relationship, terms: string[], requireAll: boolean, reference: RelationshipNodeRef | undefined): Promise<{ relevance: number; excerpt?: string } | null> {
  const strengths: number[] = [];
  let excerpt: string | undefined;

  for (const term of terms) {
    const match = await matchTermOnCandidate(term, relationship, reference);
    if (match) {
      strengths.push(match.strength);
      excerpt ??= match.excerpt;
    } else if (requireAll) {
      return null;
    }
  }

  if (strengths.length === 0) return null;
  return { relevance: requireAll ? Math.min(...strengths) : Math.max(...strengths), excerpt };
}

/**
 * Module: Evidence Engine. Collects evidence relevant to a query — current
 * discussion first, then its linked knowledge objects, then the whole
 * project — ranks, dedupes, and returns generic, relationship-driven
 * `Evidence[]`. Never hardcodes a Requirement/Decision/Issue-specific path;
 * everything flows through the generic `Relationship` model.
 */
export class RelationshipEvidenceEngine implements EvidenceEngine {
  async collect({ text, entities, scopes, relationshipType }: {
    text: string;
    entities: ExtractedEntity[];
    scopes: ContextScope[];
    relationshipType?: RelationshipType;
  }): Promise<Evidence[]> {
    const nodeScope = findNodeScope(scopes);
    const projectId = findProjectId(scopes);
    const linkedNodes = await resolveLinkedKnowledgeObjectNodes(nodeScope);

    if (relationshipType) {
      return dedupeAndRank(await this.collectGraphNative(relationshipType, nodeScope, linkedNodes, projectId));
    }
    return dedupeAndRank(await this.collectGeneric(text, entities, nodeScope, linkedNodes, projectId));
  }

  /**
   * Graph-native intents (Evidence/Impact/Related Knowledge) preserve the
   * existing "expand only if the narrower tier is empty" cascade, now across
   * three tiers instead of two — a precise listing of "the relationships for
   * this exact node," not an entity-relevance search.
   */
  private async collectGraphNative(
    relationshipType: RelationshipType,
    nodeScope: RelationshipNodeRef | undefined,
    linkedNodes: RelationshipNodeRef[],
    projectId: string | undefined,
  ): Promise<Evidence[]> {
    if (nodeScope) {
      const relationships = await this.queryByType(relationshipType, nodeScope);
      if (relationships.length > 0) return relationships.map((relationship) => toEvidence(relationship, nodeScope, "node", 1));
    }

    if (linkedNodes.length > 0) {
      const groups = await Promise.all(linkedNodes.map((node) => queryRelationships({ node, relationshipType })));
      const relationships = groups.flat();
      if (relationships.length > 0) {
        return relationships.map((relationship) => toEvidence(relationship, undefined, "linkedKnowledgeObject", 1));
      }
    }

    if (projectId) {
      const relationships = await queryRelationships({ projectId, relationshipType });
      return relationships.map((relationship) => toEvidence(relationship, undefined, "project", 1));
    }

    return [];
  }

  private async queryByType(relationshipType: RelationshipType, node: RelationshipNodeRef): Promise<Relationship[]> {
    if (relationshipType === "evidence") return getEvidenceForNode(node);
    if (relationshipType === "impact") return getImpactsForNode(node);
    return queryRelationships({ node, relationshipType });
  }

  /**
   * Generic single-fact intents (location/status/material/dimension/...)
   * gather all three tiers unconditionally and rank by relevance, because
   * the genuine match may not sit in the narrowest tier — e.g. a discussion
   * only carries the "entrance" label indirectly, through its linked
   * Requirement's own evidence relationship.
   */
  private async collectGeneric(
    text: string,
    entities: ExtractedEntity[],
    nodeScope: RelationshipNodeRef | undefined,
    linkedNodes: RelationshipNodeRef[],
    projectId: string | undefined,
  ): Promise<Evidence[]> {
    const [nodeRelationships, linkedGroups, projectRelationships] = await Promise.all([
      nodeScope ? queryRelationships({ node: nodeScope }) : Promise.resolve([]),
      Promise.all(
        linkedNodes.map(async (node) => {
          const relationships = await queryRelationships({ node });
          return relationships.map((relationship): Candidate => ({ relationship, tier: "linkedKnowledgeObject", reference: node }));
        }),
      ),
      projectId ? queryRelationships({ projectId }) : Promise.resolve([]),
    ]);

    const candidates: Candidate[] = dedupeCandidates([
      ...nodeRelationships.map((relationship): Candidate => ({ relationship, tier: "node", reference: nodeScope })),
      ...linkedGroups.flat(),
      ...projectRelationships.map((relationship): Candidate => ({ relationship, tier: "project" })),
    ]);

    const entityTerms = entities.map((entity) => entity.value);
    const requireAll = entityTerms.length > 0;
    const terms = requireAll ? entityTerms : significantWords(text);
    if (terms.length === 0) return [];

    const evidence: Evidence[] = [];
    for (const candidate of candidates) {
      const match = await matchCandidate(candidate.relationship, terms, requireAll, candidate.reference);
      if (match) evidence.push(toEvidence(candidate.relationship, candidate.reference, candidate.tier, match.relevance, match.excerpt));
    }
    return evidence;
  }
}

export const evidenceEngine: EvidenceEngine = new RelationshipEvidenceEngine();
