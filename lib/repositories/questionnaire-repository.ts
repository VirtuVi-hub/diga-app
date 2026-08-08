import { createServerSupabaseClient } from "@/supabase/server";
import type { QuestionnaireResponse } from "@/lib/types/onboarding";

export class QuestionnaireRepository {
  static async list(projectId: string): Promise<QuestionnaireResponse[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("project_questionnaire_responses").select("*").eq("project_id", projectId);
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async upsert(projectId: string, questionKey: string, questionLabel: string, answerText: string): Promise<QuestionnaireResponse> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("project_questionnaire_responses")
      .upsert({ project_id: projectId, question_key: questionKey, question_label: questionLabel, answer_text: answerText }, { onConflict: "project_id,question_key" })
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to save answer.");
    return data;
  }

  static async markKnowledgeObjectId(id: string, knowledgeObjectId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("project_questionnaire_responses").update({ knowledge_object_id: knowledgeObjectId }).eq("id", id);
    if (error) throw new Error(error.message);
  }
}
