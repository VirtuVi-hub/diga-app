import { notFound } from "next/navigation";
import ContractPackageClient from "@/components/contract-package/ContractPackageClient";
import { getDocumentRevisions, getDocumentTypes, getProjectDocuments } from "@/lib/actions/document-actions";
import { canViewContractPackage } from "@/lib/permissions/contract-package-ui";
import { createServerSupabaseClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

async function getProject(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("projects").select("id, name").eq("id", id).single();
  return error || !data ? null : (data as { id: string; name: string });
}

export default async function ContractPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const [{ data: { user } }, project, documentTypes] = await Promise.all([
    supabase.auth.getUser(),
    getProject(id),
    getDocumentTypes(),
  ]);

  if (!project || !canViewContractPackage(user)) {
    notFound();
  }

  const documents = await getProjectDocuments(project.id);
  const documentsWithRevisions = await Promise.all(
    documents.map(async (document) => ({
      ...document,
      revisions: await getDocumentRevisions(document.id),
    })),
  );

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-text-primary">Contract Package</h2>
      <p className="mt-3 text-text-secondary">This package contains all contractual documents for this project.</p>
      <div className="mt-8"><ContractPackageClient projectId={project.id} documentTypes={documentTypes} documents={documentsWithRevisions} /></div>
    </div>
  );
}
