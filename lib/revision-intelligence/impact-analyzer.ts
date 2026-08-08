import { analyzeLabelImpact, type ImpactAnalysis } from "@/lib/impact-engine/impact-engine";
import type { ContextScope } from "@/types/intelligence-engine";

export type { ImpactAnalysis };

/**
 * Module 8: Impact Analysis — the heart of Revision Intelligence. As of
 * Sprint 5.7, the actual computation lives in `lib/impact-engine/`
 * (`analyzeLabelImpact`), extracted so Module 11's automatic governance
 * can reuse the exact same logic instead of a second implementation. This
 * interface/class/singleton shape is kept unchanged so `revision-engine.ts`
 * (the only caller) needs zero changes — a pure delegation, not a rewrite.
 * See `lib/impact-engine/impact-engine.ts` for the full original
 * doc-comment explaining why the generic (non-graph-native) `collect()`
 * path is correct here.
 */
export interface ImpactAnalyzer {
  analyze(params: { elementLabel: string; scopes: ContextScope[] }): Promise<ImpactAnalysis>;
}

export class RelationshipImpactAnalyzer implements ImpactAnalyzer {
  async analyze(params: { elementLabel: string; scopes: ContextScope[] }): Promise<ImpactAnalysis> {
    return analyzeLabelImpact(params);
  }
}

export const impactAnalyzer: ImpactAnalyzer = new RelationshipImpactAnalyzer();
