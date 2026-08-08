"use server";

import { RequirementService } from "@/lib/services/requirement-service";

export async function getRequirements(projectId: string) {
  return RequirementService.list(projectId);
}

export async function getRequirement(id: string) {
  return RequirementService.get(id);
}