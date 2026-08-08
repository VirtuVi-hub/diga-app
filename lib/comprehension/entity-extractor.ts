import type { ExtractedEntity } from "@/types/comprehension";

type EntityDictionaryEntry = { term: string; type: string };

/**
 * Configurable entity dictionary. `type` is a free-form string on purpose —
 * adding a new entity kind (or a new term) is a data change here, never an
 * architecture change.
 */
export const ENTITY_DICTIONARY: EntityDictionaryEntry[] = [
  { term: "fire staircase", type: "entity" },
  { term: "staircase", type: "entity" },
  { term: "fire exit", type: "entity" },
  { term: "fire rated door", type: "entity" },
  { term: "toilet", type: "entity" },
  { term: "beam", type: "entity" },
  { term: "hvac", type: "entity" },
  { term: "entrance", type: "context" },
  { term: "west side", type: "context" },
  { term: "client", type: "participant" },
  { term: "lead architect", type: "participant" },
  { term: "project management consultant", type: "participant" },
  { term: "marble", type: "material" },
  { term: "wood", type: "material" },
  { term: "steel", type: "material" },
  { term: "glass", type: "material" },
  { term: "granite", type: "material" },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

export interface EntityExtractor {
  extract(text: string): ExtractedEntity[];
}

export class DictionaryEntityExtractor implements EntityExtractor {
  constructor(private readonly dictionary: EntityDictionaryEntry[] = ENTITY_DICTIONARY) {}

  extract(text: string): ExtractedEntity[] {
    const sortedByLength = [...this.dictionary].sort((a, b) => b.term.length - a.term.length);
    const matched: ExtractedEntity[] = [];
    const matchedTerms: string[] = [];

    for (const entry of sortedByLength) {
      const pattern = new RegExp(`\\b${escapeRegExp(entry.term)}\\b`, "i");
      if (!pattern.test(text)) continue;

      const coveredByLongerMatch = matchedTerms.some((longer) => longer !== entry.term && longer.includes(entry.term));
      if (coveredByLongerMatch) continue;

      matchedTerms.push(entry.term);

      const longerAlternatives = this.dictionary
        .filter((other) => other.term !== entry.term && other.term.includes(entry.term))
        .map((other) => titleCase(other.term));

      matched.push({
        type: entry.type,
        value: titleCase(entry.term),
        confidence: longerAlternatives.length > 0 ? 0.45 : 0.95,
        alternatives: longerAlternatives.length > 0 ? [titleCase(entry.term), ...longerAlternatives] : undefined,
      });
    }

    return matched;
  }
}

export const entityExtractor: EntityExtractor = new DictionaryEntityExtractor();
