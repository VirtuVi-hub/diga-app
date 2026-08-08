import { EVENT_TYPES } from "@/lib/events/event-types";
import { buildNotificationCopy } from "@/lib/notifications/notification-copy";
import { resolveAgreementParties, resolveMainClientPersonId, resolveTeamExcluding } from "@/lib/notifications/recipient-resolution";
import { NotificationRepository } from "@/lib/repositories/notification-repository";
import type { Event } from "@/types/event";
import type { Notification, NotificationType } from "@/lib/types/notification";

/**
 * Sprint 5.9, Module 1: the Notification Center's real logic — replaces
 * the placeholder `notifications-subscriber.ts` that used to just append
 * events to an in-memory array. Every notification is created from real
 * project data (`lib/notifications/recipient-resolution.ts`), never
 * fabricated. `handleEvent()` is the one dispatch point the subscriber
 * calls; each notify* method below owns one of the 6 required types.
 *
 * Deliberately has NO dependency on "who is currently signed in"
 * (`getCurrentPerson()`) — this module is reachable from a client bundle
 * via `notifications-subscriber.ts` -> `event-publisher.ts` ->
 * `revision-service.ts` -> ... -> `useDeltaPanel.ts`, and
 * `lib/auth/current-person.ts` depends on `next/headers`. Reading/writing
 * "my own" notifications (list/unread-count/mark-read) is a genuinely
 * different, per-request concern and lives entirely in
 * `lib/actions/notification-actions.ts` (a real `"use server"` file,
 * where that dependency is safe) instead of here.
 */
export class NotificationService {
  static async handleEvent(event: Event): Promise<void> {
    if (!event.projectId) return; // every notification type here is project-scoped

    switch (event.eventType) {
      case EVENT_TYPES.AGREEMENT_ACCEPTED:
        await this.notifyAgreementApproved(event.projectId);
        break;
      case EVENT_TYPES.AGREEMENT_UPLOADED:
        await this.notifyWaitingForApproval(event.projectId);
        break;
      case EVENT_TYPES.DISCUSSION_CREATED:
        if (typeof event.metadata?.clauseRef === "string" && event.metadata.clauseRef) {
          await this.notifyAgreementDiscussionStarted(event.projectId);
        }
        break;
      case EVENT_TYPES.DISCUSSION_REPLIED:
        if (typeof event.metadata?.clauseRef === "string" && event.metadata.clauseRef) {
          await this.notifyAgreementDiscussionReplied(event.projectId, event.actor.id, typeof event.metadata.authorName === "string" ? event.metadata.authorName : undefined);
        }
        break;
      case EVENT_TYPES.PARTICIPANT_JOINED: {
        const newMemberId = typeof event.metadata?.personId === "string" ? event.metadata.personId : null;
        const invitedBy = typeof event.metadata?.invitedBy === "string" ? event.metadata.invitedBy : null;
        const roleName = typeof event.metadata?.roleName === "string" ? event.metadata.roleName : undefined;
        const newMemberName = typeof event.metadata?.title === "string" ? event.metadata.title : undefined;
        const isMainClientInvite = event.metadata?.isMainClientInvite === true;

        if (invitedBy) await this.notifyInvitationAccepted(event.projectId, invitedBy, newMemberName, roleName);
        if (!isMainClientInvite) await this.notifyTeamMemberJoined(event.projectId, newMemberId, newMemberName, roleName);
        if (isMainClientInvite) await this.notifyWaitingForApproval(event.projectId);
        break;
      }
      default:
        break;
    }
  }

  private static async create(projectId: string, recipientPersonId: string, type: NotificationType, params: { actorName?: string; roleName?: string }, dedupKey?: string, sourceEventType?: string): Promise<Notification | null> {
    const copy = buildNotificationCopy(type, { projectId, ...params });
    return NotificationRepository.create({
      project_id: projectId,
      recipient_person_id: recipientPersonId,
      notification_type: type,
      title: copy.title,
      body: copy.body,
      primary_action_label: copy.primaryActionLabel ?? null,
      primary_action_url: copy.primaryActionUrl ?? null,
      secondary_action_label: copy.secondaryActionLabel ?? null,
      source_event_type: sourceEventType ?? null,
      dedup_key: dedupKey ?? null,
    });
  }

