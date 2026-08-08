import { addWords, findBestMatch, keywords } from "@/lib/services/text-similarity";
import type { Discussion } from "@/types/discussion";

function discussionText(discussion: Discussion): string {
  return [discussion.title, ...discussion.summary].join(" ");
}

export function findMatchingDiscussion(
  discussions: Discussion[],
  input: { title: string; description: string },
): Discussion | null {
  const weights = new Map<string, number>();
  addWords(keywords(input.title), 1, weights);
  addWords(keywords(input.description), 1, weights);
  return findBestMatch(discussions, discussionText, weights, 1);
}

/**
 * Duplicate-discussion detection for the Journal's input router (Sprint
 * 4.3.1). Goes beyond title matching alone: weights the Comprehension
 * Engine's own extracted entities higher than incidental keyword overlap,
 * since they're already a high-confidence signal for "what this message is
 * actually about," and requires a higher minimum score than
 * `findMatchingDiscussion` — this runs on every Journal message, not a
 * deliberate form submission, so the bar for surfacing a duplicate is
 * calibrated tighter.
 */
export function findMatchingDiscussionForMessage(
  discussions: Discussion[],
  input: { text: string; entities: string[] },
): Discussion | null {
  const weights = new Map<string, number>();
  addWords(keywords(input.text), 1, weights);
  for (const entity of input.entities) {
    addWords(keywords(entity), 2, weights);
  }
  return findBestMatch(discussions, discussionText, weights, 2);
}
