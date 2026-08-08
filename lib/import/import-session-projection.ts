import type { ImportSessionSummary } from "@/lib/types/import";
import type { ProcessingState, Source } from "@/types/project-intelligence-gateway";

const TERMINAL_STATES: ProcessingState[] = ["completed", "needs_review", "failed"];

/**
 * Module 2: Import Sessions. A pure projection, exactly like
 * `TimelineProjection`/`GatewayDashboard` — no fetching, no side effects.
 * Only sources carrying a real `metadata.importSessionId` are grouped (set
 * by `import-actions.ts`'s `importAsset()`); anything else (onboarding
 * uploads, direct Gateway ingestion) has no session of its own and is
 * correctly excluded rather than guessed into one.
 */
export function projectImportSessions(sources: Source[]): ImportSessionSummary[] {
  const bySession = new Map<string, Source[]>();

  for (const source of sources) {
    const sessionId = typeof source.metadata.importSessionId === "string" ? source.metadata.importSessionId : null;
    if (!sessionId) continue;
    const existing = bySession.get(sessionId) ?? [];
    existing.push(source);
    bySession.set(sessionId, existing);
  }

  return Array.from(bySession.entries())
    .map(([sessionId, items]): ImportSessionSummary => {
      const startedAt = items.reduce((min, item) => (item.createdAt < min ? item.createdAt : min), items[0].createdAt);
      const allTerminal = items.every((item) => TERMINAL_STATES.includes(item.processingState));
      const completedAt = allTerminal ? items.reduce((max, item) => (item.updatedAt > max ? item.updatedAt : max), items[0].updatedAt) : null;

      return {
        sessionId,
        startedAt,
        completedAt,
        importedCount: items.filter((item) => item.processingState === "completed").length,
        needsReviewCount: items.filter((item) => item.processingState === "needs_review").length,
        failedCount: items.filter((item) => item.processingState === "failed").length,
        totalCount: items.length,
      };
    })
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}
