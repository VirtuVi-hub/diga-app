import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/supabase/server";
import { getProjectDocuments } from "@/lib/actions/document-actions";
import { isAdministrativeDocumentType } from "@/lib/document-classification";
import ProjectRecordsClient from "@/components/project-records/ProjectRecordsClient";

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  name: string;
};

async function getProject(id: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Project;
}

export default async function DataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const allDocuments = await getProjectDocuments(project.id);

  // Administrative artifacts (Agreement, Brief, BOQ) belong exclusively to
  // the Project page, even though they are stored in the same documents
  // table. Data only ever shows project evidence.
  const documents = allDocuments.filter(
    (document) => !isAdministrativeDocumentType(document.document_type_name),
  );

  return (
    <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
      <h2 className="font-display text-2xl font-semibold text-text-primary">
        Project Documents
      </h2>

      <div className="mt-8 rounded-xl border border-border-subtle bg-surface-secondary p-6">
        <ProjectRecordsClient projectId={project.id}>
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-lg font-medium">
                No documents uploaded
              </p>

              <p className="mt-2 text-slate-400">
                Upload project documents to keep the project record complete.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {document.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {document.document_type_name ?? "Unknown Type"}
                      </p>
                    </div>

                    <div className="text-sm text-slate-400">
                      Active
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ProjectRecordsClient>
      </div>
    </main>
  );
}
