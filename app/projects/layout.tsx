import { AppShell } from "@/components/project-shell/AppShell";
import { redirect } from "next/navigation";
import { getFirmContext } from "@/lib/actions/firm-actions";
import { createServerSupabaseClient } from "@/supabase/server";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { person, firm } = await getFirmContext();

  if (!person) {
    redirect("/auth");
  }

  if (!firm) {
    const supabase = await createServerSupabaseClient();
    const { data: projectMembership } = await supabase
      .from("project_team")
      .select("id")
      .eq("person_id", person.id)
      .eq("active", true)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!projectMembership) {
      redirect("/firm");
    }
  }

  return <AppShell showAccountNavigation={Boolean(firm)}>{children}</AppShell>;
}
