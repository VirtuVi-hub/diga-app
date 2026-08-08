"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPerson } from "@/lib/auth/current-person";
import { getDiscussions } from "@/lib/actions/discussion-actions";
import { getDrawings } from "@/lib/actions/drawing-actions";
import { getTimeline } from "@/lib/actions/event-actions";
import { getAllKnowledgeObjects } from "@/lib/actions/knowledge-object-actions";
import { getRecommendations } from "@/lib/actions/recommendation-actions";
import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { FirmService } from "@/lib/services/firm-service";
import { ProjectGovernanceRepository } from "@/lib/repositories/project-governance-repository";
import { RolesRepository } from "@/lib/repositories/roles-repository";
import { createServerSupabaseClient } from "@/supabase/server";

type ProjectTeamMemberRow = {
  id: string;
  person_id: string;
  role_id: string;
  people: { first_name: string; last_name: string; email: string | null } | null;
  roles: { name: string } | null;
};

export type ProjectTeamMember = {
  id: string;
  personId: string;
  roleId: string;
  name: string;
  email: string | null;
  role: string;
};

/** Reused by both the Dashboard (Sprint 5.3) and the Onboarding Wizard's Team step (Sprint 5.4, Module 2). */
export async function listProjectTeam(projectId: string): Promise<ProjectTeamMember[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_team")
    .select("id, person_id, role_id, people!person_id(first_name, last_name, email), roles(name)")
    .eq("project_id", projectId)
    .eq("active", true)
    .returns<ProjectTeamMemberRow[]>();

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    personId: row.person_id,
    roleId: row.role_id,
    name: [row.people?.first_name, row.people?.last_name].filter(Boolean).join(" ") || "Unnamed",
    email: row.people?.email ?? null,
    role: row.roles?.name ?? "Member",
  }));
}


export type ProjectMembershipRow = ProjectTeamMember & { status: "invited" | "active" | "removed" };

/**
 * Sprint 5.7, Module 5: Project Membership, extending `listProjectTeam`'s
 * existing shape with `status`. A separate function rather than adding
 * `status` to `listProjectTeam` itself, since every existing caller of
 * `listProjectTeam` only ever wants active members and would need to
 * filter — the new Participants page (which must show invited/removed too
 * for an honest membership list) is the only caller of this one.
 */
export async function listProjectMembership(projectId: string): Promise<ProjectMembershipRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_team")
    .select("id, person_id, role_id, status, people!person_id(first_name, last_name, email), roles(name)")
    .eq("project_id", projectId)
    .returns<(ProjectTeamMemberRow & { status: "invited" | "active" | "removed" })[]>();

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    personId: row.person_id,
    roleId: row.role_id,
    name: [row.people?.first_name, row.people?.last_name].filter(Boolean).join(" ") || "Unnamed",
    email: row.people?.email ?? null,
    role: row.roles?.name ?? "Member",
    status: row.status,
  }));
}

/** Sprint 5.7, Module 5: removing a member sets `status: "removed"` while keeping `active` in sync, so every pre-existing `.eq("active", true)` query elsewhere keeps working unmodified. */
export async function removeProjectMember(memberId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("project_team").update({ active: false, status: "removed" }).eq("id", memberId);
  if (error) throw new Error(error.message);
}

/** Sprint 5.7, Module 15: the single read every activation-gated page needs. */
export async function getProjectLifecycleStage(projectId: string): Promise<string | null> {
  const info = await ProjectGovernanceRepository.get(projectId);
  return info.lifecycleStage;
}

export type ProjectMainClient = { personId: string | null; personName: string | null };

/** Sprint 5.7, Module 9: exactly one Main Client per project, resolved by name for display/actor-id purposes. */
export async function getProjectMainClient(projectId: string): Promise<ProjectMainClient> {
  const info = await ProjectGovernanceRepository.get(projectId);
  return { personId: info.mainClientPersonId, personName: info.mainClientPersonName };
}

/**
 * Post-launch fix: replaces the old multi-step Project Creation Wizard
 * (Details / Scope & Timeline / Project Team / Review). The agreed
 * lifecycle now is "Create Project (minimal information only) → Agreement
 * → Client Invitation → Agreement Review → Agreement Approved → Project
 * Setup → Delta Review → Project Active" — Scope/Timeline/Budget were
 * never given a real home anywhere in that lifecycle (not collected again
 * by Project Setup, not shown on the Dashboard, not read by anything),
 * and Project Team is Project Setup's own "Invite Project Team" step
 * (Sprint 5.7, Module 12) — asking for it again here duplicated that step
 * verbatim and, worse, was reachable *before* the Agreement even existed,
 * violating "do not ask for Project Team before Agreement approval"
 * (Sprint 5.8, Module 5). Only Name / Client / Location / Building Type
 * remain — real project identity, not planning detail.
 */
export type CreateProjectInput = {
  name: string;
  client?: string;
  location?: string;
  /** "Building Type" — reuses the existing `projects.type` column rather than adding a redundant one. */
  type?: string;
};

/**
 * The person who creates a Project automatically becomes its Lead
 * Architect (Sprint 5.9, Module 6 — never "Owner", a database
 * implementation detail, not a professional role) — the only
 * `project_team` row created here; every other team member is added
 * later, during Project Setup, after the Agreement is accepted. Requires
 * an existing Firm: creating a project ahead of having a Firm would leave
 * `firm_id` null with no way to backfill it later this sprint (no "assign
 * project to firm" UI exists) — this is an existence check, not
 * permission enforcement (Module: "No permissions engine yet").
 */
