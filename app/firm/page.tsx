import { redirect } from "next/navigation";
import { getFirmContext, getGeneralRoles, listFirmInvitations, listFirmMembers } from "@/lib/actions/firm-actions";
import { getCurrentAuthUser } from "@/lib/auth/current-person";
import { FirmSetup } from "@/components/firm/FirmSetup";
import { FirmTeam } from "@/components/firm/FirmTeam";

export const dynamic = "force-dynamic";

export default async function FirmPage() {
  const user = await getCurrentAuthUser();
  if (!user) {
    redirect("/auth");
  }

  const { person, firm } = await getFirmContext();
  const roles = await getGeneralRoles();

  if (!person) {
    // Should not happen for a real registered user (registerUser() always
    // creates the professional profile), but this is the honest fallback
    // rather than crashing if it ever does.
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-text-primary">
        <h1 className="font-display text-2xl font-semibold">Profile not found</h1>
        <p className="mt-2 text-text-secondary">Your professional profile could not be found. Try signing out and registering again.</p>
      </main>
    );
  }

  if (!firm) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <FirmSetup roles={roles} />
      </main>
    );
  }

  const [members, invitations] = await Promise.all([listFirmMembers(firm.id), listFirmInvitations(firm.id)]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <FirmTeam firm={firm} members={members} invitations={invitations} roles={roles} currentPersonId={person.id} />
    </main>
  );
}
