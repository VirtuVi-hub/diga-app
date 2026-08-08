import type { ClassifiedIntent, DeltaIntent } from "@/types/comprehension";
import type { ResponsePlan } from "@/types/intelligence-engine";

const SHORT_ANSWER: ResponsePlan = {
  layout: "short_answer",
  sections: ["answer", "evidence", "confidence", "related_knowledge"],
};

/**
 * Exhaustive by construction — every `DeltaIntent` must appear exactly once,
 * TypeScript-checked. Grouped into four families by what kind of answer
 * shape actually serves the intent, not 17 independently hand-picked rows:
 *
 * - Single-fact Q&A (location/status/approval/reason/dimension/material/
 *   decision/requirement) → a short synthesized answer plus support.
 * - Graph-native listing (evidence/impact/related_knowledge/issue/risk/
 *   action) → the graph result IS the answer, no synthesis needed.
 * - Multi-thing juxtaposition (comparison/conflict) → a comparison layout.
 * - Change-over-time (revision) → what changed and what it affects.
 */
const RESPONSE_PLAN_RULES: Record<DeltaIntent, ResponsePlan> = {
  location: SHORT_ANSWER,
  status: SHORT_ANSWER,
  approval: SHORT_ANSWER,
  reason: SHORT_ANSWER,
  dimension: SHORT_ANSWER,
  material: SHORT_ANSWER,
  decision: SHORT_ANSWER,
  requirement: SHORT_ANSWER,

  evidence: { layout: "related_list", sections: ["evidence", "confidence"] },
  impact: { layout: "related_list", sections: ["impacts", "confidence"] },
  related_knowledge: { layout: "related_list", sections: ["related_knowledge", "confidence"] },
  issue: { layout: "related_list", sections: ["description", "evidence", "related_knowledge", "confidence"] },
  risk: { layout: "related_list", sections: ["description", "evidence", "related_knowledge", "confidence"] },
  action: { layout: "related_list", sections: ["description", "evidence", "confidence"] },

  comparison: { layout: "comparison", sections: ["comparison", "evidence", "impacts", "confidence"] },
  conflict: { layout: "comparison", sections: ["comparison", "evidence", "related_knowledge", "confidence"] },

  revision: { layout: "revision", sections: ["changes", "affected_knowledge", "related_drawings", "confidence"] },
};

/**
 * Module 4 — Response Planner. Decides how an answer should be presented,
 * not what the answer is. This will become the foundation of future Delta
 * responses; today it is computed and carried on the canonical result
 * without yet driving `DeltaResponsePanel`'s rendering (follow-up work).
 */
export interface ResponsePlanner {
  plan(intent: ClassifiedIntent): ResponsePlan;
}

export class RuleBasedResponsePlanner implements ResponsePlanner {
  constructor(private readonly rules: Record<DeltaIntent, ResponsePlan> = RESPONSE_PLAN_RULES) {}

  plan(intent: ClassifiedIntent): ResponsePlan {
    return this.rules[intent.intent];
  }
}

export const responsePlanner: ResponsePlanner = new RuleBasedResponsePlanner();
