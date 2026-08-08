import { createServerSupabaseClient } from "@/supabase/server";

/**
 * Sprint 5.7: a tiny, generic helper over the existing `roles` table,
 * factored out because multiple new governance modules (Agreement Review,
 * Governance Roster, Delegation) all need "look up the role id for a
 * given role name" and none of them owns `roles` — it's shared by Firm
 * Membership and Project Membership alike (Sprint 5.3).
 */
export class RolesRepository {
  static async getRoleIdByName(name: string): Promise<string | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("roles").select("id").eq("name", name).maybeSingle();
    if (error) throw new Error(error.message);
    return data?.id ?? null;
  }
}
