"use client";

import { useRouter } from "next/navigation";
import { revokeProjectInvitation } from "@/lib/actions/project-invitation-actions";
import { removeProjectMember } from "@/lib/actions/project-actions";
import { AddParticipantFlow } from "@/components/participants/AddParticipantFlow";
import { InviteShareSheet } from "@/components/invitations/InviteShareSheet";
import { DelegationPanel } from "@/components/governance/DelegationPanel";
import { toDisplayRoleName } from "@/lib/roles/display-role-name";
import type { ProjectMembershipRow, ProjectMainClient } from "@/lib/actions/project-actions";
import type { ProjectInvitation } from "@/lib/types/project-invitation";
import type { Delegation } from "@/lib/types/delegation";
import type { FirmMemberWithDetails } from "@/lib/types/firm";

type ProjectRole = { id: string; name: string; abbreviation: string | null; teamType: string };

type Props = {
  projectId: string;
  projectName: string;
  membership: ProjectMembershipRow[];
  invitations: ProjectInvitation[];
  delegations: Delegation[];
  projectRoles: ProjectRole[];
  mainClient: ProjectMainClient;
  authorityHolders: { personId: string; name: string; roleId: string; roleName: string }[];
  firmMembers: FirmMemberWithDetails[];
};

const STATUS_LABEL: Record<string, string> = { invited: "Invited", active: "Active", removed: "Removed" };
const STATUS_CLASS: Record<string, string> = {
  invited: "bg-info/15 text-info",
  active: "bg-success/15 text-success",
  removed: "bg-surface-tertiary text-text-tertiary",
};

export function ParticipantsClient({ projectId, projectName, membership, invitations, delegations, projectRoles, mainClient, authorityHolders, firmMembers }: Props) {
  const router = useRouter();

  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");
  const activeMembers = membership.filter((member) => member.status !== "removed");
  const delegationCandidates = activeMembers.map((member) => ({ personId: member.personId, name: member.name }));

  async function handleRemove(memberId: string) {
    await removeProjectMember(memberId);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border-subtle bg-surface-secondary p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">Main Client</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {mainClient.personName ? (
            <>
              <span className="rounded-full bg-accent-primary/15 px-3 py-1 text-sm font-medium text-accent-primary">{mainClient.personName}</span> has decision authority by default.
            </>
          ) : (
            "Not yet assigned — invite one from the Agreement page or below."
          )}
        </p>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface-secondary p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">Project Members</h2>
        <ul className="mt-3 divide-y divide-border-subtle rounded-xl border border-border-subtle">
          {activeMembers.length === 0 ? (
            <li className="px-4 py-3 text-sm text-text-tertiary">No members yet.</li>
          ) : (
            activeMembers.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="text-text-primary">{member.name}</span>
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-text-secondary">{toDisplayRoleName(member.role)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASS[member.status]}`}>{STATUS_LABEL[member.status]}</span>
                  <button type="button" onClick={() => handleRemove(member.id)} className="text-xs text-text-tertiary hover:text-error">
                    Remove
                  </button>
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface-secondary p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">Invite Someone</h2>
        <p className="mt-1 text-sm text-text-secondary">Users don&apos;t discover projects — projects invite users. Share via WhatsApp or Copy Link.</p>
        <div className="mt-4">
          <AddParticipantFlow
            projectId={projectId}
            projectName={projectName}
            section="all"
            firmMembers={firmMembers}
            projectRoles={projectRoles}
            excludePersonIds={activeMembers.map((member) => member.personId)}
            onDone={() => router.refresh()}
          />
        </div>
      </section>

      {pendingInvitations.length > 0 && (
        <section className="rounded-2xl border border-border-subtle bg-surface-secondary p-6">
          <h2 className="font-display text-lg font-semibold text-text-primary">Pending Invitations</h2>
          <ul className="mt-3 space-y-4">
            {pendingInvitations.map((invitation) => (
              <li key={invitation.id} className="rounded-xl border border-border-subtle bg-surface-primary p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">
                    {invitation.email ?? invitation.phone ?? "Shareable link"} — {toDisplayRoleName(invitation.role_name) || "Role"}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await revokeProjectInvitation(invitation.id, projectId);
                      router.refresh();
                    }}
                    className="text-xs text-text-tertiary hover:text-error"
                  >
                    Revoke
                  </button>
                </div>
                <InviteShareSheet inviteCode={invitation.invite_code} projectName={projectName} roleName={invitation.role_name ?? "Team Member"} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <DelegationPanel projectId={projectId} delegations={delegations} authorityHolders={authorityHolders} candidates={delegationCandidates} />
    </div>
  );
}

