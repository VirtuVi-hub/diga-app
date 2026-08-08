import { addWords, findBestMatch, keywords } from "@/lib/services/text-similarity";
import type { KnowledgeObject } from "@/types/knowledge-object";

function knowledgeObjectText(object: KnowledgeObject): string {
  return `${object.title} ${object.description}`;
}

/**
 * Duplicate-knowledge detection for the Knowledge Capture Engine (Sprint
 * 4.4). Searches every Knowledge Object type — Requirement, Decision,
 * Action, Issue, Risk — not just Requirements, per "search the entire
 * Knowledge Graph, not only Requirements." Shares its weighted-scoring core
 * with `findMatchingDiscussionForMessage` (`lib/services/text-similarity.ts`);
 * same calibration (entities weighted 2x, minimum score 2) since this also
 * runs on every drafted Knowledge Object, not a deliberate form submission.
 */
export function findMatchingKnowledgeObject(
  objects: KnowledgeObject[],
  input: { text: string; entities: string[] },
): KnowledgeObject | null {
  const weights = new Map<string, number>();
  addWords(keywords(input.text), 1, weights);
  for (const entity of input.entities) {
    addWords(keywords(entity), 2, weights);
  }
  return findBestMatch(objects, knowledgeObjectText, weights, 2);
}
