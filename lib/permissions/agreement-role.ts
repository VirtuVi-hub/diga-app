import { getCurrentPerson } from "@/lib/auth/current-person";
import { listProjectTeam } from "@/lib/actions/project-actions";
import { listProjectDelegations } from "@/lib/actions/delegation-actions";
import { canActOnBehalfOf } from "@/lib/governance/authority";
import { ProjectGovernanceRepository } from "@/lib/repositories/project-governance-repository";

/**
 * Post-launch fix (stabilizing Sprint 5.8): the Agreement page had no
 * concept of "who is looking at this" at all — Lead Architect and Main
 * Client saw the exact same component tree, meaning the invited client
 * saw the firm's own administration UI (Invite Main Client, Copy
 * Invitation Link, Share on WhatsApp). This is the one place that
 * resolution now lives — mirrors the existing "one function, one place"
 * precedent `lib/permissions/project-info-ui.ts`'s `canViewProjectInfo()`
 * already established, but real (there is a real signed-in user to check
 * against, unlike that pre-authentication-era stub).
 *
 * Deliberately a plain server-only function (not a "use server" action) —
 * same calling convention as `lib/governance/activation-gate.ts`'s
 * `requireActiveProject()`, callable directly from a Server Component
 * (`agreement/page.tsx`) or from within another "use server" action file.
 */
export type AgreementViewerRole = "lead_architect" | "main_client" | "other";

export type AgreementViewer = {
  personId: string;
  personName: string;
  role: AgreementViewerRole;
  /** True for the real Main Client, or a Lead Architect currently holding an active delegation of the Main Client's approval authority (Sprint 5.7, Module 9). Governs Accept/Request Revision specifically — never the Lead Architect's own administration actions (upload/invite), which delegation does not extend to. */
  canApprove: boolean;
};

async function isLeadArchitectFor(projectId: string, personId: string, ownerId: string | null): Promise<boolean> {
  if (ownerId === personId) return true;

  // Before Project Setup's Team step runs (Sprint 5.7, Module 12 — only
  // reachable after Agreement acceptance), the only real project_team row
  // is the Owner's own, added at project creation. This lookup exists for
  // after that point (or for a project whose ownership/lead was
  // reassigned), not because it's expected to fire during Agreement review
  // itself.
  const team = await listProjectTeam(projectId);
  return team.some((member) => member.personId === personId && (member.role === "Lead Architect" || member.role === "Owner"));
}

export async function resolveAgreementViewer(projectId: string): Promise<AgreementViewer | null> {
  const person = await getCurrentPerson();
  if (!person) return null;

  const personName = `${person.first_name} ${person.last_name}`.trim();
  const info = await ProjectGovernanceRepository.get(projectId);

  if (info.mainClientPersonId === person.id) {
    return { personId: person.id, personName, role: "main_client", canApprove: true };
  }

  if (await isLeadArchitectFor(projectId, person.id, info.ownerId)) {
    const delegations = await listProjectDelegations(projectId);
    const canApprove = canActOnBehalfOf(person.id, info.mainClientPersonId, delegations);
    return { personId: person.id, personName, role: "lead_architect", canApprove };
  }

  return { personId: person.id, personName, role: "other", canApprove: false };
}

/** Server-side enforcement for actions — the UI restriction alone is not authorization. Throws the same honest, user-facing message style every other guarded action in this codebase already uses. */
export async function requireAgreementRole(projectId: string, allowedRoles: AgreementViewerRole[], message: string): Promise<AgreementViewer> {
  const viewer = await resolveAgreementViewer(projectId);
  if (!viewer || !allowedRoles.includes(viewer.role)) {
    throw new Error(message);
  }
  return viewer;
}

/** Server-side enforcement for the two actions delegation genuinely extends to (Accept, Request Revision) — real Main Client or their active delegate, never a Lead Architect acting on their own administration authority. */
export async function requireApprovalAuthority(projectId: string, message: string): Promise<AgreementViewer> {
  const viewer = await resolveAgreementViewer(projectId);
  if (!viewer || !viewer.canApprove) {
    throw new Error(message);
  }
  return viewer;
}
