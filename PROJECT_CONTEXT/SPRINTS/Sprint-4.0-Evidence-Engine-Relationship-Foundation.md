# Sprint: Evidence Engine & Relationship Foundation

Status: Complete
Sprint ID: 4.0
Target Version: v4.0
Owner: Delta engineering
Created: 2026-08-01
Last Updated: 2026-08-01

---

# Objective

Introduce the architecture that will power the future Knowledge Graph: one generic `Relationship` model connecting any two nodes in the system, plus a `RelationshipRepository` following the existing repository/service/action pattern. Surface it with Evidence and Impacts sections on the Knowledge Object Detail page and Evidence / Related Knowledge / Impacts under Delta responses.

This sprint does not build graph visualization, semantic search, or AI reasoning — only the data architecture and the minimal UI needed to see it working with mock data.

---

# Background

Per `02_ARCHITECTURE.md`'s Knowledge Flow (Evidence → Knowledge Review → Knowledge Objects → Knowledge Evolution → Knowledge Graph → Project Intelligence), the Knowledge Graph domain is "Responsible for: Relationships, Navigation, Connections, Knowledge exploration, Context discovery" and "Relationships are explicit" per the Data Principles. `03_CURRENT_STATE.md` recorded this as a known gap: "Knowledge Relationships — not a real graph yet; a Knowledge Object currently only links back to the Discussion it was created from." This sprint closes that gap with a foundation, not a finished graph.

---

# Scope

## In Scope

- One generic `Relationship` model (`nodeA`, `relationshipType`, `nodeB`) — no per-entity relationship types (no `RequirementRelationship`, etc.).
- `RelationshipRepository` (+ service + actions), mirroring `KnowledgeObjectRepository`'s architecture exactly: interface, mock in-memory implementation, singleton export.
- Evidence section (Discussions, Meetings, Drawings, Documents, Photos, Videos, References) and Impacts section (Requirements, Decisions, Actions, Issues, Risks, Drawings, Meetings) on the Knowledge Object Detail page, mock data.
- Evidence / Related Knowledge / Impacts under Delta's discussion-level responses (`DeltaInsights`, used on both the Discussion Detail page and the Journal feed card), mock data.
- A small seed dataset (`data/relationships.ts`, `data/knowledge-objects.ts`) so the above renders real content out of the box for manual browser testing.

## Out of Scope

