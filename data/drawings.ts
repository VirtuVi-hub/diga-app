import type { Drawing } from "@/types/drawing-intelligence";

const PROJECT_ID = "3c2384a0-bc60-4116-ba8c-5f1f52eedb42";

/**
 * Module 3/12: a realistic, believable seeded drawing set — Ground/First
 * Floor Plans, a Site Plan, an Elevation, a Section, a Canopy Detail, and
 * Door/Room Schedules — so the project feels alive from the start, not like
 * isolated mock objects. Every field here mirrors the matching entry in
 * `data/drawing-uploads.ts` 1:1 (same title/scale/discipline/views/
 * annotations), so re-running the live `DrawingIntelligenceEngine` pipeline
 * on any of these ids would reproduce consistent structural output — this
 * file is not auto-derived from that one at module-load time (the pipeline
 * calls async, server-action-backed collaborators, which is unsafe to run
 * during static module evaluation), but the two are kept deliberately in
 * sync by hand.
 *
 * `evidence`/`suggestedRelationships` are intentionally left empty here, and
 * `reasoning` is a short, honest placeholder — these are structural facts
 * about the sheet, known at authoring time. Real, LIVE evidence/reasoning
 * for any drawing (seeded or freshly ingested) is computed on demand by
 * `DrawingService.analyze()`, which calls the exact same `DrawingReasoner`/
 * `DrawingOrchestrator` the ingestion pipeline uses — never a stale,
 * potentially-wrong snapshot frozen at seed-authoring time.
 *
 * `drawing-a-101`'s `currentRevisionLabel`/`previousRevisionLabel` ("Rev C"/
 * "Rev B") and its "Guest Bedroom" annotation deliberately match Sprint
 * 5.0's own seeded mock revision diff (`data/revision-changes.ts`'s
 * `"drawing-a-101|Rev B|Rev C"` key) — the same real drawing, not a
 * coincidence, so `DrawingService.getRevisionSummary()` has real history to
 * show once that pipeline has been run (Module 10).
 */
const notYetAnalyzed = (title: string) => ({
  evidence: [],
  suggestedRelationships: [],
  reasoning: { found: [], missing: [], conclusion: `"${title}" has not been analyzed yet — call DrawingService.analyze() for live evidence.` },
});

