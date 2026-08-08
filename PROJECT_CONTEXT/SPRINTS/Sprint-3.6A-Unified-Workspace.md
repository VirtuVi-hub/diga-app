# Sprint: Unified Workspace (Phase 1)

Status: Complete

Sprint ID: 3.6A

Target Version: v3.6

---

# Objective

Implement the Unified Workspace foundation for Delta by following the approved architecture and wireframe specifications.

This sprint establishes the persistent workspace shell that future sprints will build upon.

---

# References

Read these documents before implementation:

Core

- PROJECT_CONTEXT/00_README.md
- PROJECT_CONTEXT/01_PRODUCT.md
- PROJECT_CONTEXT/02_ARCHITECTURE.md
- PROJECT_CONTEXT/06_DESIGN_PRINCIPLES.md

Workspace

- PROJECT_CONTEXT/ARCHITECTURE/Workspace.md
- PROJECT_CONTEXT/WIREFRAMES/Workspace.md

---

# Scope

Implement the Unified Workspace shell.

This sprint includes:

- Persistent Sidebar
- Evolution Strip
- Project Journal layout
- Delta panel
- Unified layout
- Updated routing
- Responsive desktop layout

This sprint does not redesign individual features.

---

# Out of Scope

- Knowledge Review redesign
- Knowledge Graph redesign
- Meeting redesign
- Search improvements
- Backend changes
- Database changes
- New AI capabilities

---

# Constraints

- Follow the Workspace Architecture specification.
- Follow the Workspace Wireframe specification.
- Reuse existing components where possible.
- Do not modify unrelated functionality.
- Preserve existing behaviour.
- Avoid unnecessary dependencies.

---

# Deliverables

A functioning Unified Workspace where:

- Sidebar remains persistent.
- Evolution Strip replaces the standalone page.
- Journal becomes the central workspace.
- Delta is permanently docked.
- Navigation updates workspace content without unnecessary page transitions.

---

# Validation

Implementation must:

- Pass lint
- Pass type checking
- Pass build
- Preserve existing functionality
- Avoid unrelated file modifications

---

# Completion Notes

Completed Work

- Persistent Sidebar (Region A) and TopBar mounted app-wide via `app/projects/layout.tsx`, reusing the existing `components/delta/Sidebar` and `components/delta/TopBar`.
- Evolution Strip (Region B), Project Journal (Region C), and Delta panel (Region D) mounted per-project via `app/projects/[id]/layout.tsx`, reusing `ProjectEvolutionStrip`, `EvolutionDetailPanel`, and `ActionPanel`.
- New Project Journal header and a secondary in-project navigation (Overview, Requirements, Decisions, Project Documents, Contract Package, Participants, References, Timeline, Settings) placed inside the Journal, below the project header, per approved structure.
- All real project routes now render inside this shell instead of building their own full-page chrome; duplicate backgrounds, back-links, and the old broken subnav (pointing at non-existent `brief`/`conversation`/`documents`/`deliverables`/`logs` routes) were removed.
- `TopBar` no longer depends on the static `data/project.ts` fixture (project identity now lives in the Journal header, driven by real Supabase data).
- Root `/` now redirects to `/projects`; `/review` is untouched as a standalone demo.
- Removed unused, superseded `components/project-shell/{ProjectShell,ProjectSidebar,ProjectHeader}.tsx` and the now-dead `data/project.ts`.

Known Issues

- Sidebar items "Evidence" and "Knowledge Graph" have no dedicated destination yet — they render but do not navigate, matching their pre-sprint state.
- Evolution Strip and Delta panel content remain on static fixtures (`data/evolution.ts`, `data/reviews.ts` equivalents); wiring real data is out of scope per this sprint's constraints.
- Full authenticated visual verification in a browser was not possible in this environment (no test credentials / headless browser tool available). Verified instead via `npm run lint`, `npx tsc --noEmit`, `npm run build`, and a manual check of the unauthenticated `/review` route's rendered HTML.

Modified Files

- `app/projects/layout.tsx` (new), `app/projects/[id]/layout.tsx` (rewritten)
- `app/page.tsx`, `app/projects/page.tsx`, `app/projects/new/page.tsx`
- `app/projects/[id]/page.tsx`, `requirements/page.tsx`, `requirements/new/page.tsx`, `decisions/page.tsx`, `references/page.tsx`, `settings/page.tsx`, `participants/page.tsx`, `timeline/page.tsx`, `contract-package/page.tsx`, `project-records/page.tsx`
- `components/delta/TopBar.tsx`
- `components/project-shell/AppShell.tsx`, `AppSidebar.tsx`, `ProjectWorkspace.tsx`, `ProjectJournalHeader.tsx`, `ProjectSubnav.tsx` (new)
- Removed: `components/project-shell/ProjectShell.tsx`, `ProjectSidebar.tsx`, `ProjectHeader.tsx`, `data/project.ts`

Next Sprint

Sprint 3.6B — Journal Experience