export async function createProject(input: CreateProjectInput) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to create a project.");

  const membership = await FirmService.getFirmForPerson(person.id);
  if (!membership) throw new Error("Create or join a Firm before creating a project.");

  const supabase = await createServerSupabaseClient();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      client: input.client || null,
      location: input.location || null,
      type: input.type || null,
      firm_id: membership.firm.id,
      owner_id: person.id,
      created_by: person.id,
      // Sprint 5.7: every NEW project starts at the beginning of the
      // Governance Engine lifecycle (draft -> ... -> active) and must walk
      // through Agreement upload/review before the workspace unlocks. The
      // column DEFAULTs to 'active' for backward compatibility with rows
      // that predate this sprint — this explicit override is the only
      // place a project starts anywhere else.
      lifecycle_stage: "draft",
    })
    .select("*")
    .single();

  if (error || !project) {
    throw new Error(error?.message ?? "Failed to create project.");
  }

  // Sprint 5.9, Module 6 (role architecture correction): the creator
  // becomes "Lead Architect" — never "Owner". "Owner" is a database
  // implementation detail, not a professional role, and the platform must
  // never expose it.
  const leadArchitectRoleId = await RolesRepository.getRoleIdByName("Lead Architect");

  if (leadArchitectRoleId) {
    const { error: teamError } = await supabase.from("project_team").insert({ project_id: project.id, person_id: person.id, role_id: leadArchitectRoleId, active: true });
    if (teamError) throw new Error(teamError.message);
  }

  await publishSafely({
    eventType: EVENT_TYPES.PROJECT_CREATED,
    // `actor.id` is the person's display name, not their UUID — every
    // existing Timeline summary builder inserts `actor.id` directly into a
    // human-readable sentence (matching every prior sprint's mock actor
    // ids, which were always names). Caught live during this sprint's own
    // verification, where a raw UUID appeared in the Timeline otherwise.
    actor: { type: "person", id: `${person.first_name} ${person.last_name}`.trim() },
    projectId: project.id,
    metadata: { title: project.name },
  });

  revalidatePath("/projects");
  return project;
}

export type ProjectDashboardData = {
  project: {
    id: string;
    name: string;
    client: string | null;
    location: string | null;
    type: string | null;
    scope: string | null;
    timeline: string | null;
    budget: number | null;
    firmName: string | null;
  };
  team: { id: string; name: string; role: string }[];
  recentActivity: Awaited<ReturnType<typeof getTimeline>>;
  recommendations: Awaited<ReturnType<typeof getRecommendations>>;
  knowledgeCount: number;
  drawingsCount: number;
  discussionsCount: number;
};

type ProjectDashboardRow = {
  id: string;
  name: string;
  client: string | null;
  location: string | null;
  type: string | null;
  scope: string | null;
  timeline: string | null;
  budget: number | null;
  firms: { name: string } | null;
};

type ProjectTeamRow = {
  id: string;
  people: { first_name: string; last_name: string } | null;
  roles: { name: string } | null;
};

/**
 * Module 6: Dashboard Foundation. Reuses existing projections
 * (`getTimeline`/`getRecommendations`) and existing actions
 * (`getAllKnowledgeObjects`/`getDrawings`/`getDiscussions`) rather than a
 * new query layer — "Keep it lightweight. Reuse existing projections."
 * `discussionsCount` is unfiltered by `projectId`, the same pre-existing
 * gap every other Discussion-touching feature in this codebase already has
 * (`Discussion` has no `projectId` field).
 */
export async function getProjectDashboard(projectId: string): Promise<ProjectDashboardData | null> {
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, client, location, type, scope, timeline, budget, firms(name)")
    .eq("id", projectId)
    .maybeSingle<ProjectDashboardRow>();

  if (!project) return null;

  const { data: teamRows } = await supabase
    .from("project_team")
    .select("id, people!person_id(first_name, last_name), roles(name)")
    .eq("project_id", projectId)
    .eq("active", true)
    .returns<ProjectTeamRow[]>();

  const [timeline, recommendations, knowledgeObjects, drawings, discussions] = await Promise.all([
    getTimeline({ projectId }),
    getRecommendations({ projectId }),
    getAllKnowledgeObjects(),
    getDrawings({ projectId }),
    getDiscussions(),
  ]);

  return {
    project: {
      id: project.id,
      name: project.name,
      client: project.client,
      location: project.location,
      type: project.type,
      scope: project.scope,
      timeline: project.timeline,
      budget: project.budget,
      firmName: project.firms?.name ?? null,
    },
    team: (teamRows ?? []).map((row) => ({
      id: row.id,
      name: [row.people?.first_name, row.people?.last_name].filter(Boolean).join(" ") || "Unnamed",
      role: row.roles?.name ?? "Member",
    })),
    recentActivity: timeline.slice(-10).reverse(),
    recommendations,
    knowledgeCount: knowledgeObjects.filter((object) => object.projectId === projectId).length,
    drawingsCount: drawings.length,
    discussionsCount: discussions.length,
  };
}
