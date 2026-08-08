import type { ExtractedEntity } from "@/types/comprehension";
import type { ConfidenceLevel, Evidence, ReasoningResult } from "@/types/evidence";
import type { KnowledgeObjectPriority, KnowledgeObjectType } from "@/types/knowledge-object";
import type { RelationshipType } from "@/types/relationship";

/**
 * A suggested relationship for a not-yet-created Knowledge Object — never a
 * real `Relationship` row (Sprint 4.0's model is reused for its vocabulary
 * only). `label`/`typeLabel` are display strings, not a full
 * `RelationshipNode` reference, since nothing here is ever persisted; the
 * Knowledge Capture Engine only ever suggests, it never creates one.
 */
export type SuggestedRelationship = {
  relationshipType: RelationshipType;
  label: string;
  typeLabel: string;
};

/**
 * The generic Knowledge Draft model (Sprint 4.4). One shape for every
 * Knowledge Object type — Requirement, Decision, Action, Issue, Risk.
 * Nothing here is saved until a human approves it.
 */
export type KnowledgeDraft = {
  type: KnowledgeObjectType;
  title: string;
  description: string;
  priority: KnowledgeObjectPriority;
  entities: ExtractedEntity[];
  evidence: Evidence[];
  confidence: ConfidenceLevel;
  suggestedRelationships: SuggestedRelationship[];
  suggestedParticipants: string[];
  reasoning: ReasoningResult;
};
