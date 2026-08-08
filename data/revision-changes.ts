import type { RawDetectedChange } from "@/types/revision-intelligence";

/**
 * Seeded mock "drawing diff" data (Sprint 5.0, Module 12) — stands in for a
 * future DWG/Revit/IFC/Computer-Vision parser's raw output. Keyed by source
 * drawing id + revision-pair label, so `RevisionComparator` can look up
 * "what changed" without ever touching pixels, files, or CAD geometry. The
 * rest of the Revision Intelligence pipeline cannot tell the difference
 * between this and a real parser's output — that is the point of Module 12.
 */
export const mockDrawingDiffs: Record<string, RawDetectedChange[]> = {
  "drawing-a-101|Rev B|Rev C": [
    { elementType: "room", elementLabel: "Guest Bedroom", verb: "resized", before: "12 sqm", after: "15 sqm" },
    { elementType: "entrance", elementLabel: "Main Entrance", verb: "moved", before: "North facade", after: "West facade" },
    { elementType: "ramp", elementLabel: "Accessible Ramp", verb: "resized", before: "1.5 m width", after: "1.2 m width" },
  ],
};

export function diffKey(sourceDrawingId: string, previousRevisionLabel: string, currentRevisionLabel: string): string {
  return `${sourceDrawingId}|${previousRevisionLabel}|${currentRevisionLabel}`;
}
