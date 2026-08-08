export type ClauseMatch = { clauseRef: string; confidence: "high" } | { clauseRef: null; confidence: "low" };

/**
 * Post-launch fix: the Clause Discussion composer used to require the
 * client to type a clause number themselves — most clients don't know one.
 * There is no document text-extraction engine in this codebase (Agreement
 * uploads are opaque files; `clauseRef` has always been a free-text label,
 * never parsed from content — see `types/discussion.ts`), so this is
 * honestly scoped to what's actually detectable: an explicit clause/section
 * reference the person typed themselves ("clause 2.2", "section 3"). That
 * case is high confidence — attach to that clause. Anything else is low
 * confidence and attaches to the Agreement as a whole, never guessed.
 */
const CLAUSE_REFERENCE_PATTERN = /\b(?:clause|section|article|para(?:graph)?)\s*(?:no\.?\s*)?(\d+(?:\.\d+)*)\b/i;

export function matchClauseFromMessage(message: string): ClauseMatch {
  const match = message.match(CLAUSE_REFERENCE_PATTERN);
  if (match) {
    return { clauseRef: match[1], confidence: "high" };
  }
  return { clauseRef: null, confidence: "low" };
}
