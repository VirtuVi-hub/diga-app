"use server";

import { RevisionService } from "@/lib/services/revision-service";
import type { RevisionFilter } from "@/lib/repositories/revision-repository";
import type { DetectRevisionInput, RevisionStatus } from "@/types/revision-intelligence";

export async function detectAndProcessRevision(input: DetectRevisionInput) {
  return RevisionService.detectAndProcess(input);
}

export async function getRevisions(filter?: RevisionFilter) {
  return RevisionService.list(filter);
}

export async function getRevision(id: string) {
  return RevisionService.get(id);
}

export async function reviewRevision(id: string, actorId: string, status: Extract<RevisionStatus, "reviewed" | "accepted" | "dismissed">) {
  return RevisionService.review(id, actorId, status);
}
