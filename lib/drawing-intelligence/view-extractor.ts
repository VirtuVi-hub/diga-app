import type { DrawingView, RawDrawingData } from "@/types/drawing-intelligence";

let sequence = 0;
function nextId(): string {
  sequence += 1;
  return `drawing-view-${Date.now()}-${sequence}`;
}

/**
 * Module 6: View Intelligence. Represents drawing views (Ground Floor, Roof
 * Plan, North Elevation, Section A-A, Door Schedule, ...) structurally —
 * label and view type only. Deliberately does NOT detect geometry: there is
 * no coordinate, boundary, or shape data anywhere in `DrawingView`, per the
 * brief's own instruction.
 */
export interface ViewExtractor {
  extract(raw: RawDrawingData): DrawingView[];
}

export class SeededViewExtractor implements ViewExtractor {
  extract(raw: RawDrawingData): DrawingView[] {
    return raw.rawViews.map((view) => ({ id: nextId(), label: view.label, viewType: view.viewType }));
  }
}

export const viewExtractor: ViewExtractor = new SeededViewExtractor();
