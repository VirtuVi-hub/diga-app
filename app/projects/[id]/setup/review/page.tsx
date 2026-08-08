import { notFound } from "next/navigation";
import { getAllKnowledgeObjects } from "@/lib/actions/knowledge-object-actions";
import { generateProjectUnderstandingDraft, getProjectSetupContext } from "@/lib/actions/project-setup-actions";
import { getProjectSetupGaps } from "@/lib/project-setup/setup-gaps";
import { requireAgreementAccepted } from "@/lib/governance/activation-gate";
import { DeltaProjectReviewPanel } from "@/components/project-setup/DeltaProjectReviewPanel";
import { WORKSPACE_FEED_MAX_WIDTH_CLASS, WORKSPACE_FEED_PADDING_CLASS } from "@/lib/workspace-layout";

export const dynamic = "force-dynamic";

/**
 * Sprint 5.7, Module 14: Delta Project Review. Before activation, Delta
 * presents Project Understanding, Imported Documents, Requirements,
 * Constraints, Missing Information, and Outstanding Discussions. This is
 * NOT project approval — it confirms initialization of the project's
 * knowledge (Module 15 gates on `review_completed_at`, not a separate
 * approval flag).
 */
export default async function DeltaProjectReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await requireAgreementAccepted(id);
  const [context, allObjects, gaps] = await Promise.all([getProjectSetupContext(id), getAllKnowledgeObjects(), getProjectSetupGaps(id)]);
  if (!context.project) notFound();

  const objects = allObjects.filter((object) => object.projectId === id);
  const understandingDraft = context.setupProgress?.setup.understanding_text ?? (await generateProjectUnderstandingDraft(id));

  return (
    <div className={`mx-auto w-full ${WORKSPACE_FEED_MAX_WIDTH_CLASS} ${WORKSPACE_FEED_PADDING_CLASS}`}>
      <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">Delta Project Review</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-text-primary">{context.project.name}</h1>
      <p className="mt-1 text-sm text-text-secondary">Confirming Delta&apos;s understanding is not project approval — it confirms initialization of the project&apos;s knowledge.</p>

      <div className="mt-8">
        <DeltaProjectReviewPanel
          projectId={id}
          understandingDraft={understandingDraft}
          alreadyConfirmed={Boolean(context.setupProgress?.setup.review_completed_at)}
          documents={context.documents}
          objects={objects}
          gaps={gaps}
          outstandingDiscussions={context.outstandingDiscussions}
        />
      </div>
    </div>
  );
}
