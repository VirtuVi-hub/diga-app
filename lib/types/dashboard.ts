/**
 * Project Dashboard / Mission Control (Sprint 5.5). One generic shape for
 * the whole page's data, composed entirely from existing projections and
 * services (`lib/actions/dashboard-actions.ts` is the only place that
 * fetches anything) — this file only describes the shape, never how it's
 * computed. No new storage: nothing here is persisted, everything is
 * recomputed live on each page load, exactly like `ProjectDashboardData`
 * (Sprint 5.3) and every other pure projection in this codebase
 * (`TimelineProjection`, `GatewayDashboard`).
 */

export type HealthMetricKey =
  | "knowledgeObjects"
  | "discussions"
  | "openRecommendations"
  | "pendingApprovals"
  | "openValidationRequests"
  | "recentRevisions"
  | "missingOnboardingItems"
  | "knowledgeCoverage";

/**
 * `value` is `"Not Available"` — never a fabricated number — when a metric
 * genuinely cannot be computed honestly yet (Module 3's own instruction).
 * Today this only applies to Knowledge Coverage when a project has zero
 * Knowledge Objects (0/0 is undefined, not 0%).
 */
export type HealthMetric = {
  key: HealthMetricKey;
  label: string;
  value: number | "Not Available";
  unit?: "%" | "count";
  detail: string;
};

export type AttentionCategory = "approval" | "review" | "recommendation" | "onboarding" | "revision";

export type AttentionItem = {
  id: string;
  category: AttentionCategory;
  categoryLabel: string;
  title: string;
  description: string;
  href?: string;
  /** Lower sorts first — a fixed, documented category ranking, never a fabricated score. */
  urgencyRank: number;
};

export type ProjectSnapshot = {
  requirements: number;
  decisions: number;
  issues: number;
  actions: number;
  risks: number;
  drawings: number;
  documents: number;
  discussions: number;
  timelineEvents: number;
  participants: number;
};

export type RecentDocumentItem = {
  id: string;
  name: string;
  documentTypeName: string | null;
  uploadedAt: string | null;
};

export type UpcomingItem = {
  id: string;
  title: string;
  detail: string;
  href?: string;
};

export type UpcomingSection = {
  key: "meetings" | "approvals" | "onboarding" | "milestones";
  label: string;
  items: UpcomingItem[];
  /** Shown when `items` is empty — always a real reason, never a guess. */
  emptyState: string;
};
