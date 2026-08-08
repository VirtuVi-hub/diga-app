"use server";

import { getDiscussions } from "@/lib/actions/discussion-actions";
import { getDrawings } from "@/lib/actions/drawing-actions";
import { getTimeline } from "@/lib/actions/event-actions";
import { getSources } from "@/lib/actions/gateway-actions";
import { getAllKnowledgeObjects } from "@/lib/actions/knowledge-object-actions";
import { listProjectTeam } from "@/lib/actions/project-actions";
import { getProjectDocuments } from "@/lib/actions/document-actions";
import { getRecommendations } from "@/lib/actions/recommendation-actions";
import { queryRelationships } from "@/lib/actions/relationship-actions";
import { getProjectSetupProgress } from "@/lib/actions/project-setup-actions";
import { computeAttentionCenter } from "@/lib/dashboard/attention-center";
import { generateDashboardBriefing } from "@/lib/dashboard/generate-briefing";
import { computeProjectHealth } from "@/lib/dashboard/project-health";
import type { MissionControlRawData } from "@/lib/dashboard/mission-control-types";
import { computeImportCategoryStatus } from "@/lib/import/import-category-status";
import { getProjectSetupGaps } from "@/lib/project-setup/setup-gaps";
import { RevisionService } from "@/lib/services/revision-service";
import type { AttentionItem, HealthMetric, ProjectSnapshot, RecentDocumentItem, UpcomingSection } from "@/lib/types/dashboard";
import type { ImportCategoryStatus } from "@/lib/types/import";
import type { TimelineEntry } from "@/lib/events/timeline-projection";
import { createServerSupabaseClient } from "@/supabase/server";

const RECENT_ACTIVITY_LIMIT = 12;
const RECENT_DOCUMENTS_LIMIT = 8;
const RECENT_DRAWINGS_LIMIT = 5;

export type RecentDrawingItem = { id: string; title: string; sheetNumber: string; createdAt: string };

type ProjectRow = {
  id: string;
  name: string;
  client: string | null;
  location: string | null;
  type: string | null;
  scope: string | null;
  timeline: string | null;
  budget: number | null;
  project_stage: string | null;
  target_completion_date: string | null;
  firms: { name: string } | null;
};

export type MissionControlData = {
  project: {
    id: string;
    name: string;
    client: string | null;
    location: string | null;
    type: string | null;
    scope: string | null;
    timeline: string | null;
    budget: number | null;
    projectStage: string | null;
    targetCompletionDate: string | null;
    firmName: string | null;
  };
  team: { id: string; name: string; role: string }[];
  briefing: string[];
  health: HealthMetric[];
  attention: AttentionItem[];
  snapshot: ProjectSnapshot;
  recentActivity: TimelineEntry[];
  recommendations: Awaited<ReturnType<typeof getRecommendations>>;
  upcoming: UpcomingSection[];
  recentDocuments: RecentDocumentItem[];
  /** Sprint 5.6 (Module 8): reuses `computeImportCategoryStatus()` — the exact same projection the Import Workspace itself renders. */
  importCategories: ImportCategoryStatus[];
  recentDrawings: RecentDrawingItem[];
};

/**
 * Module 1: Mission Control. The single aggregator every Dashboard section
 * AND Delta's dashboard questions (`lib/dashboard/dashboard-query.ts`) call —
 * one fetch, reused everywhere, per the sprint's own "Do NOT duplicate data"
 * requirement. Every field is a live read through an existing action/service
 * (`getTimeline`, `getRecommendations`, `getAllKnowledgeObjects`,
 * `getDiscussions`, `getDrawings`, `getProjectDocuments`, `getSources`,
 * `queryRelationships`, `RevisionService`, `getProjectSetupGaps`) —
 * nothing here is a new intelligence engine, and
 * nothing is persisted; the whole page recomputes on every load.
 */
