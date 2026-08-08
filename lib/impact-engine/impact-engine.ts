import { evidenceEngine } from "@/lib/intelligence-engine/evidence-engine";
import type { Evidence } from "@/types/evidence";
import type { ContextScope } from "@/types/intelligence-engine";
import type { RelationshipNodeType } from "@/types/relationship";

/**
 * Sprint 5.7, Module 11: a small, generic Impact Engine, extracted from two
 * call sites that were independently duplicating the same idea —
 * `knowledge-validation-engine.ts`'s inline 3-call impact lookup, and
 * `revision-intelligence/impact-analyzer.ts`'s single-call version. This is
 * a pure code-move, not a rewrite: each function's body is copied verbatim
 * from its original call site, with the exact same arguments to
 * `evidenceEngine.collect()`, so neither caller's output changes by even
 * one value. Both callers were edited to delegate here instead of
 * inlining the logic — see the doc-comment on each for the before/after
 * call shape.
 *
 * This is also what Module 11's automatic governance
 * (`lib/governance/governance-roster.ts`) calls to decide whether an
 * `on_impact` governance rule applies to a given object.
 */
export type ImpactAnalysis = {
  evidence: Evidence[];
  impacts: Evidence[];
  relatedKnowledge: Evidence[];
};

/**
 * Moved verbatim from `knowledge-validation-engine.ts`'s 3 inline
 * `evidenceEngine.collect()` calls (one per relationshipType, run in
 * parallel). Used when the object already has a real graph node — an
 * existing Knowledge Object, an Agreement document, a drawing revision.
 */
export async function analyzeNodeImpact(params: {
  id: string;
  type: RelationshipNodeType;
  projectId: string;
  text: string;
}): Promise<ImpactAnalysis> {
  const scopes: ContextScope[] = [
    { level: "node", node: { id: params.id, type: params.type } },
    { level: "project", projectId: params.projectId },
  ];

  const [evidence, impacts, relatedKnowledge] = await Promise.all([
    evidenceEngine.collect({ text: params.text, entities: [], scopes, relationshipType: "evidence" }),
    evidenceEngine.collect({ text: params.text, entities: [], scopes, relationshipType: "impact" }),
    evidenceEngine.collect({ text: params.text, entities: [], scopes, relationshipType: "related" }),
  ]);

  return { evidence, impacts, relatedKnowledge };
}

/**
 * Moved verbatim from `revision-intelligence/impact-analyzer.ts`'s
 * `RelationshipImpactAnalyzer.analyze()`. Used when there is no existing
 * graph node yet to scope to (a freshly detected drawing element, or a
 * Knowledge Object being raised for the first time) — the single generic,
 * non-graph-native `collect()` call, split by `Evidence.relationship`
 * afterward. See that file's own doc-comment for why this shape (not the
 * graph-native path) is correct here.
 */
export async function analyzeLabelImpact(params: {
  elementLabel: string;
  scopes: ContextScope[];
}): Promise<ImpactAnalysis> {
  const allEvidence = await evidenceEngine.collect({ text: params.elementLabel, entities: [], scopes: params.scopes });

  return {
    evidence: allEvidence.filter((item) => item.relationship === "evidence"),
    impacts: allEvidence.filter((item) => item.relationship === "impact"),
    relatedKnowledge: allEvidence.filter((item) => item.relationship === "related"),
  };
}
