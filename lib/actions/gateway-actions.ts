"use server";

import { projectGatewayDashboard } from "@/lib/project-intelligence-gateway/gateway-dashboard";
import { SourceService } from "@/lib/services/source-service";
import type { SourceFilter } from "@/lib/repositories/source-repository";
import type { SourceSubmissionInput } from "@/types/project-intelligence-gateway";

export async function ingestSource(input: SourceSubmissionInput) {
  return SourceService.ingest(input);
}

export async function getSources(filter?: SourceFilter) {
  return SourceService.list(filter);
}

export async function getSource(id: string) {
  return SourceService.get(id);
}

/** Module 7: Gateway Dashboard Model — not wired into any UI this sprint (see the sprint doc), proves the projection is real and queryable end-to-end. */
export async function getGatewayDashboard(filter?: SourceFilter) {
  const sources = await SourceService.list(filter);
  return projectGatewayDashboard(sources);
}
