"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPerson } from "@/lib/auth/current-person";
import { FirmService } from "@/lib/services/firm-service";
import { RolesRepository } from "@/lib/repositories/roles-repository";
import type { CreateFirmInput, Person } from "@/lib/types/firm";

function displayName(person: Person): string {
  return `${person.first_name} ${person.last_name}`.trim();
}

export async function getGeneralRoles() {
  return FirmService.getGeneralRoles();
}

/**
 * The context every Firm-aware page needs: the signed-in person's
 * professional profile, and their Firm membership if one exists — `null`
 * for either is an honest, expected state (a brand-new user has neither
 * yet), never an error.
 */
export async function getFirmContext() {
  const person = await getCurrentPerson();
  if (!person) return { person: null, firm: null };

  const membership = await FirmService.getFirmForPerson(person.id);
  return { person, firm: membership?.firm ?? null };
}

/**
 * Sprint 5.9, Module 6 (role architecture correction): the creating person
 * becomes the Firm's "Lead Architect" — never "Owner". "Owner" is a
 * database implementation detail, not a professional role, and the
 * platform must never expose it. "Lead Architect" lives under the
 * "Design Team" `team_types` row rather than "General", but `roles` is
 * one shared table — `firm_members.role_id` doesn't care which
 * `team_types` bucket a role nominally belongs to.
 */
export async function createFirm(input: CreateFirmInput) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to create a Firm.");

  const leadArchitectRoleId = await RolesRepository.getRoleIdByName("Lead Architect");
  if (!leadArchitectRoleId) throw new Error('The "Lead Architect" role has not been seeded yet.');
  if (!person.auth_user_id) throw new Error("Your account is missing its authentication identity.");

  const firm = await FirmService.createFirm(input, person.id, leadArchitectRoleId, displayName(person), person.auth_user_id);
  revalidatePath("/firm");
  return firm;
}

/** Module 2: Join Firm (invite code placeholder — no real email delivery, per Module 1). */
export async function joinFirmByCode(code: string, roleId: string) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to join a Firm.");

  const firm = await FirmService.joinFirmByInviteCode(code, roleId);
  revalidatePath("/firm");
  return firm;
}

export async function listFirmMembers(firmId: string) {
  return FirmService.listMembers(firmId);
}

export async function listFirmInvitations(firmId: string) {
  return FirmService.listInvitations(firmId);
}

/** Module 3: Invite Team. Returns the invite code for the caller to display/share manually — no real email delivery. */
export async function inviteFirmMember(params: { firmId: string; email: string; roleId: string }) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to invite a team member.");

  const invitation = await FirmService.inviteMember({ ...params, invitedBy: person.id, invitedByName: displayName(person) });
  revalidatePath("/firm");
  return invitation;
}
