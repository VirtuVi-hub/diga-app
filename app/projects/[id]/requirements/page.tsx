import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/supabase/server";

import { getRequirements } from "@/lib/actions/requirement-actions";
import { RequirementTable } from "@/components/requirements/RequirementTable";

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

export default async function RequirementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const requirements = await getRequirements(id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-text-primary">
          Requirements
        </h2>

        <span className="rounded-full border border-border-subtle bg-surface-secondary px-3 py-1 text-sm text-text-secondary">
          {requirements.length} requirement{requirements.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-6">
        <RequirementTable
          requirements={requirements}
          projectId={project.id}
        />
      </div>
    </div>
  );
}
