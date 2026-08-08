# Sprint: Existing Project Import

Status: Complete
Sprint ID: 5.6
Target Version: v5.6
Owner: Delta engineering
Created: 2026-08-04
Last Updated: 2026-08-04

---

# Objective

Not a generic file uploader. Let an architectural firm bring an already-running project into DIGA — its Agreement, Drawings, BOQ, Specifications, Reports, Photos, Meeting Minutes, and General Documents — in stages, so it immediately becomes part of the real Knowledge Graph and every existing intelligence surface (Dashboard, Journal, Timeline, Recommendation Engine, Drawing/Revision Intelligence, Delta), never a second, parallel pipeline.

---

# Background

Sprint 5.4 already built a single-shot "Initial Project Knowledge" upload step inside the one-time Onboarding Wizard (8 categories, reusing `uploadDocumentFile` + the Sprint 5.2 Project Intelligence Gateway). Sprint 5.6 generalizes that same composition into an ongoing, revisitable Import Workspace for a project that already exists in the real world and needs its history brought in over multiple sessions — not a new upload pipeline, the same one, reused from a second entry point and extended by exactly one new category (Meeting Minutes). Sprint 5.5's Mission Control Dashboard already had a `getMissionControlData()` aggregator and a `RecentDocumentsPanel`; this sprint extends both rather than building a parallel dashboard surface.

---

# Projection-First Architecture (confirmed)

Every new UI element in this sprint is a rendering of data computed elsewhere:

- **Import category status** (`lib/import/import-category-status.ts`) — a pure function over already-fetched `documents` and `Source[]`, exactly like `TimelineProjection`/`GatewayDashboard`.
- **Import Sessions** (`lib/import/import-session-projection.ts`) — a pure function grouping `Source[]` by a client-generated `metadata.importSessionId` tag. No new repository, no new table: a session has no existence beyond "the sources that carry this id."
- **`getImportWorkspaceData()`** (`lib/actions/import-actions.ts`) — the one aggregator both the Import Workspace page and Delta's import questions (`lib/import/import-query.ts`) call, mirroring `getMissionControlData()`'s own "one aggregator, shared everywhere" precedent from Sprint 5.5.
- The Dashboard's new Import Progress panel calls the **same** `computeImportCategoryStatus()` the Import Workspace itself uses, fed from data `getMissionControlData()` was already fetching (`documents`, `sources`, `drawings`) — zero additional fetches, zero duplicate logic.

No feature-specific storage was created. No UI component holds business state beyond ephemeral form/session-id state.

---

# Scope

## In Scope

- **Module 1 (Import Workspace)**: `/projects/[id]/import` — per-category cards showing Imported/Pending/Needs Review/Failed counts (not a single collapsed state).
- **Module 2 (Import Sessions)**: transparency-only history, Started/Completed/Imported/Failed/Warnings, derived from real `Source` data.
- **Module 3 (Supported Assets)**: Agreement, Client Brief, Drawings, BOQ, Specifications, Reports, Site Photos, Meeting Minutes, Other Documents — Sprint 5.4's 8 categories plus one new one.
- **Module 4 (Reuse Existing Engines)**: every imported file flows through the unmodified `uploadDocumentFile` + Project Intelligence Gateway `ingestSource` — no new capability, no new parser.
- **Module 5 (Document Registration)**: fully covered by the pre-existing `documents`/`document_revisions` schema — no new columns needed.
- **Module 6 (Knowledge Linking)**: reuses the unmodified Relationship Graph (`createRelationship`).
- **Module 7 (Timeline Integration)**: two new Event types, reusing the unmodified Event Engine.
- **Module 8 (Dashboard Integration)**: an Import Progress panel + Recent Drawings, both extending `getMissionControlData()`.
- **Module 9 (Delta Questions)**: new import-shaped questions, plus one new trigger phrase added to the existing Drawing Intelligence Delta branch.
- **Module 10 (Import Progress)**: real counts only, never percentages.
- **Module 11 (Recommendations)**: extends Sprint 5.4's existing document-gap rules with one new document type (Specification) and adds one genuinely new rule (drawing with no linked Requirement) — both via the existing Recommendation Engine.
- **Module 12 (Graceful Empty States)**: "No project documents have been imported yet."

## Out of Scope

