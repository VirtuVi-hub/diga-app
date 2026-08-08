"use client";

import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Building, Building2, Database, FileSignature, FolderKanban, History, Home, LayoutDashboard, ListChecks, UploadCloud, Users } from "lucide-react";
import { Sidebar, type SidebarNavItem } from "@/components/delta/Sidebar";
import { useProjectIdentity } from "./ProjectIdentityContext";

function projectIdFromPathname(pathname: string) {
  const match = pathname.match(/^\/projects\/([^/]+)/);

  if (!match || match[1] === "new") {
    return null;
  }

  return match[1];
}

export function AppSidebar({ showAccountNavigation = true }: { showAccountNavigation?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { identity } = useProjectIdentity();

  const projectId = projectIdFromPathname(pathname);
  const insideProject = projectId !== null;
  // Sprint 5.7, Module 15: the collaborative workspace (Dashboard/Journal/
  // Timeline/Knowledge) only unlocks once the project is Active — before
  // that, the Sidebar points at Agreement/Setup instead of dead links.
  const isActive = identity?.lifecycleStage == null || identity.lifecycleStage === "active";
  // Sprint 5.8, Module 5: "Do not ask for Project Team before Agreement
  // approval" — Project Setup isn't offered as a destination until the
  // Agreement has actually been accepted, matching `requireAgreementAccepted()`.
  const agreementAccepted = identity != null && identity.lifecycleStage !== "draft" && identity.lifecycleStage !== "agreement_review";

  // Sprint 5.8, Module 9: "Prioritize current-project work over firm
  // administration" — when inside a project, its own items now lead;
  // Firm/All Projects (account-level, not project-scoped) follow rather
  // than always sitting first. Outside a project, nothing to prioritize
  // over — Firm/All Projects are the whole list, same as before.
  const projectItems: SidebarNavItem[] = insideProject
    ? isActive
      ? [
          { label: "Dashboard", icon: LayoutDashboard },
          { label: "Home", icon: Home },
          { label: "Timeline", icon: History },
          ...(identity?.canViewProject ? [{ label: "Project", icon: Building2 }] : []),
          { label: "Data", icon: Database },
          { label: "Knowledge Bank", icon: BookOpen },
          { label: "Import", icon: UploadCloud },
          { label: "Participants", icon: Users },
          // Sprint 5.9.2: Project Setup continues to exist as a real
          // onboarding page after activation — Design Team/Consultants/
          // Client Representatives/Import/Questionnaire/Delta Review are
          // optional, ongoing onboarding, not a one-time pre-Active gate.
          { label: "Project Setup", icon: ListChecks },
        ]
      : [
          { label: "Agreement", icon: FileSignature },
          // Sprint 5.8, Module 5: not offered as a destination until the
          // Agreement is actually accepted — matches `requireAgreementAccepted()`.
          ...(agreementAccepted ? [{ label: "Project Setup", icon: ListChecks }] : []),
          { label: "Participants", icon: Users },
          { label: "Import", icon: UploadCloud },
        ]
    : [];

  const accountItems: SidebarNavItem[] = showAccountNavigation
    ? [
        { label: "Firm", icon: Building },
        { label: "All Projects", icon: FolderKanban },
      ]
    : [];

  const items: SidebarNavItem[] = insideProject ? [...projectItems, ...accountItems] : accountItems;

  const activeItem = !insideProject
    ? pathname === "/firm"
      ? "Firm"
      : "All Projects"
    : pathname.startsWith(`/projects/${projectId}/dashboard`)
      ? "Dashboard"
      : pathname === `/projects/${projectId}`
        ? "Home"
        : pathname.startsWith(`/projects/${projectId}/timeline`)
          ? "Timeline"
          : pathname.startsWith(`/projects/${projectId}/project`)
            ? "Project"
            : pathname.startsWith(`/projects/${projectId}/data`)
              ? "Data"
              : pathname.startsWith(`/projects/${projectId}/knowledge-bank`)
                ? "Knowledge Bank"
                : pathname.startsWith(`/projects/${projectId}/import`)
                  ? "Import"
                  : pathname.startsWith(`/projects/${projectId}/agreement`)
                    ? "Agreement"
                    : pathname.startsWith(`/projects/${projectId}/setup`)
                      ? "Project Setup"
                      : pathname.startsWith(`/projects/${projectId}/participants`)
                        ? "Participants"
                        : pathname.endsWith("/settings")
                          ? "Settings"
                          : "Home";

  const navigate = (item: string) => {
    if (item === "Firm") {
      router.push("/firm");
      return;
    }

    if (item === "All Projects") {
      router.push("/projects");
      return;
    }

    if (!projectId) {
      return;
    }

    if (item === "Dashboard") {
      router.push(`/projects/${projectId}/dashboard`);
      return;
    }

    if (item === "Home") {
      router.push(`/projects/${projectId}`);
      return;
    }

    if (item === "Timeline") {
      router.push(`/projects/${projectId}/timeline`);
      return;
    }

    if (item === "Project") {
      router.push(`/projects/${projectId}/project`);
      return;
    }

    if (item === "Data") {
      router.push(`/projects/${projectId}/data`);
      return;
    }

    if (item === "Knowledge Bank") {
      router.push(`/projects/${projectId}/knowledge-bank`);
      return;
    }

    if (item === "Import") {
      router.push(`/projects/${projectId}/import`);
      return;
    }

    if (item === "Agreement") {
      router.push(`/projects/${projectId}/agreement`);
      return;
    }

    if (item === "Project Setup") {
      router.push(`/projects/${projectId}/setup`);
      return;
    }

    if (item === "Participants") {
      router.push(`/projects/${projectId}/participants`);
      return;
    }

    if (item === "Settings") {
      router.push(`/projects/${projectId}/settings`);
    }
  };

  return (
    <Sidebar
      items={items}
      activeItem={activeItem}
      onNavigate={navigate}
    />
  );
}
