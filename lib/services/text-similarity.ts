const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "to", "of", "in", "on", "at", "with",
  "need", "needs", "needed", "below", "above", "this", "that", "is", "are",
  "was", "were", "be", "been", "will", "should", "must", "can", "we", "our",
]);

export function keywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

export function addWords(words: string[], weight: number, into: Map<string, number>): void {
  for (const word of words) {
    into.set(word, (into.get(word) ?? 0) + weight);
  }
}

/** Weighted overlap score between a set of input words (word -> weight) and an item's own text. */
function scoreItem(inputWeights: Map<string, number>, itemWords: string[]): number {
  let score = 0;
  for (const word of itemWords) {
    score += inputWeights.get(word) ?? 0;
  }
  return score;
}

/**
 * Generic weighted best-match search, shared by any duplicate-detection
 * caller (Discussions, Knowledge Objects, ...) — the tokenizer, stopword
 * list, and scoring math live in exactly one place.
 */
export function findBestMatch<T>(
  items: T[],
  getText: (item: T) => string,
  inputWeights: Map<string, number>,
  minScore: number,
): T | null {
  if (inputWeights.size === 0) return null;

  let best: { item: T; score: number } | null = null;
  for (const item of items) {
    const score = scoreItem(inputWeights, keywords(getText(item)));
    if (score >= minScore && (!best || score > best.score)) {
      best = { item, score };
    }
  }

  return best?.item ?? null;
}
