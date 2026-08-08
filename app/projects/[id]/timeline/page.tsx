import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/supabase/server";
import { getTimeline } from "@/lib/actions/event-actions";
import { getRecommendations } from "@/lib/actions/recommendation-actions";
import { WORKSPACE_FEED_MAX_WIDTH_CLASS, WORKSPACE_FEED_PADDING_CLASS } from "@/lib/workspace-layout";
import { TimelineView } from "@/components/timeline/TimelineView";
import { RecommendationPanel } from "@/components/recommendations/RecommendationPanel";
import { requireActiveProject } from "@/lib/governance/activation-gate";

export const dynamic = "force-dynamic";

async function projectExists(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("projects").select("id").eq("id", id).single();

  return !error && !!data;
}

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await projectExists(id))) {
    notFound();
  }
  await requireActiveProject(id);

  const [entries, recommendations] = await Promise.all([getTimeline(), getRecommendations({ status: "open" })]);
  const newestFirst = entries.slice().reverse();

  // Sprint 4.9 (§6B) — "Next step" hints on Timeline entries reuse the same
  // open Recommendations this page already fetches for the panel above;
  // never a separate computation, never invented when none exists.
  const nextStepByNodeId: Record<string, string> = {};
  for (const recommendation of recommendations) {
    const nodeId = recommendation.relatedNodes[0]?.id;
    if (nodeId && !nextStepByNodeId[nodeId]) {
      nextStepByNodeId[nodeId] = recommendation.title;
    }
  }

  return (
    // Sprint 4.9 (§8) — page consistency: reuses the Journal's own shared
    // padding/max-width constants (`lib/workspace-layout.ts`) instead of
    // rendering full-bleed with no margins, matching every other workspace
    // page without redesigning anything.
    <div className={`mx-auto w-full ${WORKSPACE_FEED_MAX_WIDTH_CLASS} ${WORKSPACE_FEED_PADDING_CLASS}`}>
      <h2 className="font-display text-2xl font-semibold text-text-primary">Timeline</h2>
      <p className="mt-1 text-text-secondary">How this project&apos;s knowledge has evolved.</p>

      <div className="mt-6">
        <RecommendationPanel
          projectId={id}
          initialRecommendations={recommendations}
        />
      </div>

      <div className="mt-8">
        <TimelineView
          projectId={id}
          entries={newestFirst}
          nextStepByNodeId={nextStepByNodeId}
        />
      </div>
    </div>
  );
}
