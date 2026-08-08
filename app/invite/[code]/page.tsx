import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentPerson } from "@/lib/auth/current-person";
import { getProjectInvitationLanding } from "@/lib/actions/project-invitation-actions";
import { AcceptInvitationButton } from "@/components/invitations/AcceptInvitationButton";
import { toDisplayRoleName } from "@/lib/roles/display-role-name";

export const dynamic = "force-dynamic";

/**
 * Sprint 5.7, Module 6: "Registration should happen after invitation.
 * Users do not discover projects. Projects invite users." This page is
 * reachable pre-auth (the invitation lookup uses the service-role client,
 * see `ProjectInvitationRepository.getLandingByCode()`) — a signed-out
 * visitor sees who invited them and to what, then registers/signs in and
 * returns here to accept.
 */
export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const landing = await getProjectInvitationLanding(code);
  if (!landing) notFound();

  const person = await getCurrentPerson();
  const alreadyUsed = landing.invitation.status !== "pending";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-primary px-6">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-secondary p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">Project Invitation</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-text-primary">{landing.projectName}</h1>
        <p className="mt-2 text-text-secondary">
          {landing.invitedByName} invited you to join as <span className="font-medium text-text-primary">{toDisplayRoleName(landing.roleName)}</span>.
        </p>

        {alreadyUsed ? (
          <p className="mt-6 text-sm text-text-tertiary">This invitation has already been used or is no longer valid.</p>
        ) : person ? (
          <div className="mt-6">
            <AcceptInvitationButton code={code} />
          </div>
        ) : (
          <div className="mt-6 flex gap-3">
            <Link href={`/auth?redirect=${encodeURIComponent(`/invite/${code}`)}`} className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-medium text-white">
              Sign In
            </Link>
            <Link href={`/auth/register?redirect=${encodeURIComponent(`/invite/${code}`)}`} className="rounded-full border border-border-subtle px-5 py-2.5 text-sm font-medium text-text-secondary">
              Register
            </Link>
          </div>
        )}
        {!person && !alreadyUsed && <p className="mt-3 text-xs text-text-tertiary">After signing in or registering, you&apos;ll be brought straight back here to accept.</p>}
      </div>
    </main>
  );
}
