import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

async function createProject(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect("/projects/new?error=missing-name");
  }

  const supabase = await createServerSupabaseClient();

  const result = await supabase.from("projects").insert({
    name,
    client: String(formData.get("client") ?? "") || null,
    location: String(formData.get("location") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
    type: String(formData.get("type") ?? "") || null,
  });

  if (result.error) {
    console.error("Supabase insert failed", JSON.stringify(result.error, null, 2));
    redirect(`/projects/new?error=${encodeURIComponent(result.error.message)}`);
  }

  redirect("/projects");
}

export default function NewProjectPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
          New Project
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Create a new project
        </h1>

        <p className="mt-3 text-slate-300">
          Add project details and save them to the shared projects list.
        </p>

        <form action={createProject} className="mt-8 space-y-5">
          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-200"
              htmlFor="name"
            >
              Project Name
            </label>

            <input
              id="name"
              name="name"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
              placeholder="Riverfront Residence"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-200"
              htmlFor="client"
            >
              Client
            </label>

            <input
              id="client"
              name="client"
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
              placeholder="Apex Developments"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-200"
              htmlFor="location"
            >
              Location
            </label>

            <input
              id="location"
              name="location"
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
              placeholder="Seattle, WA"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-200"
              htmlFor="description"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
              placeholder="Describe the project scope..."
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-200"
              htmlFor="type"
            >
              Project Type
            </label>

            <input
              id="type"
              name="type"
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
              placeholder="Residential"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <a
              href="/projects"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
            >
              Cancel
            </a>

            <button
              type="submit"
              className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
            >
              Save Project
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}