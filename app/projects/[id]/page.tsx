import { HomeWorkspace } from "@/components/project-shell/HomeWorkspace";
import { getDiscussions } from "@/lib/actions/discussion-actions";
import { getTimeline } from "@/lib/actions/event-actions";
import { queryRelationships } from "@/lib/actions/relationship-actions";
import { requireActiveProject } from "@/lib/governance/activation-gate";

const RECENT_UPDATES_COUNT = 6;

/**
 * Sprint 5.7: the "project should feel empty but ready" welcome banner
 * (Sprint 5.4) was removed — this page is only reachable once
 * `lifecycle_stage === "active"` (Module 15's activation gate), by which
 * point Project Setup is already complete, so "this project is ready for
 * onboarding" would be stale, contradictory messaging.
 */
export default async function ProjectHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireActiveProject(id);
  const [discussions, relationships, timeline] = await Promise.all([
    getDiscussions(),
    queryRelationships(),
    // Sprint 4.9 (§6D): "Project Updates" is now a real projection of the
    // same Event stream the Timeline page reads — unfiltered by `projectId`
    // for the same reason `getTimeline()` is unfiltered there
    // (`discussion.created.v1` events don't carry one yet).
    getTimeline(),
  ]);
  const recentUpdates = timeline.slice().reverse().slice(0, RECENT_UPDATES_COUNT);

  return (
    <HomeWorkspace
      projectId={id}
      initialDiscussions={discussions}
      relationships={relationships}
      recentUpdates={recentUpdates}
    />
  );
}
