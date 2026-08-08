"use client";

import { useState, useTransition } from "react";
import { addParticipant } from "@/lib/actions/participant-actions";
import { sectionRoleNames, type ParticipantSection } from "@/lib/participants/role-categories";

type FirmMemberOption = { person_id: string; person: { first_name: string; last_name: string } | null };
type ProjectRoleOption = { id: string; name: string; teamType: string };

type Props = {
  projectId: string;
  projectName: string;
  section: ParticipantSection;
  firmMembers: FirmMemberOption[];
  projectRoles: ProjectRoleOption[];
  /** Sprint 5.9.1, Module 2: Firm members already active on this project — excluded from the "pick existing member" list, since re-picking someone already here isn't useful and made the list look empty/pointless in practice (a fresh Firm's only member is usually the Lead Architect, already on the project). */
  excludePersonIds?: string[];
  /** Fixes the role (no dropdown) — used by the Agreement page's Main Client flow. */
  fixedRole?: { id: string; name: string };
  isMainClientInvite?: boolean;
  /** Main Client invitations require a WhatsApp number — every other role's phone stays optional. */
  requirePhone?: boolean;
  onDone?: () => void;
};

/**
 * Sprint 5.9, Module 3 (fixed in 5.9.1): the ONE invitation engine's
 * single UI entry point. One component, two branches:
 *
 * - "Pick an existing Firm member" -> instant assignment, no accept step.
 * - "Invite someone new" -> Choose Role (already fixed here if `fixedRole`
 *   is given) -> Generate Invitation -> Copy Link / Share on WhatsApp.
 *
 * Every caller (Participants page, Agreement's Invite Main Client, each
 * Project Setup section) renders this same component instead of its own
 * hand-rolled form.
 *
 * Sprint 5.9.1, Module 1 fix: this component no longer renders its own
 * persistent "invitation created" card after a successful invite — it
 * previously did (via local `invitation` state + `InviteShareSheet`),
 * which duplicated the SAME invitation once the caller's own already-
 * existing pending-invitations list (Participants' "Pending Invitations",
 * each Project Setup section's own list) refreshed and rendered it too.
 * `onDone()` now fires on every successful add (both branches) so the
 * caller's list is the single, immediate source of truth; this component
 * only shows a short, non-persistent confirmation line.
 */
export function AddParticipantFlow({ projectId, section, firmMembers, projectRoles, excludePersonIds, fixedRole, isMainClientInvite, requirePhone, onDone }: Props) {
  const allowedNames = sectionRoleNames(section);
  const scopedRoles = allowedNames ? projectRoles.filter((role) => allowedNames.includes(role.name)) : projectRoles;
  const pickableFirmMembers = excludePersonIds ? firmMembers.filter((member) => !excludePersonIds.includes(member.person_id)) : firmMembers;

  const [branch, setBranch] = useState<"existing" | "new">(pickableFirmMembers.length > 0 ? "existing" : "new");
  const [roleId, setRoleId] = useState(fixedRole?.id ?? scopedRoles[0]?.id ?? "");
  const [personId, setPersonId] = useState(pickableFirmMembers[0]?.person_id ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedRoleName = fixedRole?.name ?? scopedRoles.find((role) => role.id === roleId)?.name ?? "Team Member";

  function submit() {
    setError("");
    setConfirmation("");
    if (!roleId) {
      setError("Choose a role.");
      return;
    }

    if (branch === "existing") {
      if (!personId) {
        setError("Choose a Firm member.");
        return;
      }
      startTransition(async () => {
        try {
          await addParticipant({ projectId, roleId, roleName: selectedRoleName, isMainClientInvite, existingPersonId: personId });
          onDone?.();
        } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : "Failed to add this person to the project.");
        }
      });
      return;
    }

    if (requirePhone && !phone.trim()) {
      setError("A WhatsApp number is required for this invitation.");
      return;
    }
    if (!requirePhone && !email.trim() && !phone.trim()) {
      setError("Enter an email or phone number.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await addParticipant({
          projectId,
          roleId,
          roleName: selectedRoleName,
          isMainClientInvite,
          inviteeName: name.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        });
        setName("");
        setPhone("");
        setEmail("");
        setConfirmation(result.branch === "invited" ? "Invitation sent — find the share link in the list above." : "Added to the project.");
        onDone?.();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Failed to create the invitation.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {!fixedRole && (
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Role</label>
          <select value={roleId} onChange={(event) => setRoleId(event.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none">
            {scopedRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setBranch("existing")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${branch === "existing" ? "bg-accent-primary text-white" : "bg-surface-tertiary text-text-secondary"}`}
        >
          Pick an existing Firm member
        </button>
        <button
          type="button"
          onClick={() => setBranch("new")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${branch === "new" ? "bg-accent-primary text-white" : "bg-surface-tertiary text-text-secondary"}`}
        >
          Invite someone new
        </button>
      </div>

      {branch === "existing" ? (
        <div>
          {pickableFirmMembers.length === 0 ? (
            <p className="text-sm text-text-tertiary">
              No other Firm members are available to add directly right now — invite people to your Firm from the Firm page, or invite this person directly below.
            </p>
          ) : (
            <select value={personId} onChange={(event) => setPersonId(event.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none">
              {pickableFirmMembers.map((member) => (
                <option key={member.person_id} value={member.person_id}>
                  {member.person ? `${member.person.first_name} ${member.person.last_name}` : "Unknown"}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Name</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">WhatsApp Number{requirePhone ? " (required)" : " (optional)"}</label>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" className="w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Email (optional)</label>
            <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}
      {confirmation && <p className="text-sm text-success">{confirmation}</p>}

      <button type="button" onClick={submit} disabled={isPending} className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
        {isPending ? "Saving..." : branch === "existing" ? "Add to Project" : "Send Invitation"}
      </button>
    </div>
  );
}
