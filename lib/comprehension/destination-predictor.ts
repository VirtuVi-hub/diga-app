import type { DeltaDestination, DestinationPrediction } from "@/types/comprehension";

const QUESTION_PATTERN = /\?\s*$/;
const QUESTION_WORD_PATTERN = /^\s*(where|what|why|who|how|when|which|is|are|did|does|do|can|could|would|will)\b/i;

type DestinationRule = {
  destination: DeltaDestination;
  patterns: RegExp[];
  confidence: number;
};

/**
 * Checked in order after the question check. A statement matching none of
 * these falls back to "new_discussion" — today's existing default — so an
 * unrecognized statement never surprises the user with something new.
 */
const STATEMENT_RULES: DestinationRule[] = [
  { destination: "new_issue", patterns: [/\bclash(es)?\b/i, /\bconflict\b/i, /\bproblem\b/i], confidence: 0.9 },
  { destination: "new_discussion", patterns: [/\blet.?s\b/i, /\bshall we\b/i, /\bpropose\b/i, /\bsuggest(ion)?\b/i], confidence: 0.85 },
  { destination: "new_requirement", patterns: [/\bwants?\b/i, /\bneeds?\b/i, /\bshould (be|become)\b/i, /\brequirement\b/i], confidence: 0.85 },
  { destination: "new_decision", patterns: [/\bdecided\b/i, /\bdecision\b/i, /\bapproved\b/i], confidence: 0.85 },
  { destination: "new_action", patterns: [/\bneed to\b/i, /\bmust\b/i, /\baction:?\b/i, /\bto-?do\b/i], confidence: 0.8 },
];

const FALLBACK: DestinationPrediction = { destination: "new_discussion", confidence: 0.4 };

export interface DestinationPredictor {
  predict(text: string): DestinationPrediction;
}

export class RuleBasedDestinationPredictor implements DestinationPredictor {
  constructor(private readonly rules: DestinationRule[] = STATEMENT_RULES) {}

  predict(text: string): DestinationPrediction {
    if (QUESTION_PATTERN.test(text) || QUESTION_WORD_PATTERN.test(text)) {
      return { destination: "delta_query", confidence: 0.99 };
    }

    for (const rule of this.rules) {
      if (rule.patterns.some((pattern) => pattern.test(text))) {
        return { destination: rule.destination, confidence: rule.confidence };
      }
    }

    return FALLBACK;
  }
}

export const destinationPredictor: DestinationPredictor = new RuleBasedDestinationPredictor();
