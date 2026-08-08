import { projectGatewayDashboard } from "@/lib/project-intelligence-gateway/gateway-dashboard";
import { SourceService } from "@/lib/services/source-service";
import type { DeltaRelatedResult } from "@/lib/intelligence-engine/delta-query-resolver";
import type { Evidence } from "@/types/evidence";
import type { Source } from "@/types/project-intelligence-gateway";

/**
 * Module 8: Delta Integration. Structurally mirrors `drawing-query.ts`
 * (Sprint 5.1) and `revision-query.ts` (Sprint 5.0): a small, anchored
 * keyword match, checked before Comprehension runs, answered from real
 * `Source` records via the unmodified `GatewayDashboard` projection — never
 * a new AI pipeline, never a second Delta. Unlike Drawing/Revision
 * Intelligence's "one unified answer," the five example questions here map
 * onto genuinely different dashboard slices (recent vs. in-progress vs.
 * completed-drawings vs. failed vs. latest-only), so each is answered with
 * its own real subset — closer to `timeline-query.ts`'s own multi-kind
 * precedent than a single blanket listing.
 */
export type GatewayQueryKind = "recent_uploads" | "currently_processing" | "drawings_analyzed" | "failed_sources" | "latest_knowledge";

export function detectGatewayQuestion(text: string): GatewayQueryKind | null {
  const normalized = text.toLowerCase().trim();

  if (/\bwhat knowledge was extracted from the latest upload\b/.test(normalized)) return "latest_knowledge";
  if (/\bwhich sources? failed\b/.test(normalized)) return "failed_sources";
  if (/\bwhich drawings? (have been |were )?analy[sz]ed\b/.test(normalized)) return "drawings_analyzed";
  if (/\bwhat('| i)s (currently )?processing\b/.test(normalized)) return "currently_processing";
  if (/\bwhat (has |have )?(recently )?(been )?uploaded\b/.test(normalized)) return "recent_uploads";

  return null;
}

function toEvidence(source: Source): Evidence {
  return {
    id: source.id,
    title: source.filename ?? source.id,
    type: "Source",
    relationship: "related",
    relevance: 1,
    confidence: 1,
    excerpt: `${source.sourceType.replace(/_/g, " ")}, ${source.processingState.replace(/_/g, " ")}.${source.outcomeSummary ? ` ${source.outcomeSummary}` : ""}`,
  };
}

export async function answerGatewayQuestion(projectId: string, kind: GatewayQueryKind): Promise<DeltaRelatedResult> {
  const sources = await SourceService.list({ projectId });
  const dashboard = projectGatewayDashboard(sources);

  const { heading, matched } = ((): { heading: string; matched: Source[] } => {
    switch (kind) {
      case "recent_uploads":
        return { heading: "Recently Uploaded", matched: dashboard.recentSources };
      case "currently_processing":
        return { heading: "Currently Processing", matched: sources.filter((source) => ["received", "classified", "queued", "processing"].includes(source.processingState)) };
      case "drawings_analyzed":
        return { heading: "Drawings Analyzed", matched: sources.filter((source) => source.sourceType === "drawing" && source.processingState === "completed") };
      case "failed_sources":
        return { heading: "Failed Sources", matched: dashboard.failed };
      case "latest_knowledge": {
        const latestCompleted = sources
          .filter((source) => source.processingState === "completed")
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
        return { heading: "Knowledge From The Latest Upload", matched: latestCompleted ? [latestCompleted] : [] };
      }
    }
  })();

  const evidence = matched.map(toEvidence);

  return {
    kind: "related",
    heading,
    evidence,
    reasoning: {
      found: evidence.map((item) => `✓ ${item.title}`),
      missing: [],
      conclusion: matched.length ? `${matched.length} source(s) found.` : "Nothing to show yet.",
    },
    confidence: matched.length ? "medium" : "none",
  };
}
