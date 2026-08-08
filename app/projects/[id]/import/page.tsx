import { notFound } from "next/navigation";
import { getImportWorkspaceData } from "@/lib/actions/import-actions";
import { getAllKnowledgeObjects } from "@/lib/actions/knowledge-object-actions";
import { createServerSupabaseClient } from "@/supabase/server";
import { ImportWorkspace } from "@/components/import/ImportWorkspace";
import { WORKSPACE_FEED_MAX_WIDTH_CLASS, WORKSPACE_FEED_PADDING_CLASS } from "@/lib/workspace-layout";

export const dynamic = "force-dynamic";

/**
 * Sprint 5.6 — Existing Project Import. Module 1: the Import Workspace.
 * Every section on this page is a projection over real data
 * (`getImportWorkspaceData()`, reused verbatim by Delta's import questions)
 * — nothing here is a source of truth of its own.
 */
export default async function ImportWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: project } = await supabase.from("projects").select("id, name").eq("id", id).maybeSingle();
  if (!project) {
    notFound();
  }

  const [importData, allKnowledgeObjects] = await Promise.all([getImportWorkspaceData(id), getAllKnowledgeObjects()]);
  const knowledgeObjects = allKnowledgeObjects.filter((object) => object.projectId === id);

  return (
    <div className={`mx-auto w-full ${WORKSPACE_FEED_MAX_WIDTH_CLASS} ${WORKSPACE_FEED_PADDING_CLASS}`}>
      <h2 className="font-display text-2xl font-semibold text-text-primary">Import Existing Project</h2>
      <p className="mt-1 text-text-secondary">Bring {project.name}&apos;s existing documents, drawings, and records into Delta — in as many stages as you need.</p>

      <ImportWorkspace
        projectId={id}
        categories={importData.categories}
        sessions={importData.sessions}
        documents={importData.documents}
        knowledgeObjects={knowledgeObjects}
      />
    </div>
  );
}
