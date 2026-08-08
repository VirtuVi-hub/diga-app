import { notFound } from "next/navigation";
import { getMissionControlData } from "@/lib/actions/dashboard-actions";
import { requireActiveProject } from "@/lib/governance/activation-gate";
import { AttentionCenterPanel } from "@/components/dashboard/AttentionCenterPanel";
import { DeltaBriefing } from "@/components/dashboard/DeltaBriefing";
import { ImportProgressPanel } from "@/components/dashboard/ImportProgressPanel";
import { ProjectHealthGrid } from "@/components/dashboard/ProjectHealthGrid";
import { ProjectSnapshotGrid } from "@/components/dashboard/ProjectSnapshotGrid";
import { QuickActionsGrid } from "@/components/dashboard/QuickActionsGrid";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { RecentDocumentsPanel } from "@/components/dashboard/RecentDocumentsPanel";
import { UpcomingPanel } from "@/components/dashboard/UpcomingPanel";
import { RecommendationPanel } from "@/components/recommendations/RecommendationPanel";
import { toDisplayRoleName } from "@/lib/roles/display-role-name";
import { WORKSPACE_FEED_MAX_WIDTH_CLASS, WORKSPACE_FEED_PADDING_CLASS } from "@/lib/workspace-layout";

export const dynamic = "force-dynamic";

/**
 * Sprint 5.5 — Project Dashboard / Mission Control. The project's landing
 * page (Module 11: `/projects` now links here, not to the Journal). Every
 * section below is a projection over data Sprints 4.0–5.4 already built —
 * `getMissionControlData()` is the only fetch on this page; nothing here
 * introduces new storage or a new intelligence engine. Layout order follows
 * the brief's own suggestion: header → briefing → health → attention →
 * snapshot → recent activity → recommendations → upcoming → quick actions →
 * recent documents. Sprint 5.4's onboarding-progress banner was removed in
 * Sprint 5.7: this page is only reachable once `lifecycle_stage === "active"`
 * (Module 15's activation gate), by which point Project Setup is complete
 * by definition — a "continue setup" prompt here would be dead UI.
 */
export default async function ProjectDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireActiveProject(id);
  const data = await getMissionControlData(id);

  if (!data) {
    notFound();
  }

  const { project, team, briefing, health, attention, snapshot, recentActivity, recommendations, upcoming, recentDocuments, importCategories, recentDrawings } = data;

  return (
    <div className={`mx-auto w-full ${WORKSPACE_FEED_MAX_WIDTH_CLASS} ${WORKSPACE_FEED_PADDING_CLASS}`}>
      <h2 className="font-display text-2xl font-semibold text-text-primary">Dashboard</h2>
      <p className="mt-1 text-text-secondary">
        {project.name}
        {project.firmName ? ` · ${project.firmName}` : ""}
      </p>

      <div className="mt-6">
        <DeltaBriefing lines={briefing} />
      </div>

      <div className="mt-8">
        <ProjectHealthGrid metrics={health} />
      </div>

      <div className="mt-8">
        <AttentionCenterPanel items={attention} />
      </div>

      <div className="mt-8">
        <ProjectSnapshotGrid snapshot={snapshot} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <RecentActivityFeed
          entries={recentActivity}
          projectId={id}
        />

        <RecommendationPanel
          projectId={id}
          initialRecommendations={recommendations}
        />
      </div>

      <div className="mt-8">
        <UpcomingPanel sections={upcoming} />
      </div>

      <div className="mt-8">
        <QuickActionsGrid projectId={id} />
      </div>

      <div className="mt-8">
        <RecentDocumentsPanel
          documents={recentDocuments}
          projectId={id}
        />
      </div>

      <div className="mt-8">
        <ImportProgressPanel
          projectId={id}
          categories={importCategories}
          recentDrawings={recentDrawings}
        />
      </div>

      <div className="mt-8">
        <h3 className="font-display text-lg font-semibold text-text-primary">Team</h3>
        <ul className="mt-3 divide-y divide-border-subtle rounded-xl border border-border-subtle">
          {team.length === 0 ? (
            <li className="px-4 py-3 text-sm text-text-tertiary">No team members yet.</li>
          ) : (
            team.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="text-text-primary">{member.name}</span>
                <span className="rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-text-secondary">{toDisplayRoleName(member.role)}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
