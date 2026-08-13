import { AppShell } from "@/components/project-shell/AppShell";
import { redirect } from "next/navigation";
import { getFirmContext } from "@/lib/actions/firm-actions";
import { createServerSupabaseClient } from "@/supabase/server";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TEMPORARY DEBUG INSTRUMENTATION — remove after diagnosing the redirect
  // loop report. No logic below was changed to add these.
  console.log("[invite-debug][app/projects/layout.tsx] executing");

  const { person, firm } = await getFirmContext();

  console.log("[invite-debug][app/projects/layout.tsx] getFirmContext() result", {
    hasPerson: !!person,
    hasFirm: !!firm,
  });

  if (!person) {
    console.log("[invite-debug][app/projects/layout.tsx] redirecting to /auth (no person)");
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
      console.log("[invite-debug][app/projects/layout.tsx] redirecting to /firm (no project membership)");
      redirect("/firm");
    }
  }

  return <AppShell showAccountNavigation={Boolean(firm)}>{children}</AppShell>;
}
