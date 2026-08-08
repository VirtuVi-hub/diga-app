import { createServerSupabaseClient } from "@/supabase/server";
import type { CreateDelegationInput, Delegation } from "@/lib/types/delegation";

type DelegationRow = Delegation & {
  original: { first_name: string; last_name: string } | null;
  delegate: { first_name: string; last_name: string } | null;
  role: { name: string } | null;
};

const SELECT = `
  id, project_id, original_authority_person_id, original_authority_role_id,
  delegate_person_id, reason, start_date, end_date, status,
  revoked_at, revoked_by, revocation_reason, created_by, created_at, updated_at,
  original:people!original_authority_person_id(first_name, last_name),
  delegate:people!delegate_person_id(first_name, last_name),
  role:roles(name)
`;

function toDelegation(row: DelegationRow): Delegation {
  const { original, delegate, role, ...delegation } = row;
  return {
    ...delegation,
    original_authority_person_name: original ? `${original.first_name} ${original.last_name}`.trim() : undefined,
    delegate_person_name: delegate ? `${delegate.first_name} ${delegate.last_name}`.trim() : undefined,
    original_authority_role_name: role?.name,
  };
}

/** Real, Supabase-backed repository (Sprint 5.7, Module 8) — standard pattern, matching `FirmRepository`/`ProjectInvitationRepository`. */
export class DelegationRepository {
  static async create(input: CreateDelegationInput): Promise<Delegation> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("delegations")
      .insert({
        project_id: input.projectId,
        original_authority_person_id: input.originalAuthorityPersonId,
        original_authority_role_id: input.originalAuthorityRoleId,
        delegate_person_id: input.delegatePersonId,
        reason: input.reason,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        created_by: input.createdBy,
      })
      .select(SELECT)
      .single<DelegationRow>();

    if (error || !data) throw new Error(error?.message ?? "Failed to create delegation.");
    return toDelegation(data);
  }

  static async listByProject(projectId: string): Promise<Delegation[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("delegations")
      .select(SELECT)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .returns<DelegationRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toDelegation);
  }

  static async listActiveForPerson(projectId: string, personId: string): Promise<Delegation[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("delegations")
      .select(SELECT)
      .eq("project_id", projectId)
      .eq("original_authority_person_id", personId)
      .eq("status", "active")
      .returns<DelegationRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toDelegation);
  }

  static async get(id: string): Promise<Delegation | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("delegations").select(SELECT).eq("id", id).maybeSingle<DelegationRow>();
    if (error) throw new Error(error.message);
    return data ? toDelegation(data) : null;
  }

  static async revoke(id: string, revokedBy: string, reason?: string): Promise<Delegation> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("delegations")
      .update({ status: "revoked", revoked_at: new Date().toISOString(), revoked_by: revokedBy, revocation_reason: reason ?? null })
      .eq("id", id)
      .select(SELECT)
      .single<DelegationRow>();

    if (error || !data) throw new Error(error?.message ?? "Failed to revoke delegation.");
    return toDelegation(data);
  }
}
