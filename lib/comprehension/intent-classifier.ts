import type { ClassifiedIntent, DeltaIntent } from "@/types/comprehension";

type IntentRule = {
  intent: DeltaIntent;
  patterns: RegExp[];
  confidence: number;
};

/**
 * Order encodes priority — checked top to bottom, first match wins. This is
 * why "reason" is checked before "dimension": "Why is the staircase 4 ft?"
 * must classify as Reason, not Dimension, even though it contains a unit.
 */
const INTENT_RULES: IntentRule[] = [
  { intent: "location", patterns: [/\bwhere\b/i], confidence: 0.95 },
  { intent: "reason", patterns: [/\bwhy\b/i], confidence: 0.95 },
  { intent: "approval", patterns: [/\bwho approved\b/i, /\bapproval\b/i, /\bapproved by\b/i], confidence: 0.9 },
  { intent: "status", patterns: [/\bwhat happened\b/i, /\bwhat.?s the status\b/i, /\bstatus\b/i], confidence: 0.9 },
  { intent: "conflict", patterns: [/\bconflict\b/i, /\bclash(es)?\b/i, /\boverlap(s)?\b/i], confidence: 0.9 },
  { intent: "evidence", patterns: [/\bevidence\b/i, /\bproof\b/i, /\bsource(s)?\b/i], confidence: 0.9 },
  { intent: "impact", patterns: [/\bimpact(s)?\b/i, /\baffect(s|ed)?\b/i], confidence: 0.9 },
  { intent: "comparison", patterns: [/\bcompare\b/i, /\bversus\b/i, /\bvs\.?\b/i, /\bdifference between\b/i], confidence: 0.9 },
  { intent: "revision", patterns: [/\brevision\b/i, /\bversion\b/i, /\bpreviously\b/i], confidence: 0.9 },
  { intent: "related_knowledge", patterns: [/\brelated\b/i, /\bconnected to\b/i, /\blinked to\b/i], confidence: 0.85 },
  { intent: "dimension", patterns: [/\bhow (wide|tall|long|big|deep)\b/i, /\bwidth\b/i, /\bheight\b/i, /\bdimension/i, /\d+\s*(mm|cm|ft|feet|meter|metre)/i], confidence: 0.85 },
  { intent: "material", patterns: [/\bmaterial\b/i, /\bmarble\b|\bwood(en)?\b|\bsteel\b|\bglass\b|\btile(s)?\b|\bgranite\b/i], confidence: 0.85 },
  { intent: "requirement", patterns: [/\brequirement\b/i, /\bneeds?\b/i, /\bwants?\b/i, /\bshould (be|become)\b/i], confidence: 0.75 },
  { intent: "decision", patterns: [/\bdecision\b/i, /\bdecided\b/i, /\bapprove(d)?\b/i], confidence: 0.75 },
  { intent: "action", patterns: [/\baction\b/i, /\bto[- ]?do\b/i, /\bneed to\b/i, /\bmust\b/i], confidence: 0.75 },
  { intent: "issue", patterns: [/\bissue\b/i, /\bproblem\b/i], confidence: 0.8 },
  { intent: "risk", patterns: [/\brisk\b/i], confidence: 0.85 },
];

const FALLBACK_INTENT: ClassifiedIntent = { intent: "related_knowledge", confidence: 0.3 };

export interface IntentClassifier {
  classify(text: string): ClassifiedIntent;
}

export class RuleBasedIntentClassifier implements IntentClassifier {
  constructor(private readonly rules: IntentRule[] = INTENT_RULES) {}

  classify(text: string): ClassifiedIntent {
    for (const rule of this.rules) {
      if (rule.patterns.some((pattern) => pattern.test(text))) {
        return { intent: rule.intent, confidence: rule.confidence };
      }
    }
    return FALLBACK_INTENT;
  }
}

export const intentClassifier: IntentClassifier = new RuleBasedIntentClassifier();
