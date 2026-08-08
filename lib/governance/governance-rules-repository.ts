import { createServerSupabaseClient } from "@/supabase/server";
import type { GovernanceRule } from "./governance-types";

type GovernanceRuleRow = {
  id: string;
  object_type: string;
  required_role_id: string;
  requirement_kind: "approver" | "notify";
  trigger: "always" | "on_impact";
  sort_order: number;
  roles: { name: string } | null;
};

/** Sprint 5.7, Module 11: read-only access to `governance_rules`, joined with the role name every consumer actually wants. */
export class GovernanceRulesRepository {
  static async listActiveRules(objectType: string): Promise<GovernanceRule[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("governance_rules")
      .select("id, object_type, required_role_id, requirement_kind, trigger, sort_order, roles(name)")
      .eq("object_type", objectType)
      .eq("active", true)
      .order("sort_order")
      .returns<GovernanceRuleRow[]>();

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      id: row.id,
      objectType: row.object_type,
      requiredRoleId: row.required_role_id,
      requiredRoleName: row.roles?.name ?? "Unknown Role",
      requirementKind: row.requirement_kind,
      trigger: row.trigger,
      sortOrder: row.sort_order,
    }));
  }
}
