"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteFirmMember } from "@/lib/actions/firm-actions";
import { toDisplayRoleName } from "@/lib/roles/display-role-name";
import type { Firm, FirmInvitationWithRole, FirmMemberWithDetails, OnboardingRole } from "@/lib/types/firm";

/** Module 2 (Firm profile) + Module 3 (Team Management / Invite). */
export function FirmTeam({
  firm,
  members,
  invitations,
  roles,
  currentPersonId,
}: {
  firm: Firm;
  members: FirmMemberWithDetails[];
  invitations: FirmInvitationWithRole[];
  roles: OnboardingRole[];
  currentPersonId: string;
}) {
  const router = useRouter();

  // Sprint 5.9, Module 6: "Owner" and "Lead Architect" are both
  // auto-granted-only at the Firm level (the creator alone, at creation
  // time) — never manually invitable, so neither appears in this dropdown.
  const invitableRoles = roles.filter((role) => role.name !== "Owner" && role.name !== "Lead Architect");

  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(invitableRoles[0]?.id ?? roles[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastInviteCode, setLastInviteCode] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const invitation = await inviteFirmMember({ firmId: firm.id, email, roleId });
      setLastInviteCode(invitation.invite_code);
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite team member.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">Firm</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-text-primary">{firm.name}</h1>
      <p className="mt-1 text-text-secondary">
        {[firm.city, firm.country].filter(Boolean).join(", ") || "No address on file yet."}
      </p>

      <div className="mt-4 rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
        Invite code: <span className="font-mono text-text-primary">{firm.invite_code}</span> — share this with anyone who should join your Firm.
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-text-primary">Team ({members.length})</h2>
        <ul className="mt-3 divide-y divide-border-subtle rounded-xl border border-border-subtle">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-text-primary">
                  {member.person ? `${member.person.first_name} ${member.person.last_name}` : "Unknown"}
                  {member.person_id === currentPersonId ? " (you)" : ""}
                </p>
                <p className="text-sm text-text-tertiary">{member.person?.email}</p>
              </div>
              <span className="rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-text-secondary">{toDisplayRoleName(member.role?.name) || "Member"}</span>
            </li>
          ))}
        </ul>
      </section>

      {invitations.filter((invitation) => invitation.status === "pending").length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-text-primary">Pending Invitations</h2>
          <ul className="mt-3 divide-y divide-border-subtle rounded-xl border border-border-subtle">
            {invitations
              .filter((invitation) => invitation.status === "pending")
              .map((invitation) => (
                <li key={invitation.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-text-primary">{invitation.email}</p>
                    <p className="font-mono text-xs text-text-tertiary">Code: {invitation.invite_code}</p>
                  </div>
                  <span className="rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-text-secondary">{toDisplayRoleName(invitation.role?.name) || "Member"}</span>
                </li>
              ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-text-primary">Invite Team</h2>
        <p className="mt-1 text-sm text-text-secondary">No email is sent yet — share the generated code manually (Module 1: architecture only).</p>

        <form onSubmit={handleInvite} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="mb-1 block text-sm font-medium text-text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3 text-text-primary outline-none"
              placeholder="colleague@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3 text-text-primary outline-none"
            >
              {invitableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="rounded-full bg-accent-primary px-5 py-3 text-sm font-medium text-white transition disabled:opacity-50"
          >
            {loading ? "Inviting..." : "Send Invite"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}
        {lastInviteCode && (
          <p className="mt-3 rounded-lg border border-border-subtle bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
            Invitation created. Share this code: <span className="font-mono text-text-primary">{lastInviteCode}</span>
          </p>
        )}
      </section>
    </div>
  );
}
