import { notFound } from "next/navigation";
import { getProjectSetupContext, startProjectSetup } from "@/lib/actions/project-setup-actions";
import { requireAgreementAccepted } from "@/lib/governance/activation-gate";
import { ProjectSetupChecklist } from "@/components/project-setup/ProjectSetupChecklist";
import { WORKSPACE_FEED_MAX_WIDTH_CLASS, WORKSPACE_FEED_PADDING_CLASS } from "@/lib/workspace-layout";

export const dynamic = "force-dynamic";

/**
 * Sprint 5.7, Module 12 (reordered/automated in Sprint 5.9): Project
 * Setup. Reached after Agreement acceptance — guides the Lead Architect
 * through Design Team, Consultants, Client Representatives, Import
 * Existing Project, Client Questionnaire, and Delta Review, with honest,
 * automatically-computed progress (no fabricated percentages, no manual
 * "Mark Complete"). Sprint 5.8, Module 5: `requireAgreementAccepted()`
 * enforces "after Agreement acceptance" for real — this page used to have
 * no guard of its own.
 */
export default async function ProjectSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await requireAgreementAccepted(id);
  await startProjectSetup(id);
  const context = await getProjectSetupContext(id);
  if (!context.project) notFound();

  return (
    <div className={`mx-auto w-full ${WORKSPACE_FEED_MAX_WIDTH_CLASS} ${WORKSPACE_FEED_PADDING_CLASS}`}>
      <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">Project Setup</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-text-primary">{context.project.name}</h1>
      <p className="mt-1 text-sm text-text-secondary">Display progress honestly — nothing here is fabricated.</p>

      <div className="mt-8">
        <ProjectSetupChecklist projectId={id} context={context} />
      </div>
    </div>
  );
}
