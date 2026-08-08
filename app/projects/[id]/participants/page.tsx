import { notFound } from "next/navigation";
import { getFirmContext, listFirmMembers } from "@/lib/actions/firm-actions";
import { getProjectMainClient, listProjectMembership } from "@/lib/actions/project-actions";
import { listProjectInvitations } from "@/lib/actions/project-invitation-actions";
import { listProjectDelegations } from "@/lib/actions/delegation-actions";
import { FirmRepository } from "@/lib/repositories/firm-repository";
import { RolesRepository } from "@/lib/repositories/roles-repository";
import { toDisplayRoleName } from "@/lib/roles/display-role-name";
import { ParticipantsClient } from "@/components/participants/ParticipantsClient";
import { createServerSupabaseClient } from "@/supabase/server";
import { WORKSPACE_FEED_MAX_WIDTH_CLASS, WORKSPACE_FEED_PADDING_CLASS } from "@/lib/workspace-layout";

export const dynamic = "force-dynamic";

async function getProjectName(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("projects").select("id, name").eq("id", id).maybeSingle();
  return data;
}

/**
 * Sprint 5.7, Modules 5-9: the real Project Membership page — was
 * "Coming Soon." Separates Firm Membership from Project Membership
 * (Module 5), supports project invitations (Module 6), extensible
 * participant categories (Module 7), Authority & Delegation (Module 8),
 * and the Main Client (Module 9).
 */
export default async function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectName(id);
  if (!project) notFound();

  const [membership, invitations, delegations, projectRoles, mainClient, firmContext] = await Promise.all([
    listProjectMembership(id),
    listProjectInvitations(id),
    listProjectDelegations(id),
    FirmRepository.getProjectRoles(),
    getProjectMainClient(id),
    getFirmContext(),
  ]);

  const firmMembers = firmContext.firm ? await listFirmMembers(firmContext.firm.id) : [];
  const mainClientRoleId = await RolesRepository.getRoleIdByName("Main Client");

  const authorityHolders = [
    ...(mainClient.personId && mainClientRoleId ? [{ personId: mainClient.personId, name: mainClient.personName ?? "Main Client", roleId: mainClientRoleId, roleName: "Main Client" }] : []),
    // Sprint 5.9, Module 6: also match "Owner" defensively (pre-migration
    // data in an environment where the data fix hasn't run yet) — every
    // project creator now genuinely holds "Lead Architect" going forward.
    ...membership
      .filter((member) => (member.role === "Lead Architect" || member.role === "Owner") && member.status === "active")
      .map((member) => ({ personId: member.personId, name: member.name, roleId: member.roleId, roleName: toDisplayRoleName(member.role) })),
  ];

  return (
    <div className={`mx-auto w-full ${WORKSPACE_FEED_MAX_WIDTH_CLASS} ${WORKSPACE_FEED_PADDING_CLASS}`}>
      <h2 className="font-display text-2xl font-semibold text-text-primary">Project Team</h2>
      <p className="mt-1 text-text-secondary">A person may belong to many projects. Project invitations are separate from Firm invitations.</p>

      <div className="mt-8">
        <ParticipantsClient
          projectId={id}
          projectName={project.name}
          membership={membership}
          invitations={invitations}
          delegations={delegations}
          projectRoles={projectRoles}
          mainClient={mainClient}
          authorityHolders={authorityHolders}
          firmMembers={firmMembers}
        />
      </div>
    </div>
  );
}
