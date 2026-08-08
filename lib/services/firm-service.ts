import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { FirmRepository } from "@/lib/repositories/firm-repository";
import type { CreateFirmInput, Firm, FirmInvitation, FirmMember } from "@/lib/types/firm";

export class FirmService {
  static async getGeneralRoles() {
    return FirmRepository.getGeneralRoles();
  }

  static async getFirmForPerson(personId: string) {
    return FirmRepository.getFirmForPerson(personId);
  }

  static async getFirm(firmId: string) {
    return FirmRepository.getFirm(firmId);
  }

  /**
   * Module 8: publishes `firm.created.v1` through the unmodified Event
   * Engine — reused, not duplicated. `ownerName` (not `ownerPersonId`) is
   * used as the Event's `actor.id`: every existing Timeline summary
   * builder (`withActor()`, `timeline-projection.ts`) inserts `actor.id`
   * directly into a human-readable sentence, since every prior sprint's
   * mock data used a display name as the id itself. Real auth introduces
   * real UUIDs for `Person.id` — passing one as `actor.id` would render a
   * raw UUID in the Timeline (caught live during this sprint's own
   * verification), so the display name is threaded through instead,
   * matching the existing convention rather than changing it.
   */
  static async createFirm(input: CreateFirmInput, ownerPersonId: string, ownerRoleId: string, ownerName: string, ownerAuthUserId: string): Promise<Firm> {
    const firm = await FirmRepository.createFirm(input, ownerPersonId, ownerRoleId, ownerAuthUserId);

    await publishSafely({
      eventType: EVENT_TYPES.FIRM_CREATED,
      actor: { type: "person", id: ownerName },
      metadata: { title: firm.name, firmId: firm.id },
    });

    return firm;
  }

  static async getFirmByInviteCode(code: string) {
    return FirmRepository.getFirmByInviteCode(code);
  }

  static async joinFirm(firmId: string, personId: string, roleId: string): Promise<void> {
    return FirmRepository.joinFirm(firmId, personId, roleId);
  }

  static async joinFirmByInviteCode(code: string, roleId: string): Promise<Firm> {
    return FirmRepository.joinByInviteCode(code, roleId);
  }

  static async listMembers(firmId: string) {
    return FirmRepository.listMembers(firmId);
  }

  static async listInvitations(firmId: string) {
    return FirmRepository.listInvitations(firmId);
  }

  /** Module 8: publishes `member.invited.v1`. No real email delivery (Module 1) — the invite code is returned for the caller to display/share manually. `invitedByName` is used as the Event's `actor.id` — see `createFirm()`'s own comment for why. */
  static async inviteMember(params: { firmId: string; email: string; roleId: string; invitedBy: string; invitedByName: string }): Promise<FirmInvitation> {
    const invitation = await FirmRepository.createInvitation(params);
    const firm = await FirmRepository.getFirm(params.firmId);

    await publishSafely({
      eventType: EVENT_TYPES.MEMBER_INVITED,
      actor: { type: "person", id: params.invitedByName },
      metadata: { title: params.email, firmId: params.firmId, firmName: firm?.name },
    });

    return invitation;
  }

  static async getFirmMemberRecord(firmId: string, personId: string): Promise<FirmMember | null> {
    const members = await FirmRepository.listMembers(firmId);
    return members.find((member) => member.person_id === personId) ?? null;
  }
}
