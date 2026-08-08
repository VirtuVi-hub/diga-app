import { diffKey, mockDrawingDiffs } from "@/data/revision-changes";
import type { DetectRevisionInput, RawDetectedChange } from "@/types/revision-intelligence";

/**
 * Module: Revision Comparator. DIGA is not an image-comparison tool — this
 * module never touches pixels, files, or CAD geometry. It only ever
 * consumes an already-structured diff: today, seeded mock data standing in
 * for a future DWG/Revit/IFC/Computer-Vision parser (Module 12); tomorrow,
 * that parser's real output, behind this exact same interface. Nothing
 * downstream of this module needs to change when that swap happens.
 */
export interface RevisionComparator {
  compare(input: DetectRevisionInput): Promise<RawDetectedChange[]>;
}

export class MockRevisionComparator implements RevisionComparator {
  async compare(input: DetectRevisionInput): Promise<RawDetectedChange[]> {
    const key = diffKey(input.sourceDrawing.id, input.previousRevisionLabel, input.currentRevisionLabel);
    return mockDrawingDiffs[key] ?? [];
  }
}

export const revisionComparator: RevisionComparator = new MockRevisionComparator();
