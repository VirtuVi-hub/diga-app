import { notFound, redirect } from "next/navigation";
import { getAgreementReviewContext } from "@/lib/actions/agreement-actions";
import { listProjectInvitations } from "@/lib/actions/project-invitation-actions";
import { getFirmContext, listFirmMembers } from "@/lib/actions/firm-actions";
import { resolveAgreementViewer } from "@/lib/permissions/agreement-role";
import { RolesRepository } from "@/lib/repositories/roles-repository";
import { AgreementWorkspace } from "@/components/agreement/AgreementWorkspace";
import { createServerSupabaseClient } from "@/supabase/server";
import { WORKSPACE_FEED_MAX_WIDTH_CLASS, WORKSPACE_FEED_PADDING_CLASS } from "@/lib/workspace-layout";

export const dynamic = "force-dynamic";

async function getProject(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("projects").select("id, name, lifecycle_stage, main_client_person_id").eq("id", id).maybeSingle();
  return data;
}

/**
 * Sprint 5.7, Modules 1-3: Agreement First workflow. Agreement upload is
 * mandatory — this page IS the only path onto the rest of the platform for
 * a new project, reached via the activation gate whenever
 * `lifecycle_stage` is `draft`/`agreement_review`/`agreement_accepted`.
 *
 * Post-launch fix (stabilizing Sprint 5.8): resolves who is actually
 * looking at the page (`resolveAgreementViewer()`) and passes that down —
 * this page used to render the exact same tree for the Lead Architect and
 * the invited Main Client, meaning the client saw the firm's own
 * administration UI. Invitation data (including invite codes) is now only
 * ever fetched for the Lead Architect — not fetched-but-hidden for the
 * Main Client, genuinely never sent to their page payload at all.
 */
export default async function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const viewer = await resolveAgreementViewer(id);
  if (!viewer) redirect("/auth");

  const isLeadArchitect = viewer.role === "lead_architect";

  const [reviewContext, invitations, mainClientRoleId, firmContext] = await Promise.all([
    getAgreementReviewContext(id),
    isLeadArchitect ? listProjectInvitations(id) : Promise.resolve([]),
    isLeadArchitect ? RolesRepository.getRoleIdByName("Main Client") : Promise.resolve(null),
    isLeadArchitect ? getFirmContext() : Promise.resolve({ person: null, firm: null }),
  ]);

  const firmMembers = isLeadArchitect && firmContext.firm ? await listFirmMembers(firmContext.firm.id) : [];

  return (
    <div className={`mx-auto w-full ${WORKSPACE_FEED_MAX_WIDTH_CLASS} ${WORKSPACE_FEED_PADDING_CLASS}`}>
      <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">Agreement First</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-text-primary">{project.name}</h1>
      <p className="mt-1 text-sm text-text-secondary">The project cannot become Active until the Main Client accepts the Agreement.</p>

      <div className="mt-8">
        <AgreementWorkspace
          projectId={id}
          projectName={project.name}
          lifecycleStage={project.lifecycle_stage}
          hasMainClient={Boolean(project.main_client_person_id)}
          agreement={reviewContext.agreement}
          discussions={reviewContext.discussions}
          roster={reviewContext.roster}
          invitations={invitations}
          viewer={viewer}
          mainClientRoleId={mainClientRoleId}
          firmMembers={firmMembers}
        />
      </div>
    </div>
  );
}
