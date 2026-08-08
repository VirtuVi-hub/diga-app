import { mockDrawingUploads } from "@/data/drawing-uploads";
import type { DrawingUploadInput, RawDrawingData } from "@/types/drawing-intelligence";

/**
 * Module: Drawing Parser. This is the ONLY module in the pipeline that ever
 * knows an input format exists (`DrawingUploadInput.sourceFormat`) — and
 * even here, the format is not actually used to branch behavior, because
 * DIGA is not building "PDF Intelligence": PDF is simply the first
 * supported input format. Today this reads seeded mock data
 * (`data/drawing-uploads.ts`); tomorrow, a real DWG/DXF/IFC/Revit/image/
 * CAD-API parser sits behind this exact same interface, returning the same
 * format-agnostic `RawDrawingData` shape. Nothing downstream —
 * `DrawingClassifier` onward — needs to change when that swap happens.
 * Returns `null`, honestly, when nothing has been parsed for this id yet —
 * never a fabricated sheet.
 */
export interface DrawingParser {
  parse(input: DrawingUploadInput): Promise<RawDrawingData | null>;
}

export class MockDrawingParser implements DrawingParser {
  async parse(input: DrawingUploadInput): Promise<RawDrawingData | null> {
    return mockDrawingUploads[input.drawingId] ?? null;
  }
}

export const drawingParser: DrawingParser = new MockDrawingParser();
