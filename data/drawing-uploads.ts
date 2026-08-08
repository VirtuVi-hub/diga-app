import type { RawDrawingData } from "@/types/drawing-intelligence";

/**
 * Seeded mock "parsed drawing" data (Sprint 5.1, Module 4/12) — stands in
 * for a future real DWG/DXF/IFC/Revit/image/CAD-API parser's raw output.
 * `DrawingParser` looks this up by drawing id; nothing downstream of it can
 * tell the difference between this and a real parser's output — that is the
 * whole point of the pipeline being format-agnostic (Module 1/12).
 *
 * Mirrors, 1:1, the eight already-issued sheets seeded directly into
 * `data/drawings.ts` (so re-running the live pipeline on any of them would
 * reproduce consistent output), plus one genuinely new sheet
 * (`drawing-a-104`, Second Floor Plan) used to exercise
 * `DrawingIntelligenceEngine`'s live pipeline end-to-end — the same
 * "seeded-but-provably-live" verification technique Sprint 5.0 used for
 * `data/revision-changes.ts`. `drawing-a-105` (Roof Plan) was added in
 * Sprint 5.2 as the Module 9 "architectural drawing" source, submitted
 * through the Project Intelligence Gateway rather than seeded directly.
 */
export const mockDrawingUploads: Record<string, RawDrawingData> = {
  "drawing-a-100": {
    sourceFormat: "pdf",
    sheetNumber: "A-100",
    sheetTitle: "Site Plan",
    scale: "1:500",
    discipline: "Architectural",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-100", revision: "Rev A", date: "2026-07-15", author: "Maya Chen" },
    rawViews: [{ label: "Site Plan", viewType: "site_plan" }],
    rawAnnotations: [
      { type: "note", label: "North Point" },
      { type: "grid_label", label: "Grid Reference", value: "1-8 / A-F" },
    ],
  },
  "drawing-a-101": {
    sourceFormat: "pdf",
    sheetNumber: "A-101",
    sheetTitle: "Ground Floor Plan",
    scale: "1:100",
    discipline: "Architectural",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-101", revision: "Rev C", previousRevision: "Rev B", date: "2026-07-31", author: "Maya Chen" },
    rawViews: [{ label: "Ground Floor", viewType: "floor_plan" }],
    rawAnnotations: [
      { type: "room_name", label: "Guest Bedroom" },
      { type: "room_name", label: "Main Entrance Lobby" },
      { type: "level", label: "Level 00", value: "±0.000" },
      { type: "grid_label", label: "Grid Reference", value: "1-8 / A-F" },
      { type: "note", label: "Weather-protected clearance to accessible entrance per approved requirement" },
      { type: "revision_cloud", label: "Guest Bedroom enlarged, Rev C" },
    ],
  },
  "drawing-a-102": {
    sourceFormat: "pdf",
    sheetNumber: "A-102",
    sheetTitle: "Canopy Detail",
    scale: "1:20",
    discipline: "Architectural",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-102", revision: "Rev B", date: "2026-07-31", author: "Omar Vale" },
    rawViews: [{ label: "Canopy Section Detail", viewType: "detail" }],
    rawAnnotations: [
      { type: "callout", label: "Canopy Grid — Material per Decision" },
      { type: "dimension", label: "Canopy Clearance Height", value: "2.4 m" },
    ],
  },
  "drawing-a-103": {
    sourceFormat: "pdf",
    sheetNumber: "A-103",
    sheetTitle: "First Floor Plan",
    scale: "1:100",
    discipline: "Architectural",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-103", revision: "Rev A", date: "2026-07-20", author: "Maya Chen" },
    rawViews: [{ label: "First Floor", viewType: "floor_plan" }],
    rawAnnotations: [
      { type: "room_name", label: "Premium Lounge" },
      { type: "level", label: "Level 01", value: "+4.500" },
      { type: "grid_label", label: "Grid Reference", value: "1-8 / A-F" },
    ],
  },
  "drawing-a-104": {
    sourceFormat: "pdf",
    sheetNumber: "A-104",
    sheetTitle: "Second Floor Plan",
    scale: "1:100",
    discipline: "Architectural",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-104", revision: "Rev A", date: "2026-08-04", author: "Maya Chen" },
    rawViews: [{ label: "Second Floor", viewType: "floor_plan" }],
    rawAnnotations: [
      { type: "room_name", label: "Accessible Suite" },
      { type: "level", label: "Level 02", value: "+9.000" },
      { type: "note", label: "Accessible entrance route continues via internal lift lobby" },
    ],
  },
  "drawing-a-105": {
    sourceFormat: "pdf",
    sheetNumber: "A-105",
    sheetTitle: "Roof Plan",
    scale: "1:100",
    discipline: "Architectural",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-105", revision: "Rev A", date: "2026-08-04", author: "Omar Vale" },
    rawViews: [{ label: "Roof Plan", viewType: "roof_plan" }],
    rawAnnotations: [{ type: "note", label: "Roof drainage falls to north parapet" }],
  },
  "drawing-a-201": {
    sourceFormat: "pdf",
    sheetNumber: "A-201",
    sheetTitle: "North Elevation",
    scale: "1:100",
    discipline: "Architectural",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-201", revision: "Rev A", date: "2026-07-22", author: "Omar Vale" },
    rawViews: [{ label: "North Elevation", viewType: "elevation" }],
    rawAnnotations: [{ type: "note", label: "Facade material per Decision — Canopy Grid Material Approved" }],
  },
  "drawing-a-301": {
    sourceFormat: "pdf",
    sheetNumber: "A-301",
    sheetTitle: "Section A-A",
    scale: "1:100",
    discipline: "Architectural",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-301", revision: "Rev A", date: "2026-07-23", author: "Omar Vale" },
    rawViews: [{ label: "Section A-A", viewType: "section" }],
    rawAnnotations: [{ type: "dimension", label: "Floor-to-Floor Height", value: "4.5 m" }],
  },
  "drawing-a-501": {
    sourceFormat: "pdf",
    sheetNumber: "A-501",
    sheetTitle: "Door Schedule",
    scale: "NTS",
    discipline: "Architectural",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-501", revision: "Rev A", date: "2026-07-25", author: "Lina Cruz" },
    rawViews: [{ label: "Door Schedule", viewType: "schedule" }],
    rawAnnotations: [{ type: "note", label: "References Ground Floor Plan door tags" }],
  },
  "drawing-a-502": {
    sourceFormat: "pdf",
    sheetNumber: "A-502",
    sheetTitle: "Room Schedule",
    scale: "NTS",
    discipline: "Architectural",
    titleBlock: { projectName: "Samir Vihar", drawingNumber: "A-502", revision: "Rev A", date: "2026-07-25", author: "Lina Cruz" },
    rawViews: [{ label: "Room Schedule", viewType: "schedule" }],
    rawAnnotations: [{ type: "note", label: "References Ground Floor Plan and First Floor Plan room tags" }],
  },
};
