import { DRAWING_TYPES } from "@/types/drawing-intelligence";
import type { ConfidenceLevel } from "@/types/evidence";
import type { DrawingType, RawDrawingData } from "@/types/drawing-intelligence";

/**
 * Module 5: Drawing Classification. Deterministic, dictionary-driven — no
 * AI, matching every other classifier in this codebase (`IntentClassifier`,
 * `ChangeClassifier`). Ordered keyword rules against the sheet title; the
 * first match wins (order encodes priority, same convention `IntentClassifier`
 * uses), so a sheet titled e.g. "Site Plan — General Arrangement" still
 * classifies as `site_plan` rather than the later, less specific rule.
 */
const CLASSIFICATION_RULES: [RegExp, DrawingType][] = [
  [/schedule/i, DRAWING_TYPES.SCHEDULE],
  [/site plan/i, DRAWING_TYPES.SITE_PLAN],
  [/elevation/i, DRAWING_TYPES.ELEVATION],
  [/section/i, DRAWING_TYPES.SECTION],
  [/detail/i, DRAWING_TYPES.DETAIL],
  [/perspective/i, DRAWING_TYPES.PERSPECTIVE],
  [/general arrangement/i, DRAWING_TYPES.GENERAL_ARRANGEMENT],
  [/floor plan|roof plan/i, DRAWING_TYPES.FLOOR_PLAN],
];

export type ClassifiedDrawing = {
  drawingType: DrawingType;
  confidence: ConfidenceLevel;
};

export interface DrawingClassifier {
  classify(raw: RawDrawingData): ClassifiedDrawing;
}

export class DictionaryDrawingClassifier implements DrawingClassifier {
  classify(raw: RawDrawingData): ClassifiedDrawing {
    const match = CLASSIFICATION_RULES.find(([pattern]) => pattern.test(raw.sheetTitle));
    if (!match) {
      // Honest fallback, never a guess dressed up as a real classification —
      // mirrors `ChangeClassifier`'s own unknown-combination fallback.
      return { drawingType: DRAWING_TYPES.GENERAL_ARRANGEMENT, confidence: "low" };
    }

    return { drawingType: match[1], confidence: "high" };
  }
}

export const drawingClassifier: DrawingClassifier = new DictionaryDrawingClassifier();
