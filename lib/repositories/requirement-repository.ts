import { createServerSupabaseClient } from "@/supabase/server";
import type { RequirementListItem } from "@/lib/types/requirement";

export class RequirementRepository {
  static async list(projectId: string): Promise<RequirementListItem[]> {
    const supabase = await createServerSupabaseClient();

    // Test 1: Can we read projects?
    const projectsTest = await supabase.from("projects").select("id").limit(1);
    console.log("Projects test:", projectsTest);

    // Test 2: Can we read requirements?
    const requirementsTest = await supabase
      .from("requirements")
      .select("*")
      .limit(1);

    console.log("Requirements test:", requirementsTest);

    const { data, error } = await supabase
      .from("requirements")
      .select("*")
      .eq("project_id", projectId)
      .order("requirement_number");

    if (error) {
      console.error(error);
      throw new Error(error.message);
    }

    return (data ?? []) as RequirementListItem[];
  }

  static async get(id: string) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("requirements")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      throw new Error(error.message);
    }

    return data;
  }
}