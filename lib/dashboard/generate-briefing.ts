import type { MissionControlRawData } from "./mission-control-types";

const DAY_MS = 86_400_000;
const BRIEFING_WINDOW_DAYS = 7;

const KNOWLEDGE_TYPE_LABEL: Record<string, string> = {
  requirement: "Requirement",
  decision: "Decision",
  action: "Action",
  issue: "Issue",
  risk: "Risk",
};

function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

/**
 * Module 2: Delta Daily Briefing. A deterministic template over real,
 * already-fetched data — never an LLM call, never a second intelligence
 * engine. The brief's own example says "Since your last visit," but no
 * visit-tracking mechanism exists anywhere in this codebase and this sprint
 * may not introduce new storage to add one — so the briefing honestly uses a
 * rolling trailing window instead, matching `timeline-query.ts`'s own
 * precedent for "recently" (Sprint 4.6). Each line only appears when the
 * underlying count is genuinely greater than zero; if nothing happened, one
 * honest "all caught up" line is returned instead of a blank section.
 */
export function generateDashboardBriefing(data: MissionControlRawData): string[] {
  const cutoff = Date.now() - BRIEFING_WINDOW_DAYS * DAY_MS;
  const isRecent = (iso: string) => new Date(iso).getTime() >= cutoff;

  const lines: string[] = [];

  const recentByType = new Map<string, number>();
  for (const object of data.knowledgeObjects) {
    if (!isRecent(object.createdAt)) continue;
    recentByType.set(object.type, (recentByType.get(object.type) ?? 0) + 1);
  }
  for (const [type, count] of recentByType) {
    lines.push(`${pluralize(count, KNOWLEDGE_TYPE_LABEL[type] ?? type)} ${count === 1 ? "was" : "were"} raised.`);
  }

  const openRecommendations = data.recommendations.filter((recommendation) => recommendation.status === "open").length;
  if (openRecommendations > 0) {
    lines.push(`${pluralize(openRecommendations, "Recommendation")} need${openRecommendations === 1 ? "s" : ""} attention.`);
  }

  const recentRevisions = data.revisions.filter((revision) => isRecent(revision.timestamp)).length;
  if (recentRevisions > 0) {
    lines.push(`${pluralize(recentRevisions, "Drawing Revision")} ${recentRevisions === 1 ? "was" : "were"} detected.`);
  }

  const recentlyResolvedDiscussions = data.discussions.filter((discussion) => discussion.status === "resolved" && isRecent(discussion.lastActivityAt)).length;
  if (recentlyResolvedDiscussions > 0) {
    lines.push(`${pluralize(recentlyResolvedDiscussions, "discussion")} ${recentlyResolvedDiscussions === 1 ? "was" : "were"} resolved.`);
  }

  const pendingApprovals = data.knowledgeObjects.filter((object) => object.validationState === "pending" && (object.approvalRequiredFrom?.length ?? 0) > 0).length;
  if (pendingApprovals > 0) {
    lines.push(`${pluralize(pendingApprovals, "approval")} remain${pendingApprovals === 1 ? "s" : ""} pending.`);
  }

  if (lines.length === 0) {
    return ["Nothing new in the last week — this project is all caught up."];
  }

  return lines;
}