export const drawings: Drawing[] = [
  {
    id: "drawing-a-100",
    projectId: PROJECT_ID,
    drawingType: "site_plan",
    sheetNumber: "A-100",
    title: "Site Plan",
    scale: "1:500",
    discipline: "Architectural",
    sourceFormat: "pdf",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-100", revision: "Rev A", date: "2026-07-15", author: "Maya Chen", discipline: "Architectural", scale: "1:500", sheetTitle: "Site Plan" },
    views: [{ id: "view-a-100-1", label: "Site Plan", viewType: "site_plan" }],
    annotations: [
      { id: "ann-a-100-1", type: "note", label: "North Point" },
      { id: "ann-a-100-2", type: "grid_label", label: "Grid Reference", value: "1-8 / A-F" },
    ],
    currentRevisionLabel: "Rev A",
    confidence: "high",
    status: "issued",
    createdRelationshipIds: [],
    createdAt: "2026-07-15T09:00:00Z",
    updatedAt: "2026-07-15T09:00:00Z",
    createdBy: "Maya Chen",
    ...notYetAnalyzed("Site Plan"),
  },
  {
    id: "drawing-a-101",
    projectId: PROJECT_ID,
    drawingType: "floor_plan",
    sheetNumber: "A-101",
    title: "Ground Floor Plan",
    scale: "1:100",
    discipline: "Architectural",
    sourceFormat: "pdf",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-101", revision: "Rev C", date: "2026-07-31", author: "Maya Chen", discipline: "Architectural", scale: "1:100", sheetTitle: "Ground Floor Plan" },
    views: [{ id: "view-a-101-1", label: "Ground Floor", viewType: "floor_plan" }],
    annotations: [
      { id: "ann-a-101-1", type: "room_name", label: "Guest Bedroom" },
      { id: "ann-a-101-2", type: "room_name", label: "Main Entrance Lobby" },
      { id: "ann-a-101-3", type: "level", label: "Level 00", value: "±0.000" },
      { id: "ann-a-101-4", type: "grid_label", label: "Grid Reference", value: "1-8 / A-F" },
      { id: "ann-a-101-5", type: "note", label: "Weather-protected clearance to accessible entrance per approved requirement" },
      { id: "ann-a-101-6", type: "revision_cloud", label: "Guest Bedroom enlarged, Rev C" },
    ],
    currentRevisionLabel: "Rev C",
    previousRevisionLabel: "Rev B",
    confidence: "high",
    status: "issued",
    createdRelationshipIds: [],
    createdAt: "2026-07-31T10:00:00Z",
    updatedAt: "2026-07-31T10:00:00Z",
    createdBy: "Maya Chen",
    ...notYetAnalyzed("Ground Floor Plan"),
  },
  {
    id: "drawing-a-102",
    projectId: PROJECT_ID,
    drawingType: "detail",
    sheetNumber: "A-102",
    title: "Canopy Detail",
    scale: "1:20",
    discipline: "Architectural",
    sourceFormat: "pdf",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-102", revision: "Rev B", date: "2026-07-31", author: "Omar Vale", discipline: "Architectural", scale: "1:20", sheetTitle: "Canopy Detail" },
    views: [{ id: "view-a-102-1", label: "Canopy Section Detail", viewType: "detail" }],
    annotations: [
      { id: "ann-a-102-1", type: "callout", label: "Canopy Grid — Material per Decision" },
      { id: "ann-a-102-2", type: "dimension", label: "Canopy Clearance Height", value: "2.4 m" },
    ],
    currentRevisionLabel: "Rev B",
    confidence: "high",
    status: "issued",
    createdRelationshipIds: [],
    createdAt: "2026-07-31T10:05:00Z",
    updatedAt: "2026-07-31T10:05:00Z",
    createdBy: "Omar Vale",
    ...notYetAnalyzed("Canopy Detail"),
  },
  {
    id: "drawing-a-103",
    projectId: PROJECT_ID,
    drawingType: "floor_plan",
    sheetNumber: "A-103",
    title: "First Floor Plan",
    scale: "1:100",
    discipline: "Architectural",
    sourceFormat: "pdf",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-103", revision: "Rev A", date: "2026-07-20", author: "Maya Chen", discipline: "Architectural", scale: "1:100", sheetTitle: "First Floor Plan" },
    views: [{ id: "view-a-103-1", label: "First Floor", viewType: "floor_plan" }],
    annotations: [
      { id: "ann-a-103-1", type: "room_name", label: "Premium Lounge" },
      { id: "ann-a-103-2", type: "level", label: "Level 01", value: "+4.500" },
      { id: "ann-a-103-3", type: "grid_label", label: "Grid Reference", value: "1-8 / A-F" },
    ],
    currentRevisionLabel: "Rev A",
    confidence: "high",
    status: "issued",
    createdRelationshipIds: [],
    createdAt: "2026-07-20T09:00:00Z",
    updatedAt: "2026-07-20T09:00:00Z",
    createdBy: "Maya Chen",
    ...notYetAnalyzed("First Floor Plan"),
  },
  {
    id: "drawing-a-201",
    projectId: PROJECT_ID,
    drawingType: "elevation",
    sheetNumber: "A-201",
    title: "North Elevation",
    scale: "1:100",
    discipline: "Architectural",
    sourceFormat: "pdf",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-201", revision: "Rev A", date: "2026-07-22", author: "Omar Vale", discipline: "Architectural", scale: "1:100", sheetTitle: "North Elevation" },
    views: [{ id: "view-a-201-1", label: "North Elevation", viewType: "elevation" }],
    annotations: [{ id: "ann-a-201-1", type: "note", label: "Facade material per Decision — Canopy Grid Material Approved" }],
    currentRevisionLabel: "Rev A",
    confidence: "high",
    status: "issued",
    createdRelationshipIds: [],
    createdAt: "2026-07-22T09:00:00Z",
    updatedAt: "2026-07-22T09:00:00Z",
    createdBy: "Omar Vale",
    ...notYetAnalyzed("North Elevation"),
  },
  {
    id: "drawing-a-301",
    projectId: PROJECT_ID,
    drawingType: "section",
    sheetNumber: "A-301",
    title: "Section A-A",
    scale: "1:100",
    discipline: "Architectural",
    sourceFormat: "pdf",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-301", revision: "Rev A", date: "2026-07-23", author: "Omar Vale", discipline: "Architectural", scale: "1:100", sheetTitle: "Section A-A" },
    views: [{ id: "view-a-301-1", label: "Section A-A", viewType: "section" }],
    annotations: [{ id: "ann-a-301-1", type: "dimension", label: "Floor-to-Floor Height", value: "4.5 m" }],
    currentRevisionLabel: "Rev A",
    confidence: "high",
    status: "issued",
    createdRelationshipIds: [],
    createdAt: "2026-07-23T09:00:00Z",
    updatedAt: "2026-07-23T09:00:00Z",
    createdBy: "Omar Vale",
    ...notYetAnalyzed("Section A-A"),
  },
  {
    id: "drawing-a-501",
    projectId: PROJECT_ID,
    drawingType: "schedule",
    sheetNumber: "A-501",
    title: "Door Schedule",
    scale: "NTS",
    discipline: "Architectural",
    sourceFormat: "pdf",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-501", revision: "Rev A", date: "2026-07-25", author: "Lina Cruz", discipline: "Architectural", scale: "NTS", sheetTitle: "Door Schedule" },
    views: [{ id: "view-a-501-1", label: "Door Schedule", viewType: "schedule" }],
    annotations: [{ id: "ann-a-501-1", type: "note", label: "References Ground Floor Plan door tags" }],
    currentRevisionLabel: "Rev A",
    confidence: "high",
    status: "issued",
    createdRelationshipIds: [],
    createdAt: "2026-07-25T09:00:00Z",
    updatedAt: "2026-07-25T09:00:00Z",
    createdBy: "Lina Cruz",
    ...notYetAnalyzed("Door Schedule"),
  },
  {
    id: "drawing-a-502",
    projectId: PROJECT_ID,
    drawingType: "schedule",
    sheetNumber: "A-502",
    title: "Room Schedule",
    scale: "NTS",
    discipline: "Architectural",
    sourceFormat: "pdf",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-502", revision: "Rev A", date: "2026-07-25", author: "Lina Cruz", discipline: "Architectural", scale: "NTS", sheetTitle: "Room Schedule" },
    views: [{ id: "view-a-502-1", label: "Room Schedule", viewType: "schedule" }],
    annotations: [{ id: "ann-a-502-1", type: "note", label: "References Ground Floor Plan and First Floor Plan room tags" }],
    currentRevisionLabel: "Rev A",
    confidence: "high",
    status: "issued",
    createdRelationshipIds: [],
    createdAt: "2026-07-25T09:00:00Z",
    updatedAt: "2026-07-25T09:00:00Z",
    createdBy: "Lina Cruz",
    ...notYetAnalyzed("Room Schedule"),
  },
];
