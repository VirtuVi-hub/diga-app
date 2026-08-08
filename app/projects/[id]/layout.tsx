import { notFound } from "next/navigation";
import { canViewProjectInfo } from "@/lib/permissions/project-info-ui";
import { ProjectIdentityBridge } from "@/components/project-shell/ProjectIdentityBridge";
import type { ProjectParticipant } from "@/components/project-shell/ProjectIdentityContext";
import { createServerSupabaseClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  name: string;
  client: string | null;
  type: string | null;
  lifecycle_stage: string;
};

type ProjectTeamRow = {
  id: string;
  people: { first_name: string; last_name: string } | null;
  roles: { name: string } | null;
};

async function getProject(id: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, client, type, lifecycle_stage")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Project;
}

async function getProjectParticipants(projectId: string): Promise<ProjectParticipant[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("project_team")
    .select("id, people!person_id(first_name, last_name), roles(name)")
    .eq("project_id", projectId)
    .eq("active", true);

  if (error || !data) {
    return [];
  }

  const rows = data as unknown as ProjectTeamRow[];

  return rows
    .filter((row) => row.people && row.roles)
    .map((row) => ({
      id: row.id,
      name: `${row.people!.first_name} ${row.people!.last_name}`,
      initials: `${row.people!.first_name.charAt(0)}${row.people!.last_name.charAt(0)}`.toUpperCase(),
      role: row.roles!.name,
    }));
}

export default async function ProjectIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, participants] = await Promise.all([
    getProject(id),
    getProjectParticipants(id),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <ProjectIdentityBridge
      project={project}
      participants={participants}
      canViewProject={canViewProjectInfo()}
      lifecycleStage={project.lifecycle_stage}
    >
      {children}
    </ProjectIdentityBridge>
  );
}
