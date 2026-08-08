import type { NormalizationResult } from "@/types/comprehension";

/**
 * Configurable normalization dictionary — spelling variants, abbreviations,
 * architectural terminology, and common synonyms all map to one canonical
 * phrase. Grows over time without any code change. Multi-word keys are
 * matched before single-word keys (longest phrase wins).
 */
export const NORMALIZATION_DICTIONARY: Record<string, string> = {
  // Spelling variants
  "staircse": "staircase",
  "staircas": "staircase",
  "stair case": "staircase",
  "stairs": "staircase",

  // Abbreviations / architectural terminology
  "fire door": "fire rated door",
  "fr door": "fire rated door",
  "fire rated door": "fire rated door",
  "cl": "client",
  "pmc": "project management consultant",
  "wc": "toilet",
  "washroom": "toilet",
};

export interface NormalizationService {
  normalize(input: string): NormalizationResult;
}

function collapseWhitespaceAndCase(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export class RuleBasedNormalizationService implements NormalizationService {
  constructor(private readonly dictionary: Record<string, string> = NORMALIZATION_DICTIONARY) {}

  normalize(input: string): NormalizationResult {
    const original = input;
    let working = collapseWhitespaceAndCase(input);
    const appliedRules: string[] = [];

    const phrases = Object.keys(this.dictionary).sort((a, b) => b.split(" ").length - a.split(" ").length || b.length - a.length);

    for (const phrase of phrases) {
      const pattern = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      if (pattern.test(working)) {
        working = working.replace(pattern, this.dictionary[phrase]);
        appliedRules.push(`${phrase} → ${this.dictionary[phrase]}`);
      }
    }

    return {
      original,
      normalized: collapseWhitespaceAndCase(working).toLowerCase(),
      appliedRules,
    };
  }
}

export const normalizationService: NormalizationService = new RuleBasedNormalizationService();
