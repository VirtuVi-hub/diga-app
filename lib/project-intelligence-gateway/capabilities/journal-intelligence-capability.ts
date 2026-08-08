import { deltaComprehensionService } from "@/lib/comprehension/delta-comprehension-service";
import { SOURCE_TYPES } from "@/types/project-intelligence-gateway";
import type { IntelligenceCapability } from "../capability-router";
import type { ProcessingOutcome, Source } from "@/types/project-intelligence-gateway";

/**
 * Capability adapter for Journal Intelligence (Sprints 4.1–4.4). Claims
 * `"chat"`-typed sources — a Journal entry, a WhatsApp export, or any other
 * free-text conversational input is, structurally, the same thing the
 * Journal's own input already handles.
 *
 * Deliberately calls only `deltaComprehensionService.comprehend()` (the
 * unmodified Sprint 4.1 Comprehension Engine), never the full Knowledge
 * Capture Engine draft-creation flow. Knowledge Capture (Sprint 4.4)
 * requires a human Approve step before anything is written to the Knowledge
 * Graph — that gate exists on purpose, and the Gateway must not bypass it
 * by auto-approving a draft on a source's behalf. `process()` therefore
 * always reports `needsReview: true`: comprehension/classification is real
 * and complete, but the actual knowledge creation remains a human,
 * Journal-UI decision, exactly as it already was before this sprint.
 */
export const journalIntelligenceCapability: IntelligenceCapability = {
  id: "journal_intelligence",
  label: "Journal Intelligence",

  canHandle(source: Source): boolean {
    return source.sourceType === SOURCE_TYPES.CHAT;
  },

  async process(source: Source): Promise<ProcessingOutcome> {
    const text = typeof source.metadata.text === "string" ? source.metadata.text : "";
    if (!text.trim()) {
      return { capabilityId: "journal_intelligence", success: false, summary: "No text content to comprehend." };
    }

    const comprehension = deltaComprehensionService.comprehend({ text, context: { projectId: source.projectId } });
    const destinationLabel = comprehension.destination.destination.replace(/_/g, " ");

    return {
      capabilityId: "journal_intelligence",
      success: true,
      needsReview: true,
      summary: `Classified as "${destinationLabel}" (confidence ${comprehension.destination.confidence.toFixed(2)}) — awaiting human review in the Journal.`,
      detail: { destination: comprehension.destination.destination, intent: comprehension.intent.intent },
    };
  },
};
