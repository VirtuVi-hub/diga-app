import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  name: string;
};

async function getProject(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("projects").select("id, name").eq("id", id).single();

  if (error || !data) {
    return null;
  }

  return data as Project;
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">{project.name}</p>
        <h1 className="mt-3 text-3xl font-semibold">Settings</h1>
        <p className="mt-4 text-lg text-slate-300">Coming Soon</p>
        <Link
          href={`/projects/${project.id}`}
          className="mt-6 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
