import type { RelationshipType } from "@/types/relationship";

/**
 * Generic vocabulary for evidence-based reasoning over the Knowledge Graph
 * (Sprint 4.3). Not Delta-specific — any future consumer (upload
 * intelligence, semantic search, explainability) should produce/consume
 * these same shapes rather than inventing per-feature equivalents.
 */

export type ConfidenceLevel = "high" | "medium" | "low" | "none";

/**
 * One piece of supporting evidence, traced back to a real `Relationship` (or
 * its underlying discussion/knowledge-object content). Never fabricated.
 */
export type Evidence = {
  id: string;
  title: string;
  type: string;
  relationship: RelationshipType;
  /** 0-1, how strongly this candidate matched the query, before tier weighting. */
  relevance: number;
  /** 0-1, tier-weighted score used for ranking/dedupe — not shown standalone in the UI. */
  confidence: number;
  /** The matched discussion/knowledge-object text, when relevance came from richer content rather than the relationship label itself. */
  excerpt?: string;
};

/**
 * What Delta found, what it didn't, and what it concludes — never a
 * fabricated claim, only a factual summary of the evidence gathered.
 */
export type ReasoningResult = {
  found: string[];
  missing: string[];
  conclusion: string;
};
