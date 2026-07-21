import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/supabase/server";
import { ProjectDetailsEditor } from "@/components/ProjectDetailsEditor";

const navItems = [
  { label: "Overview", href: "" },
  { label: "Documents", href: "documents" },
  { label: "Participants", href: "participants" },
  { label: "References", href: "references" },
  { label: "Decisions", href: "decisions" },
  { label: "Timeline", href: "timeline" },
  { label: "Settings", href: "settings" },
];

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
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();

  if (error || !data) {
    return null;
  }

  return data as Project;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const createdDate = project.created_at
    ? new Date(project.created_at).toLocaleDateString()
    : "Recently created";

  const stats = [
    { label: "Documents", value: "0" },
    { label: "Participants", value: "1" },
    { label: "References", value: "0" },
    { label: "Decisions", value: "0" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Project Dashboard</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold">{project.name}</h1>
              <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-200">
                Active
              </span>
            </div>
          </div>
          <Link
            href="/projects"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          >
            Back to Projects
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 rounded-full border border-white/10 bg-white/5 p-2">
          {navItems.map((item) => {
            const href = item.href ? `/projects/${project.id}/${item.href}` : `/projects/${project.id}`;
            const isActive = item.href === "";

            return (
              <Link
                key={item.label}
                href={href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-200"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <ProjectDetailsEditor project={project} projectId={project.id} />

          <section className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
              <h2 className="text-lg font-semibold">Quick Actions</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                  Upload Document
                </button>
                <button className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                  Invite Participant
                </button>
                <button className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                  Add Reference
                </button>
                <button className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                  Create Decision
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
                <p className="font-medium text-white">Project created</p>
                <p className="mt-1 text-slate-400">{createdDate}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {stats.map((stat) => {
            const href =
              stat.label === "Documents"
                ? `/projects/${project.id}/documents`
                : stat.label === "Participants"
                  ? `/projects/${project.id}/participants`
                  : stat.label === "References"
                    ? `/projects/${project.id}/references`
                    : `/projects/${project.id}/decisions`;

            return (
              <Link key={stat.label} href={href} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
