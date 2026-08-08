import type { DrawingType, RawDrawingData } from "@/types/drawing-intelligence";

export type SheetAnalysis = {
  sheetNumber: string;
  scale: string;
  discipline: string;
};

/**
 * Module: Sheet Analyzer. Aggregates the sheet-level facts every drawing
 * type shares (sheet number, scale, discipline) into one place, independent
 * of `drawingType` — deliberately not just a passthrough of `raw`, since a
 * future real parser may omit scale (e.g. a schedule sheet is often "NTS" —
 * Not To Scale — by convention, not by parser error). `drawingType` is
 * accepted for that one honest default; nothing else here branches on it.
 */
export interface SheetAnalyzer {
  analyze(raw: RawDrawingData, drawingType: DrawingType): SheetAnalysis;
}

export class DefaultSheetAnalyzer implements SheetAnalyzer {
  analyze(raw: RawDrawingData, drawingType: DrawingType): SheetAnalysis {
    return {
      sheetNumber: raw.sheetNumber.trim(),
      scale: raw.scale.trim() || (drawingType === "schedule" ? "NTS" : "Not specified"),
      discipline: raw.discipline.trim() || "Unspecified",
    };
  }
}

export const sheetAnalyzer: SheetAnalyzer = new DefaultSheetAnalyzer();
