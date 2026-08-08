import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/supabase/server";
import { ProjectDetailsEditor } from "@/components/ProjectDetailsEditor";
import { canViewProjectInfo } from "@/lib/permissions/project-info-ui";

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  name: string;
  client: string | null;
  location: string | null;
  description: string | null;
  type: string | null;
  created_at: string | null;
};

async function getProject(id: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Project;
}

export default async function ProjectInfoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await getProject(id);

  if (!project || !canViewProjectInfo()) {
    notFound();
  }

  const createdDate = project.created_at
    ? new Date(project.created_at).toLocaleDateString()
    : "Recently created";

  const stats = [
    { label: "Agreement", value: "Pending" },
    { label: "Brief", value: "Pending" },
    { label: "Knowledge", value: "0" },
    { label: "Documents", value: "0" },
  ];

  return (
    <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <ProjectDetailsEditor
          project={project}
          projectId={project.id}
        />

        <section className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <h2 className="text-lg font-semibold">
              Quick Actions
            </h2>

            <div className="mt-4 flex flex-wrap gap-3">
              <button className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                Upload Agreement
              </button>

              <button className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                Complete Brief
              </button>

              <button className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                Start Conversation
              </button>

              <button className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                Upload Documents
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <h2 className="text-lg font-semibold">
              Recent Activity
            </h2>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">
                Project created
              </p>

              <p className="mt-1 text-slate-400">
                {createdDate}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              {stat.label}
            </p>

            <p className="mt-3 text-3xl font-semibold text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
