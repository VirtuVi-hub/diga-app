import Link from "next/link";
import { redirect } from "next/navigation";
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
  lifecycle_stage: string;
};

/** Sprint 5.7, Module 15: link into wherever the project actually is in its lifecycle, not always Dashboard — a non-Active project has no real Dashboard to show yet. */
function projectHref(project: Project): string {
  if (project.lifecycle_stage === "active") return `/projects/${project.id}/dashboard`;
  if (project.lifecycle_stage === "draft" || project.lifecycle_stage === "agreement_review" || project.lifecycle_stage === "agreement_accepted") {
    return `/projects/${project.id}/agreement`;
  }
  return `/projects/${project.id}/setup`;
}

export default async function ProjectsPage() {
  // TEMPORARY DEBUG INSTRUMENTATION — remove after diagnosing the redirect
  // loop report. No logic below was changed to add these.
  console.log("[invite-debug][app/projects/page.tsx] executing");

  const supabase = await createServerSupabaseClient();

  // Check if the user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[invite-debug][app/projects/page.tsx] getUser() result", { hasUser: !!user });

  // If not logged in, go to the login page
  if (!user) {
    console.log("[invite-debug][app/projects/page.tsx] redirecting to /auth (no user)");
    redirect("/auth");
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="flex-1 overflow-y-auto bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
            Projects
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Unable to load projects
          </h1>
          <p className="mt-3 text-slate-300">{error.message}</p>
        </div>
      </main>
    );
  }

  const projects = (data ?? []) as Project[];

  return (
    <main className="flex-1 overflow-y-auto bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
            Projects
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Project Directory
          </h1>
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
            <Link
              key={project.id}
              href={projectHref(project)}
              className="block"
            >
              <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm transition hover:bg-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{project.name}</h2>

                    {project.client && (
                      <p className="mt-1 text-sm text-slate-300">
                        {project.client}
                      </p>
                    )}
                  </div>

                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                    {project.type ?? "Project"}
                  </span>
                </div>

                {project.location && (
                  <p className="mt-4 text-sm text-slate-400">
                    {project.location}
                  </p>
                )}

                {project.description && (
                  <p className="mt-3 text-sm text-slate-300">
                    {project.description}
                  </p>
                )}

                <p className="mt-5 text-xs uppercase tracking-[0.3em] text-slate-500">
                  Added{" "}
                  {project.created_at
                    ? new Date(project.created_at).toLocaleDateString()
                    : "Recently"}
                </p>
              </article>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}