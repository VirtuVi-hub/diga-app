import { evidenceEngine } from "@/lib/intelligence-engine/evidence-engine";
import { DrawingService } from "@/lib/services/drawing-service";
import type { DeltaRelatedResult } from "@/lib/intelligence-engine/delta-query-resolver";
import type { Evidence } from "@/types/evidence";

/**
 * Module 11: Delta Integration. Structurally mirrors `revision-query.ts`
 * (Sprint 5.0) and `recommendation-query.ts` (Sprint 4.8): a small, anchored
 * keyword match, checked before Comprehension runs, answered by composing
 * real, already-persisted `Drawing` records plus the unmodified
 * `EvidenceEngine`/`RevisionService` — never a new AI pipeline, never a
 * second Delta.
 */
export function detectDrawingQuestion(text: string): boolean {
  const normalized = text.toLowerCase().trim();

  return (
    /\bwhat drawings exist\b/.test(normalized) ||
    /\bwhich is the latest revision\b/.test(normalized) ||
    /\bwhich (drawings?|sheets?) relate/.test(normalized) ||
    /\bshow (?:me )?drawings? related to\b/.test(normalized) ||
    /\bwhich sheets? changed\b/.test(normalized) ||
    /\bwhat sheets? exist\b/.test(normalized) ||
    // Existing Project Import (Sprint 5.6, Module 9): "Which drawings are
    // available?" — the same real `Drawing` listing as "what drawings
    // exist," just a different phrasing a firm importing an existing
    // project is more likely to use.
    /\bwhich drawings? (are|is) available\b/.test(normalized)
  );
}

/** Pulls the subject out of "relate(s) to X" / "related to X" / "about X" phrasing, if present. */
function extractTopic(text: string): string | undefined {
  const match = text.match(/(?:relate[sd]?\s+to|related to|about)\s+(.+?)[.?!]*$/i);
  return match?.[1]?.trim();
}

/**
 * One unified answer covers every trigger phrase above — Drawing
 * Intelligence is a foundation this sprint, not a deep per-phrase NLU
 * system, matching `revision-query.ts`'s own precedent exactly. When the
 * question names a topic ("relate to the entrance"), drawings are filtered
 * to real `EvidenceEngine` matches for that topic (never a fabricated
 * connection); otherwise every drawing in the project is listed.
 */
export async function answerDrawingQuestion(projectId: string, text: string): Promise<DeltaRelatedResult> {
  const allDrawings = await DrawingService.list({ projectId });
  const topic = extractTopic(text);

  let matched = allDrawings;
  if (topic) {
    const topicEvidence = await evidenceEngine.collect({ text: topic, entities: [], scopes: [{ level: "project", projectId }] });
    const matchedIds = new Set(topicEvidence.filter((item) => item.type === "Drawing").map((item) => item.id));
    matched = allDrawings.filter((drawing) => matchedIds.has(drawing.id));
  }

  const summaries = await Promise.all(matched.map((drawing) => DrawingService.getRevisionSummary(drawing.id)));

  const evidence: Evidence[] = matched.map((drawing, index) => {
    const summary = summaries[index];
    const changeNote = summary && summary.detectedChanges.length > 0 ? ` ${summary.detectedChanges.length} detected change(s): ${summary.detectedChanges.join("; ")}.` : "";
    return {
      id: drawing.id,
      title: `${drawing.sheetNumber} — ${drawing.title}`,
      type: "Drawing",
      relationship: "related",
      relevance: 1,
      confidence: 1,
      excerpt: `${drawing.drawingType.replace(/_/g, " ")}, current revision ${drawing.currentRevisionLabel}.${changeNote}`,
    };
  });

  return {
    kind: "related",
    heading: topic ? `Drawings related to "${topic}"` : "Drawings",
    evidence,
    reasoning: {
      found: evidence.map((item) => `✓ ${item.title}`),
      missing: topic && matched.length === 0 ? [`✗ No drawings found relating to "${topic}".`] : [],
      conclusion: matched.length
        ? `${matched.length} drawing(s) found.`
        : topic
          ? `No drawings relate to "${topic}" yet.`
          : "No drawings exist yet.",
    },
    confidence: matched.length ? "medium" : "none",
  };
}
