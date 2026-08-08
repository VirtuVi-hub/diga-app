import { createServerSupabaseClient } from "@/supabase/server";

/** Sprint 5.7: a small, generic helper for resolving `people.id`s to display names — needed by Document Revision Intelligence (who uploaded each revision) and reusable anywhere else a bare person id needs a name. */
export class PeopleRepository {
  static async getNamesByIds(ids: (string | null)[]): Promise<Record<string, string>> {
    const uniqueIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
    if (uniqueIds.length === 0) return {};

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("people").select("id, first_name, last_name").in("id", uniqueIds);
    if (error) throw new Error(error.message);

    return Object.fromEntries((data ?? []).map((person) => [person.id, `${person.first_name} ${person.last_name}`.trim()]));
  }
}
