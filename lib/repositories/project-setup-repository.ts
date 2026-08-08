import { createServerSupabaseClient } from "@/supabase/server";
import type { ProjectSetup } from "@/lib/types/project-setup";

export type ProjectSetupPatch = Partial<
  Pick<
    ProjectSetup,
    | "current_step"
    | "team_completed_at"
    | "consultants_completed_at"
    | "client_representatives_completed_at"
    | "import_completed_at"
    | "questionnaire_completed_at"
    | "review_completed_at"
    | "discussion_id"
    | "understanding_text"
  >
>;

/**
 * Real, Supabase-backed repository (Sprint 5.7) — exact structural mirror
 * of `OnboardingRepository`, over the `project_setup` table (its
 * successor).
 */
export class ProjectSetupRepository {
  static async get(projectId: string): Promise<ProjectSetup | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("project_setup").select("*").eq("project_id", projectId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  static async create(projectId: string): Promise<ProjectSetup> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("project_setup").insert({ project_id: projectId }).select("*").single();
    if (error || !data) throw new Error(error?.message ?? "Failed to start Project Setup.");
    return data;
  }

  static async update(projectId: string, patch: ProjectSetupPatch): Promise<ProjectSetup> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("project_setup").update(patch).eq("project_id", projectId).select("*").single();
    if (error || !data) throw new Error(error?.message ?? "Failed to update Project Setup.");
    return data;
  }
}
