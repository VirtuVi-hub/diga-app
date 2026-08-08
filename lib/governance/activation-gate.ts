import { redirect } from "next/navigation";
import { getProjectLifecycleStage } from "@/lib/actions/project-actions";

/**
 * Sprint 5.7, Module 15: Project Activation. `app/projects/[id]/layout.tsx`
 * has no server-side pathname/segment access in this Next.js version (no
 * `usePathname` equivalent in a Server Component), so the gate is
 * per-page, not layout-based: called as the first line of every gated
 * Server Component page (Dashboard, Journal, Timeline, Knowledge), the
 * same "one guard, called at the top of every page that needs it" pattern
 * already used for `canViewProjectInfo()`. Agreement/Setup/Participants/
 * Import/Contract Package remain reachable pre-Active — the Lead Architect
 * needs them to actually walk the lifecycle.
 */
export async function requireActiveProject(projectId: string): Promise<void> {
  const stage = await getProjectLifecycleStage(projectId);
  if (stage === null || stage === "active") return;

  const target = stage === "draft" || stage === "agreement_review" || stage === "agreement_accepted" ? "agreement" : "setup";
  redirect(`/projects/${projectId}/${target}`);
}

/**
 * Sprint 5.8, Module 5: "Do not ask for Project Team before Agreement
 * approval." `/setup` and `/setup/review` had no guard of their own —
 * reachable by direct URL (or the Sidebar's own pre-Active nav item)
 * before the Agreement was accepted, letting the workflow be walked out
 * of order. Same "called first, redirect if wrong stage" pattern as
 * `requireActiveProject()`.
 */
export async function requireAgreementAccepted(projectId: string): Promise<void> {
  const stage = await getProjectLifecycleStage(projectId);
  if (stage === "draft" || stage === "agreement_review") {
    redirect(`/projects/${projectId}/agreement`);
  }
}