- Graph visualization.
- Semantic search / AI reasoning / explainability.
- Revision comparison, impact analysis features.
- Evidence upload flows.
- Wiring Knowledge Objects or Relationships to Supabase (both remain mock, matching Knowledge Objects v1's existing precedent).

---

# Files Expected to Change

- `types/relationship.ts` (new)
- `lib/relationship-types.ts` (new)
- `lib/relationship-utils.ts` (new)
- `lib/repositories/relationship-repository.ts` (new)
- `lib/services/relationship-service.ts` (new)
- `lib/actions/relationship-actions.ts` (new)
- `data/relationships.ts` (new)
- `data/knowledge-objects.ts` (new)
- `lib/repositories/knowledge-object-repository.ts` (seed from the new fixture)
- `components/relationships/*` (new — Evidence/Impacts UI)
- `components/knowledge-objects/KnowledgeObjectDetail.tsx`
- `app/projects/[id]/knowledge/[objectId]/page.tsx`
- `components/delta/DeltaInsights.tsx`
- `components/delta/DiscussionDetail.tsx`, `app/projects/[id]/discussions/[discussionId]/page.tsx`
- `components/delta/DiscussionCard.tsx`, `components/delta/Workspace.tsx`, `components/project-shell/HomeWorkspace.tsx`, `app/projects/[id]/page.tsx`
- `data/delta-insights.ts` (removed — superseded by relationship-driven data)

---

# Files That Must Not Change

- `types/knowledge-object.ts` and the existing Knowledge Object repository/service/action public interfaces (Knowledge Objects must not know about specific relationship logic — they stay unaware of the graph).
- Workspace shell / layout files (`components/workspace/*`) — unrelated to this sprint.

---

# Constraints

- Follow `PROJECT_CONTEXT/02_ARCHITECTURE.md`, `05_PRODUCT_DECISIONS.md`, `06_DESIGN_PRINCIPLES.md`.
- Mirror the existing repository/service/action architecture exactly (see Knowledge Objects v1).
- Everything queried through `RelationshipRepository` — no hardcoded per-type traversal logic (e.g. no `if (type === "requirement") ...` relationship logic).
- Mock data only; no Supabase changes.
- Reuse existing components/tokens where possible (`CompactExpandableRow`-style patterns, existing typographic conventions on the Knowledge Object Detail page).
- Preserve existing functionality.

---

# Implementation Notes

- `RelationshipNode = { id, type, label }` — `label` is a denormalized display string on the edge itself (mock-era substitute for a real cross-entity resolver), so the generic UI can render any relationship without knowing how to fetch every possible node type.
- `RelationshipNodeType` reuses `KnowledgeObjectType` for the five knowledge-object kinds, adding `discussion | meeting | drawing | document | photo | video | reference` for evidence-only kinds.
- `RelationshipType = "evidence" | "impact" | "related"` — directional for evidence/impact (`nodeA` is the subject), used bidirectionally for `related`.
- Seed data is attached to the stable mock discussion IDs (`data/discussions.ts`) and one seeded demo Knowledge Object (`data/knowledge-objects.ts`, mirroring how `discussion-repository.ts` already seeds from a fixture) so evidence/impacts render immediately without first creating anything by hand.

---

# Acceptance Criteria

- [x] Generic `Relationship` model — no per-entity relationship types.
- [x] `RelationshipRepository` (create / remove / query / getEvidence / getImpacts) following the Knowledge Object architecture.
- [x] Evidence section on Knowledge Object Detail page (mock data).
- [x] Impacts section on Knowledge Object Detail page (mock data).
- [x] Evidence / Related Knowledge / Impacts under Delta responses (mock data).
- [x] Architecture stays generic — Knowledge Objects never reference specific relationship logic.

---

# Validation

The implementation must:

- [x] Pass lint
- [x] Pass type checking
- [x] Pass build
- [x] Avoid unrelated file changes

---

# Completion Notes

Completed work:

- `types/relationship.ts` — generic `Relationship` model: `RelationshipNode = { id, type, label }`, `RelationshipType = "evidence" | "impact" | "related"`, `RelationshipNodeType` reuses `KnowledgeObjectType` plus `discussion | meeting | drawing | document | photo | video | reference`. No per-entity relationship types exist anywhere.
- `lib/repositories/relationship-repository.ts` — `MockRelationshipRepository`, mirroring `MockKnowledgeObjectRepository` line-for-line: interface, in-memory `store`, immutable array updates, `nextId()`, singleton export. Implements `create`, `remove`, `query` (generic filter by project/node/relationshipType), `getEvidence`, `getImpacts`.
- `lib/services/relationship-service.ts` + `lib/actions/relationship-actions.ts` — thin delegation layers, identical shape to the Knowledge Object service/actions. UI only ever imports the actions.
- `lib/relationship-types.ts` — label/icon config per node type (reuses `knowledgeObjectTypeConfig` for the five knowledge-object kinds) plus `evidenceNodeTypeOrder`/`impactNodeTypeOrder` display-order arrays.
- `lib/relationship-utils.ts` — `isSameRelationshipNode`/`filterRelationshipsForNode`, shared by both the server-side repository and client components (`DiscussionCard`) that need to filter an already-fetched relationship list.
- `data/relationships.ts` + `data/knowledge-objects.ts` — seed data attached to the stable mock discussion IDs and one seeded demo Requirement (`requirement-demo-1`), so Evidence/Impacts render real content immediately.
- Knowledge Object Detail page: new `EvidenceSection`/`ImpactsSection` (`components/relationships/`), built on a generic `RelationshipGroupedList` that groups by node type — no per-type branching. Both query through `getEvidenceForNode`/`getImpactsForNode`.
- `DeltaInsights` now renders Evidence / Related Knowledge / Impacts sourced from real `Relationship[]` data (via `getEvidenceForNode`/`getImpactsForNode`/`queryRelationships`) instead of the old static `MOCK_OBSERVATIONS`/`MOCK_IMPACTS` fixture, on both the Discussion Detail page and the Journal feed card (`DiscussionCard`, fed through `Workspace` → `HomeWorkspace` → the Journal page).
- Removed `data/delta-insights.ts` (fully superseded, confirmed no remaining references).

Known issues:

- Full authenticated visual verification in a browser was not possible in this environment (no test credentials); verified instead via `npx tsc --noEmit`, `npm run lint`, `npm run build`, and manual code review of the new data flow. A real browser pass is recommended before sign-off.
- The Journal feed (`app/projects/[id]/page.tsx`) fetches the entire relationship store unfiltered (`queryRelationships()`) and lets each `DiscussionCard` filter client-side; fine at this sprint's mock-data scale, but should become a filtered/paginated query once a real backend exists.
- Relationship `label` is a denormalized string stored directly on the edge (no cross-entity resolver yet) — acceptable for this mock-data sprint, but a real implementation will need a resolver so labels stay in sync with the source entity.
- Only one Knowledge Object is seeded with relationships (`requirement-demo-1`); newly created Knowledge Objects correctly show empty Evidence/Impacts sections (no relationships reference their freshly-generated IDs) rather than an error.

Follow-up work:

- Wire relationship creation into the UI (currently only queried, never created/removed from any screen).
- Graph visualization, semantic search, explainability, revision comparison, impact analysis — all explicitly out of scope for this sprint, built on top of this foundation.
- Replace the mock `RelationshipRepository` with a real backend-backed implementation behind the same interface, as already planned for Knowledge Objects.

Modified files:

New: `types/relationship.ts`, `lib/relationship-types.ts`, `lib/relationship-utils.ts`, `lib/repositories/relationship-repository.ts`, `lib/services/relationship-service.ts`, `lib/actions/relationship-actions.ts`, `data/relationships.ts`, `data/knowledge-objects.ts`, `components/relationships/RelationshipGroupedList.tsx`, `components/relationships/EvidenceSection.tsx`, `components/relationships/ImpactsSection.tsx`.

Changed: `lib/repositories/knowledge-object-repository.ts`, `components/knowledge-objects/KnowledgeObjectDetail.tsx`, `app/projects/[id]/knowledge/[objectId]/page.tsx`, `components/delta/DeltaInsights.tsx`, `components/delta/DiscussionDetail.tsx`, `app/projects/[id]/discussions/[discussionId]/page.tsx`, `components/delta/DiscussionCard.tsx`, `components/delta/Workspace.tsx`, `components/project-shell/HomeWorkspace.tsx`, `app/projects/[id]/page.tsx`, `components/delta/DeltaApp.tsx` (legacy/unreachable demo shell, updated only to keep it compiling against `Workspace`'s new required prop).

Removed: `data/delta-insights.ts`.
