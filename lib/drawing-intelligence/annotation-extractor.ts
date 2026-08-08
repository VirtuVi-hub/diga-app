import type { DrawingAnnotation, RawDrawingData } from "@/types/drawing-intelligence";

let sequence = 0;
function nextId(): string {
  sequence += 1;
  return `drawing-annotation-${Date.now()}-${sequence}`;
}

/**
 * Module 7: Annotation Intelligence. Represents room names, levels,
 * dimensions, grid labels, callouts, revision clouds, and notes
 * structurally — seeded data only this sprint, architecture-first. No OCR,
 * no geometry: `DrawingAnnotation` never carries a coordinate.
 */
export interface AnnotationExtractor {
  extract(raw: RawDrawingData): DrawingAnnotation[];
}

export class SeededAnnotationExtractor implements AnnotationExtractor {
  extract(raw: RawDrawingData): DrawingAnnotation[] {
    return raw.rawAnnotations.map((annotation) => ({ id: nextId(), type: annotation.type, label: annotation.label, value: annotation.value }));
  }
}

export const annotationExtractor: AnnotationExtractor = new SeededAnnotationExtractor();
