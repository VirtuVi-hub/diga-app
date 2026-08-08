import type { NotificationType } from "@/lib/types/notification";

export type NotificationCopy = {
  title: string;
  body: string;
  primaryActionLabel?: string;
  primaryActionUrl?: string;
  secondaryActionLabel?: string;
};

/**
 * Sprint 5.9, Module 1: one place building the exact copy for each of the
 * 6 required notification types, keeping `NotificationService` thin. The
 * brief's own literal example ("Agreement Approved" / "Begin Project
 * Setup" / "Later") is honored word-for-word.
 */
export function buildNotificationCopy(type: NotificationType, params: { projectId: string; actorName?: string; roleName?: string }): NotificationCopy {
  switch (type) {
    case "agreement_approved":
      return {
        title: "Agreement Approved",
        body: "The Main Client has approved the Project Agreement. You may now begin Project Setup.",
        primaryActionLabel: "Begin Project Setup",
        primaryActionUrl: `/projects/${params.projectId}/setup`,
        secondaryActionLabel: "Later",
      };
    case "waiting_for_approval":
      return {
        title: "Waiting for Your Approval",
        body: "The Project Agreement is ready for your review.",
        primaryActionLabel: "Review Agreement",
        primaryActionUrl: `/projects/${params.projectId}/agreement`,
      };
    case "agreement_discussion_started":
      return {
        title: "Agreement Discussion Started",
        body: params.actorName ? `${params.actorName} opened a discussion on the Project Agreement.` : "A discussion was opened on the Project Agreement.",
        primaryActionLabel: "Open Agreement",
        primaryActionUrl: `/projects/${params.projectId}/agreement`,
      };
    case "agreement_discussion_replied":
      return {
        title: "New Reply on Agreement Discussion",
        body: params.actorName ? `${params.actorName} replied on the Project Agreement.` : "There is a new reply on the Project Agreement.",
        primaryActionLabel: "Open Agreement",
        primaryActionUrl: `/projects/${params.projectId}/agreement`,
      };
    case "invitation_accepted":
      return {
        title: "Invitation Accepted",
        body: params.actorName ? `${params.actorName} accepted your invitation and joined as ${params.roleName ?? "a team member"}.` : "Your invitation was accepted.",
        primaryActionLabel: "View Participants",
        primaryActionUrl: `/projects/${params.projectId}/participants`,
      };
    case "team_member_joined":
      return {
        title: "Team Member Joined",
        body: params.actorName ? `${params.actorName} joined the project as ${params.roleName ?? "a team member"}.` : "A new team member joined the project.",
        primaryActionLabel: "View Participants",
        primaryActionUrl: `/projects/${params.projectId}/participants`,
      };
  }
}