  /** Agreement Approved -> the Lead Architect(s), with the brief's exact "Begin Project Setup"/"Later" copy. */
  static async notifyAgreementApproved(projectId: string): Promise<void> {
    const { leadArchitectIds } = await resolveAgreementParties(projectId);
    for (const personId of leadArchitectIds) {
      await this.create(projectId, personId, "agreement_approved", {}, undefined, EVENT_TYPES.AGREEMENT_ACCEPTED);
    }
  }

  /** Waiting for Your Approval -> the Main Client, once an Agreement exists and they're assigned. De-duped so this never spams the same recipient twice. */
  static async notifyWaitingForApproval(projectId: string): Promise<void> {
    const mainClientPersonId = await resolveMainClientPersonId(projectId);
    if (!mainClientPersonId) return;

    await this.create(projectId, mainClientPersonId, "waiting_for_approval", {}, `waiting_for_approval:${projectId}:${mainClientPersonId}`);
  }

  /**
   * Agreement Discussion Started -> both parties (Lead Architect(s), Main
   * Client). Cannot exclude whoever actually opened it: `DISCUSSION_CREATED`'s
   * `actor.id` is always `null` (a documented, frozen `DiscussionService.create()`
   * limitation, not something this sprint may change) — an honest,
   * minor over-notification (the opener also sees their own action) beats
   * guessing.
   */
  static async notifyAgreementDiscussionStarted(projectId: string): Promise<void> {
    const { leadArchitectIds, mainClientPersonId } = await resolveAgreementParties(projectId);
    const recipients = new Set([...leadArchitectIds, ...(mainClientPersonId ? [mainClientPersonId] : [])]);

    for (const personId of recipients) {
      await this.create(projectId, personId, "agreement_discussion_started", {}, undefined, EVENT_TYPES.DISCUSSION_CREATED);
    }
  }

  /** Agreement Discussion Replied -> the other party, excluding the real replier (known from the event itself — `addMessage()`'s `author.id` is a real person id, unlike `DISCUSSION_CREATED`'s). */
  static async notifyAgreementDiscussionReplied(projectId: string, replyAuthorId: string | null, replyAuthorName?: string): Promise<void> {
    const { leadArchitectIds, mainClientPersonId } = await resolveAgreementParties(projectId);
    const recipients = new Set([...leadArchitectIds, ...(mainClientPersonId ? [mainClientPersonId] : [])]);
    if (replyAuthorId) recipients.delete(replyAuthorId);

    for (const personId of recipients) {
      await this.create(projectId, personId, "agreement_discussion_replied", { actorName: replyAuthorName }, undefined, EVENT_TYPES.DISCUSSION_REPLIED);
    }
  }

  /** Invitation Accepted -> the person who sent the invitation. */
  static async notifyInvitationAccepted(projectId: string, invitedByPersonId: string, newMemberName?: string, roleName?: string): Promise<void> {
    await this.create(projectId, invitedByPersonId, "invitation_accepted", { actorName: newMemberName, roleName }, undefined, EVENT_TYPES.PARTICIPANT_JOINED);
  }

  /** Team Member Joined -> the rest of the active project team, excluding the person who just joined. */
  static async notifyTeamMemberJoined(projectId: string, newMemberId: string | null, newMemberName?: string, roleName?: string): Promise<void> {
    const team = await resolveTeamExcluding(projectId, newMemberId);
    for (const member of team) {
      await this.create(projectId, member.personId, "team_member_joined", { actorName: newMemberName, roleName }, undefined, EVENT_TYPES.PARTICIPANT_JOINED);
    }
  }
}
