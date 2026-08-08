import { createServerSupabaseClient } from "@/supabase/server";

export type ProjectGovernanceInfo = {
  lifecycleStage: string;
  mainClientPersonId: string | null;
  mainClientPersonName: string | null;
  /** Sprint 5.8 (post-launch fix): who created the project — the baseline "Lead Architect" authority before any explicit Lead Architect role assignment exists in `project_team` (which only happens during Project Setup, after Agreement acceptance). */
  ownerId: string | null;
};

/**
 * Sprint 5.7: small, direct reads/writes on `projects`' governance
 * columns. There is no general `ProjectRepository` in this codebase today
 * — simple `projects` queries have always lived inline in
 * `lib/actions/project-actions.ts` — so this is scoped narrowly to the
 * governance columns specifically, reused by both the action layer
 * (`getProjectLifecycleStage`/`getProjectMainClient`) and services that
 * need it without crossing the actions layer (`AgreementReviewService`,
 * `ProjectSetupService`).
 */
export class ProjectGovernanceRepository {
  static async get(projectId: string): Promise<ProjectGovernanceInfo> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .select("lifecycle_stage, main_client_person_id, owner_id, main_client:people!main_client_person_id(first_name, last_name)")
      .eq("id", projectId)
      .maybeSingle<{ lifecycle_stage: string; main_client_person_id: string | null; owner_id: string | null; main_client: { first_name: string; last_name: string } | null }>();

    if (error) throw new Error(error.message);
    if (!data) throw new Error(`Project "${projectId}" was not found.`);

    return {
      lifecycleStage: data.lifecycle_stage,
      mainClientPersonId: data.main_client_person_id,
      mainClientPersonName: data.main_client ? `${data.main_client.first_name} ${data.main_client.last_name}`.trim() : null,
      ownerId: data.owner_id,
    };
  }

  static async setLifecycleStage(projectId: string, stage: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("projects").update({ lifecycle_stage: stage }).eq("id", projectId);
    if (error) throw new Error(error.message);
  }
}
