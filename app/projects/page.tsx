import Link from "next/link";
import { createServerSupabaseClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  name: string;
  client: string | null;
  location: string | null;
  description: string | null;
  type: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default async function ProjectsPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Projects</p>
          <h1 className="mt-3 text-3xl font-semibold">Unable to load projects</h1>
          <p className="mt-3 text-slate-300">{error.message}</p>
        </div>
      </main>
    );
  }

  const projects = (data ?? []) as Project[];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Projects</p>
          <h1 className="mt-3 text-3xl font-semibold">Project directory</h1>
        </div>
        <Link
          href="/projects/new"
          className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/20"
        >
          New Project
        </Link>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-2">
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300 md:col-span-2">
            No projects yet. Create the first one to get started.
          </div>
        ) : (
          projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm transition hover:bg-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{project.name}</h2>
                    {project.client ? <p className="mt-1 text-sm text-slate-300">{project.client}</p> : null}
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                    {project.type ?? "Project"}
                  </span>
                </div>

                {project.location ? <p className="mt-4 text-sm text-slate-400">{project.location}</p> : null}
                {project.description ? <p className="mt-3 text-sm text-slate-300">{project.description}</p> : null}

                <p className="mt-5 text-xs uppercase tracking-[0.3em] text-slate-500">
                  Added {project.created_at ? new Date(project.created_at).toLocaleDateString() : "recently"}
                </p>
              </article>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