export async function getMissionControlData(projectId: string): Promise<MissionControlData | null> {
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, client, location, type, scope, timeline, budget, project_stage, target_completion_date, firms(name)")
    .eq("id", projectId)
    .maybeSingle<ProjectRow>();

  if (!project) return null;

  const [team, setupGaps, setupProgress, timelineEntries, recommendations, allKnowledgeObjects, discussions, drawings, documents, revisions, sources, relationships] = await Promise.all([
    listProjectTeam(projectId),
    getProjectSetupGaps(projectId),
    getProjectSetupProgress(projectId),
    getTimeline({ projectId }),
    getRecommendations({ projectId }),
    getAllKnowledgeObjects(),
    getDiscussions(),
    getDrawings({ projectId }),
    getProjectDocuments(projectId),
    RevisionService.list({ projectId }),
    getSources({ projectId }),
    queryRelationships({ projectId }),
  ]);

  const knowledgeObjects = allKnowledgeObjects.filter((object) => object.projectId === projectId);

  const raw: MissionControlRawData = {
    projectId,
    knowledgeObjects,
    discussions,
    recommendations,
    revisions,
    sources,
    relationships,
    setupGaps,
    setupProgress,
  };

  const health = computeProjectHealth(raw);
  const attention = computeAttentionCenter(raw);
  const briefing = generateDashboardBriefing(raw);

  const countByType = (type: string) => knowledgeObjects.filter((object) => object.type === type).length;

  const snapshot: ProjectSnapshot = {
    requirements: countByType("requirement"),
    decisions: countByType("decision"),
    issues: countByType("issue"),
    actions: countByType("action"),
    risks: countByType("risk"),
    drawings: drawings.length,
    documents: documents.length,
    discussions: discussions.length,
    timelineEvents: timelineEntries.length,
    participants: team.length,
  };

  const recentDocuments: RecentDocumentItem[] = documents
    .slice()
    .sort((a, b) => new Date(b.uploaded_at ?? b.created_at).getTime() - new Date(a.uploaded_at ?? a.created_at).getTime())
    .slice(0, RECENT_DOCUMENTS_LIMIT)
    .map((document) => ({
      id: document.id,
      name: document.name,
      documentTypeName: document.document_type_name,
      uploadedAt: document.uploaded_at ?? document.created_at,
    }));

  const importCategories = computeImportCategoryStatus(documents, sources);

  const recentDrawings: RecentDrawingItem[] = drawings
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_DRAWINGS_LIMIT)
    .map((drawing) => ({ id: drawing.id, title: drawing.title, sheetNumber: drawing.sheetNumber, createdAt: drawing.createdAt }));

  const pendingApprovalItems = attention.filter((item) => item.category === "approval");
  const setupIncomplete = setupGaps.missingRoles.length > 0 || setupGaps.missingDocumentTypes.length > 0 || setupGaps.questionnaireIncomplete;

  /**
   * Module 8: Upcoming. Only real data is shown — Meetings and Milestones
   * have no genuine per-project data model in this codebase yet (Meetings
   * are an Evidence *type*, not a stored, dated entity; `data/evolution.ts`
   * is static demo content, not real per-project data — using it here would
   * be fabrication, not reuse), so both sections show an honest empty state
   * instead of inventing content.
   */
  const upcoming: UpcomingSection[] = [
    {
      key: "meetings",
      label: "Upcoming Meetings",
      items: [],
      emptyState: "No meeting scheduling exists yet — Meetings are evidence today, not a scheduled entity.",
    },
    {
      key: "approvals",
      label: "Pending Approvals",
      items: pendingApprovalItems.map((item) => ({ id: item.id, title: item.title, detail: item.description, href: item.href })),
      emptyState: "Nothing is waiting on a named approver right now.",
    },
    {
      key: "onboarding",
      label: "Outstanding Setup Tasks",
      items: setupIncomplete
        ? [
            ...setupGaps.missingRoles.map((role: string) => ({ id: `role-${role}`, title: `Assign ${role}`, detail: "No one is assigned to this role yet.", href: `/projects/${projectId}/participants` })),
            ...setupGaps.missingDocumentTypes.map((type: string) => ({ id: `doc-${type}`, title: `Upload ${type}`, detail: `No ${type} document has been uploaded yet.`, href: `/projects/${projectId}/contract-package` })),
            ...(setupGaps.questionnaireIncomplete ? [{ id: "questionnaire", title: "Complete the Client Questionnaire", detail: "The questionnaire has not been completed yet.", href: `/projects/${projectId}/setup` }] : []),
          ]
        : [],
      emptyState: "Project Setup is complete — nothing outstanding.",
    },
    {
      key: "milestones",
      label: "Future Milestones",
      items: [],
      emptyState: "No real, dated milestone data exists for this project yet.",
    },
  ];

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
      projectStage: project.project_stage,
      targetCompletionDate: project.target_completion_date,
      firmName: project.firms?.name ?? null,
    },
    team: team.map((member) => ({ id: member.id, name: member.name, role: member.role })),
    briefing,
    health,
    attention,
    snapshot,
    recentActivity: timelineEntries.slice(-RECENT_ACTIVITY_LIMIT).reverse(),
    // Module 7: "Most recent" first — `RecommendationService.list()` makes no
    // ordering guarantee of its own.
    recommendations: recommendations.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    upcoming,
    recentDocuments,
    importCategories,
    recentDrawings,
  };
}
