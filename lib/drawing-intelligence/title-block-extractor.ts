import type { RawDrawingData, TitleBlock } from "@/types/drawing-intelligence";

/**
 * Module 4: Title Block Intelligence. Extracts Project name / Drawing
 * number / Revision / Date / Discipline / Author / Scale / Sheet title from
 * already-structured seed data this sprint — no OCR. The architecture
 * supports OCR later: a future real implementation of this exact interface
 * would read these same fields off a scanned/rasterized title block region
 * instead of a lookup table, and nothing else in the pipeline would need to
 * change.
 */
export interface TitleBlockExtractor {
  extract(raw: RawDrawingData): TitleBlock;
}

export class SeededTitleBlockExtractor implements TitleBlockExtractor {
  extract(raw: RawDrawingData): TitleBlock {
    return {
      projectName: raw.titleBlock.projectName,
      drawingNumber: raw.titleBlock.drawingNumber,
      revision: raw.titleBlock.revision,
      date: raw.titleBlock.date,
      discipline: raw.discipline,
      author: raw.titleBlock.author,
      scale: raw.scale,
      sheetTitle: raw.sheetTitle,
    };
  }
}

export const titleBlockExtractor: TitleBlockExtractor = new SeededTitleBlockExtractor();
