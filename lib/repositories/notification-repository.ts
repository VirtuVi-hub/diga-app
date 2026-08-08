import { createServiceSupabaseClient } from "@/supabase/service";
import type { CreateNotificationInput, Notification } from "@/lib/types/notification";

/**
 * Real, Supabase-backed repository (Sprint 5.9). Deliberately uses the
 * service-role client (not the request-scoped `createServerSupabaseClient()`,
 * which depends on `next/headers`) for two reasons: (1) recipient privacy
 * here is enforced at the query layer — every read filters
 * `.eq("recipient_person_id", personId)` — not by RLS, matching this
 * codebase's uniformly permissive-RLS convention (see the migration's own
 * comment); (2) `NotificationsSubscriber` (a plain module, no "use server"
 * boundary) is transitively reachable from a client bundle via
 * `event-publisher.ts` -> `revision-service.ts` -> ... ->
 * `useDeltaPanel.ts`, so anything it imports must never depend on
 * `next/headers` — the same client-bundle-leak class of bug Sprint 5.4
 * first hit and documented.
 */
export class NotificationRepository {
  /**
   * Returns `null` (not a thrown error) when `dedup_key` collides with an
   * existing row — the unique index (`idx_notifications_dedup`) is the
   * de-dup mechanism itself; a collision means "this situation already
   * has a notification," a safe no-op, not a failure.
   */
  static async create(input: CreateNotificationInput): Promise<Notification | null> {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase.from("notifications").insert(input).select("*").single();

    if (error) {
      if (error.code === "23505") return null; // unique_violation on dedup_key
      throw new Error(error.message);
    }
    return data;
  }

  static async listForRecipient(personId: string, projectId: string, limit = 30): Promise<Notification[]> {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_person_id", personId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async unreadCount(personId: string, projectId: string): Promise<number> {
    const supabase = createServiceSupabaseClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_person_id", personId)
      .eq("project_id", projectId)
      .is("read_at", null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  static async markRead(id: string, personId: string): Promise<void> {
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("recipient_person_id", personId);
    if (error) throw new Error(error.message);
  }

  static async markAllRead(personId: string, projectId: string): Promise<void> {
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_person_id", personId)
      .eq("project_id", projectId)
      .is("read_at", null);

    if (error) throw new Error(error.message);
  }
}
