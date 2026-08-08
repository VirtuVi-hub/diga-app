import type { GatewayDashboard, ProcessingState, Source } from "@/types/project-intelligence-gateway";

const MAX_RECENT_SOURCES = 10;

const ALL_PROCESSING_STATES: ProcessingState[] = ["received", "classified", "queued", "processing", "completed", "needs_review", "failed"];

/**
 * Module 7: Gateway Dashboard Model. A pure projection over `Source[]` —
 * exactly like `TimelineProjection` (Sprint 4.6): no new store, no UI this
 * sprint. What a future dashboard page would render: recent uploads,
 * processing status, detected source types, pending review, and errors.
 */
export function projectGatewayDashboard(sources: Source[]): GatewayDashboard {
  const recentSources = sources
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_RECENT_SOURCES);

  const countsByState = Object.fromEntries(ALL_PROCESSING_STATES.map((state) => [state, 0])) as Record<ProcessingState, number>;
  const countsBySourceType: Record<string, number> = {};

  for (const source of sources) {
    countsByState[source.processingState] += 1;
    countsBySourceType[source.sourceType] = (countsBySourceType[source.sourceType] ?? 0) + 1;
  }

  return {
    recentSources,
    countsByState,
    countsBySourceType,
    pendingReview: sources.filter((source) => source.processingState === "needs_review"),
    failed: sources.filter((source) => source.processingState === "failed"),
  };
}
