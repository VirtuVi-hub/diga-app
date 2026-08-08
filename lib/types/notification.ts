/**
 * Notification types (Sprint 5.9, Module 1). Snake_case, mirroring the
 * Supabase schema directly — same convention `lib/types/project-invitation.ts`
 * already established for real, Postgres-backed domains.
 */

export type NotificationType =
  | "agreement_approved"
  | "agreement_discussion_started"
  | "agreement_discussion_replied"
  | "invitation_accepted"
  | "team_member_joined"
  | "waiting_for_approval";

export type Notification = {
  id: string;
  project_id: string;
  recipient_person_id: string;
  notification_type: NotificationType | string;
  title: string;
  body: string;
  primary_action_label: string | null;
  primary_action_url: string | null;
  secondary_action_label: string | null;
  source_event_type: string | null;
  dedup_key: string | null;
  read_at: string | null;
  created_at: string;
};

export type CreateNotificationInput = {
  project_id: string;
  recipient_person_id: string;
  notification_type: NotificationType | string;
  title: string;
  body: string;
  primary_action_label?: string | null;
  primary_action_url?: string | null;
  secondary_action_label?: string | null;
  source_event_type?: string | null;
  dedup_key?: string | null;
};