Real OCR/document parsing/content extraction, real DWG/PDF drawing parsing, a background job/queue system, revision-aware import (bringing in a drawing's prior revision history), permission management, real email delivery.

---

# Files Expected to Change

New:
- `lib/types/import.ts`, `lib/import/import-category-status.ts`, `lib/import/import-session-projection.ts`, `lib/import/import-query.ts`
- `lib/actions/import-actions.ts`
- `app/projects/[id]/import/page.tsx`, `components/import/ImportWorkspace.tsx`
- `components/dashboard/ImportProgressPanel.tsx`

Changed:
- `lib/events/event-types.ts` (`ASSET_IMPORTED`, `IMPORT_SESSION_COMPLETED`)
- `lib/events/timeline-projection.ts` (two new `SUMMARY_BUILDERS` entries)
- `lib/recommendations/recommendation-types.ts` (`UPLOAD_MISSING_SPECIFICATIONS`, `DRAWING_MISSING_REQUIREMENT_LINK`)
- `lib/recommendations/recommendation-rules.ts` (renamed `ONBOARDING_CHECKPOINT_EVENTS` → `DOCUMENT_GAP_CHECKPOINT_EVENTS`, extended with `ASSET_IMPORTED`; added `missingSpecificationsRule` and `drawingMissingRequirementLinkRule`)
- `lib/onboarding/onboarding-gaps.ts` (`KEY_DOCUMENT_TYPES` gained `"Specification"`)
- `lib/dashboard/project-health.ts` (exclusion list gained the new Specification recommendation type)
- `lib/drawing-intelligence/drawing-query.ts` (one new trigger phrase)
- `lib/intelligence-engine/delta-query-resolver.ts` (one new branch)
- `lib/actions/dashboard-actions.ts` (`MissionControlData` gained `importCategories`/`recentDrawings`)
- `app/projects/[id]/dashboard/page.tsx` (renders `ImportProgressPanel`)
- `components/project-shell/AppSidebar.tsx` (new "Import" nav item)

---

# Files That Must Not Change

Every frozen intelligence engine (Comprehension, Intelligence, Evidence, Reasoning, Drawing Intelligence Engine, Revision Engine, Project Intelligence Gateway's own capability set) — none were redesigned; the Gateway's three existing capabilities (Drawing/Revision/Journal) are used completely unmodified. `RecommendationPanel.tsx`/`TimelineEntryCard.tsx` were not touched. No new Gateway capability was registered — every non-drawing category correctly, honestly lands in `needs_review`, exactly as Sprint 5.2 already documented for other source types.

---

# Constraints

- Reuse Drawing Intelligence, Revision Intelligence, Knowledge Graph, Event Engine, Timeline, Recommendation Engine, Project Intelligence Gateway — do not duplicate any of them.
- No new intelligence engine, no new storage, no job queue.
- Every UI element must remain projection-based.

---

# Implementation Notes (Architecture Decisions)

- **The 9 asset categories are Sprint 5.4's own `UPLOAD_CATEGORIES` array, extended by literal code reuse (`[...UPLOAD_CATEGORIES, meetingMinutesEntry]`), not a hand-copied second list.** Sharing the exact same category `key` namespace as Onboarding's Documents step is what makes a document uploaded during Onboarding and one imported later through the Import Workspace both count toward the same per-category status — one shared vocabulary, not two parallel ones. "Meeting Minutes" needed no new `document_types` row — it already existed, seeded in `20260726113000_seed_document_reference_data.sql`, just never surfaced as an upload category until now.
- **A real, pre-existing limitation surfaces honestly, for the first time, in this sprint's own UI**: Drawing Intelligence (Sprint 5.1) only parses its own seeded mock uploads (`data/drawing-uploads.ts`) — a genuinely new drawing file uploaded through Import correctly, honestly lands in `processingState: "failed"` (`DrawingService.ingest()` returns `null` for any `drawingId` it doesn't recognize), which the Import Workspace's "Failed" badge now surfaces plainly for the first time. This was verified live, not assumed, and is not a bug introduced by this sprint — fixing real DWG/PDF drawing parsing is explicitly out of scope for every prior Drawing Intelligence sprint and remains so here.
- **Import Sessions need zero new storage.** A session is a client-generated UUID (`crypto.randomUUID()`, minted once per page visit to the Import Workspace), carried only in `Source.metadata.importSessionId` — an existing, deliberately free-form field. `projectImportSessions()` derives Started/Completed/Imported/Failed/Warnings entirely from real `Source` timestamps and processing states. "Skipped files" (the brief's own Module 2 example) is the one field NOT part of this projection: a file that fails client-side validation before ever reaching `ingestSource()` leaves no persisted trace by definition, so historical sessions honestly cannot report a skipped count — the Import Workspace would show that as live, in-memory feedback for the current visit only, never fabricated for past sessions.
- **`finishImportSession()` is a deliberate, human-triggered event, not something the projection needs.** A session's real completion state (`completedAt`) is already derived automatically from whether every one of its sources has reached a terminal processing state — independent of any button. The explicit "Finish this session" action exists only to record the moment a person declared a batch done, satisfying Module 7's "Import Completed" event example without making the projection depend on it.
- **`EVENT_TYPES.ASSET_IMPORTED` is one generic event, not one per asset category.** The brief's own "Agreement Imported"/"Drawing Imported"/"Report Imported" phrasing comes entirely from `timeline-projection.ts`'s summary builder reading `metadata.category` at render time — matching the "no per-variant event type" philosophy every event in this codebase already follows (`KNOWLEDGE_OBJECT_CREATED` isn't `REQUIREMENT_CREATED`/`DECISION_CREATED`/etc. either).
- **A real event-ordering bug was caught before it ever shipped, not found via live testing this time.** `DrawingService.ingest()` (Sprint 5.1) publishes `DRAWING_UPLOADED` *before* creating the drawing's own suggested Relationships, and `DRAWING_CLASSIFIED` *after*. The new `drawingMissingRequirementLinkRule` (Module 11's "recent drawing has no linked requirements") was deliberately wired to `DRAWING_CLASSIFIED`, not `DRAWING_UPLOADED` — triggering on the earlier event would have seen zero relationships for every drawing, even ones about to receive several, producing a false positive on every single classification. Caught during design by re-reading `DrawingService.ingest()`'s own source before writing the rule, then confirmed correct via live verification (a freshly classified seeded drawing correctly produced exactly one `drawing_missing_requirement_link` recommendation).
- **The existing Sprint 5.4 document-gap rules (`missingAgreementRule`/`missingBoqRule`/`missingDrawingsRule`) needed no new rule of their own to react to imports** — they already re-evaluate `getOnboardingGaps()` generically on a checkpoint-event list, so adding `EVENT_TYPES.ASSET_IMPORTED` to that list (renamed `DOCUMENT_GAP_CHECKPOINT_EVENTS`, honestly reflecting that it now serves two features, not one) was sufficient. Only "Specification" needed a genuinely new rule instance (`missingSpecificationsRule`, via the same existing `missingDocumentRule()` factory) since it's a new document type, not a new trigger mechanism.
- **Recommendations are advisory and never auto-resolve** — verified live: uploading a Drawing after an earlier checkpoint had already opened an `upload_missing_drawings` recommendation left that recommendation open, since nothing in this codebase retracts a Recommendation when its underlying gap is later filled (a pre-existing Sprint 4.8 design decision, not a regression introduced here).
- **Knowledge Linking (Module 6) always links from the `document` node type, never a category-specific one** (e.g. never a dedicated `drawing`-typed node for a "Drawings" category file). A `drawing`-typed graph node only comes to exist once Drawing Intelligence successfully classifies a file — which, per the limitation above, real uploaded files can't reach today. Linking from `document` (a pre-existing, valid `RelationshipNodeType`) is honest for every category, including ones conceptually called "Drawing" or "Photo" in the UI, since the `documents` row is the one thing genuinely guaranteed to exist for every imported asset.
- **"Which drawings are available?" was added to the existing `drawing-query.ts` (Sprint 5.1), not a new file** — it's the same real `Drawing` listing "What drawings exist?" already answers, just a phrasing a firm importing an existing project is more likely to use. "What documents have been imported?"/"What documents are still missing?"/"Has the agreement been uploaded?"/"What reports exist?" went into a new `import-query.ts` since they need real `documents`/category-status data Gateway `Source` records alone don't carry — but the file follows the exact same detect/answer pattern as all six prior Delta-integration files, not a second reasoning pipeline. "What changed since yesterday?"-style and "What recommendations are open?"-style phrasings were deliberately NOT duplicated here — Sprint 4.6/4.8's existing branches already answer them.
- **`import-query.ts` calls `getImportWorkspaceData()` (a `"use server"` action) rather than any Supabase-touching class directly** — built this way from the start, applying the lesson Sprint 5.4 learned the hard way (a Delta query file that imports a Supabase-backed service directly can leak `next/headers` into the client bundle via `useDeltaPanel.ts` and break the Journal). This sprint's `npm run build` produced zero client-bundle warnings.

---

# Acceptance Criteria

- [x] `/projects/[id]/import` renders per-category Imported/Pending/Needs Review/Failed counts from real data.
- [x] Files can be imported in multiple stages without requiring everything at once; each visit starts a new, honestly-tracked Import Session.
- [x] Every imported file becomes a real `documents` row and a real Gateway `Source`, routed through the unmodified Drawing/Revision/Journal capabilities with no new parsing logic.
- [x] Imported assets can be linked to existing Knowledge Objects via the real Relationship Graph.
- [x] Timeline records `ASSET_IMPORTED`/`IMPORT_SESSION_COMPLETED` events with correct, category-aware humanized summaries.
- [x] Dashboard reflects imports (Import Progress panel, Recent Drawings) via the shared `getMissionControlData()` aggregator — no duplicate dashboard logic.
- [x] Delta answers all 5 new import-shaped questions correctly.
- [x] Recommendations fire only for real conditions (missing Specification, a classified drawing with no linked Requirement) and never duplicate the existing onboarding-gap signals.
- [x] A project with nothing imported shows an honest empty state, never fabricated content.
- [x] Existing Registration, Firm management, Project creation, Dashboard, Onboarding, Journal, Timeline, Knowledge pages, Recommendation Engine, Drawing Intelligence, and Revision Intelligence all have no regressions.

---

# Validation

- [x] Pass lint (`npm run lint`)
- [x] Pass type checking (`npx tsc --noEmit`)
- [x] Pass build (`npm run build`) — confirms `/projects/[id]/import` appears in the route manifest, no temporary smoke-test routes remain, and zero client-bundle warnings.
- [x] Restarted the development server cleanly for final verification — zero errors.
- [x] **Full end-to-end verification against the real, hosted Supabase project**, using the same temporary-Route-Handler-plus-Admin-API technique every prior sprint has used. Registered a real user, created a real Firm and Project, then imported one file each into Agreement, Reports, Meeting Minutes, and Drawings categories in a single session. Confirmed live: Agreement/Reports/Meeting Minutes correctly landed in `needs_review` (no capability claims those source types, exactly as Sprint 5.2 documented); the Drawings-category file correctly landed in `failed` with an honest "No parseable drawing data found" summary (the pre-existing Drawing Intelligence limitation, now visible for the first time); category status counts matched exactly (`agreement: 1 imported, 1 needs review`, `drawings: 1 imported, 1 failed`, 5 categories correctly flagged `isMissing`); the Import Session projection correctly summed all 4 files with a real `completedAt` once all reached terminal states; `finishImportSession()` published a correct, honestly-zero "0 file(s) imported" completion event (since none reached `completed`); Knowledge Linking created a real Relationship and appeared correctly on the Timeline; a supplementary check using Drawing Intelligence's own seeded mock upload (`drawing-a-104`) confirmed `drawingMissingRequirementLinkRule` fires correctly on `DRAWING_CLASSIFIED`; the Dashboard's `importCategories`/`recentDrawings` fields exactly matched the Import Workspace's own view; all 5 new Delta import questions returned correct, real answers; the Import Workspace, Dashboard, Journal, and Timeline pages all returned 200 throughout. **All test data was deleted from the hosted project after verification.**
- [x] Regression swept `/`, `/auth`, `/review`, `/projects`, `/projects/new`, `/participants`, `/firm` — all returned expected status codes (200 for public pages, 307 redirect-to-auth for protected pages when unauthenticated), matching every prior sprint's own baseline.

---

# Completion Notes

Completed work: see Files Expected to Change above — a firm can now import an existing project's documents, drawings, and records into DIGA in as many stages as needed, with every imported asset immediately real in the Knowledge Graph, Timeline, Recommendation Engine, and Delta — verified against the real hosted database, not simulated.

Known limitations (honestly disclosed, not fabricated away):

- Real drawing files uploaded through Import cannot be automatically classified by Drawing Intelligence today — only its own seeded mock uploads can — so every genuinely new Drawings-category import will show as "Failed" in the category status. This is Sprint 5.1's own pre-existing, documented foundation-only limitation (no real DWG/PDF parsing exists anywhere in this codebase), now simply visible in a new place rather than newly introduced.
- No revision-aware import exists — bringing in a drawing that already has prior revision history (Rev A, Rev B, ...) from before it joined DIGA is not supported this sprint; only a single current-state ingestion, matching exactly what Onboarding's Documents step already did.
- "Skipped files" (Module 2) can only ever be shown for the current, live session — a file that fails client-side validation before reaching the Gateway leaves no trace, so historical sessions cannot honestly report one.
- Recommendations never auto-resolve when their underlying gap is later filled (e.g., uploading a missing Drawing after its recommendation already fired) — a pre-existing Sprint 4.8 design decision inherited, not something this sprint changed.
- No permission enforcement, no real background-job/queue system, no real email delivery — all explicitly out of scope, matching every prior sprint's own exclusions.

Future extension points:

- Once real drawing parsing exists (a future, explicitly out-of-scope sprint), imported Drawings-category files will automatically stop landing in "Failed" — no change to this sprint's Import Workspace or Gateway wiring would be needed.
- Revision-aware import (accepting `previousRevisionLabel`/`currentRevisionLabel` at import time so an existing project's revision history is preserved) is a natural, bounded extension of Module 3 that this sprint deliberately did not build.
- A real Meeting Intelligence or Document Intelligence capability (Sprint 5.2's own long-anticipated future work) would let Meeting Minutes/Reports/BOQ/Specifications move out of `needs_review` automatically — no changes to this sprint's import flow would be required, only new Gateway capability registrations.

Modified files: see Files Expected to Change above.
