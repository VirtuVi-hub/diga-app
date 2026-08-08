import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

async function projectExists(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("projects").select("id").eq("id", id).single();

  return !error && !!data;
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await projectExists(id))) {
    notFound();
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
      <h2 className="font-display text-2xl font-semibold text-text-primary">Settings</h2>
      <p className="mt-3 text-text-secondary">Coming Soon</p>
    </main>
  );
}
