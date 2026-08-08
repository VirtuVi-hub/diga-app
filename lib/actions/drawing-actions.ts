"use server";

import { DrawingService } from "@/lib/services/drawing-service";
import type { DrawingFilter } from "@/lib/repositories/drawing-repository";
import type { DrawingUploadInput } from "@/types/drawing-intelligence";

export async function ingestDrawing(input: DrawingUploadInput) {
  return DrawingService.ingest(input);
}

export async function getDrawings(filter?: DrawingFilter) {
  return DrawingService.list(filter);
}

export async function getDrawing(id: string) {
  return DrawingService.get(id);
}

export async function analyzeDrawing(id: string) {
  return DrawingService.analyze(id);
}

export async function getDrawingRevisionSummary(id: string) {
  return DrawingService.getRevisionSummary(id);
}
