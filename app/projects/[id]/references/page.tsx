import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

async function projectExists(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("projects").select("id").eq("id", id).single();

  return !error && !!data;
}

export default async function ReferencesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await projectExists(id))) {
    notFound();
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-text-primary">References</h2>
      <p className="mt-3 text-text-secondary">Coming Soon</p>
    </div>
  );
}
