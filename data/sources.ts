import type { ProcessingHistoryEntry, Source } from "@/types/project-intelligence-gateway";

const PROJECT_ID = "3c2384a0-bc60-4116-ba8c-5f1f52eedb42";

function history(...entries: Omit<ProcessingHistoryEntry, "timestamp">[]): ProcessingHistoryEntry[] {
  return entries.map((entry, index) => ({ ...entry, timestamp: `2026-08-0${index + 1}T09:00:00Z` }));
}

/**
 * Module 9: Seed Complete Project Sources. A believable mix of everything a
 * real architecture project actually receives — not just drawings. Every
 * `sourceType`/`processingState` here is exactly what
 * `SourceClassifier`/`CapabilityRouter`/`GatewayOrchestrator` would
 * deterministically produce for that filename today (verified by hand
 * against their own rule tables, the same "kept deliberately in sync"
 * precedent `data/drawings.ts` uses for `data/drawing-uploads.ts`) — none
 * of these were fabricated as "completed" when no capability exists to
 * honestly complete them.
 *
 * Six of the nine correctly land in `"needs_review"`, for the same honest
 * reason: Meeting/Document/Photo/Spreadsheet/Email/Site-Report Intelligence
 * do not exist yet (explicitly out of scope this sprint) — this is Module
 * 10's "future engines must register themselves" claim, demonstrated by its
 * own absence, not asserted. The architectural drawing (`drawing-a-105`,
 * Roof Plan) and the WhatsApp export are deliberately left at `"received"`/
 * `"classified"` rather than a fabricated outcome — both are actually run
 * through the live `ProjectIntelligenceGateway` in this sprint's own
 * verification (see the Sprint 5.2 doc), which is the honest way to know
 * what happens next, not a hand-guessed one.
 */
export const sources: Source[] = [
  {
    id: "source-drawing-a-105",
    projectId: PROJECT_ID,
    sourceType: "drawing",
    filename: "A-105 Roof Plan.pdf",
    processingState: "received",
    processingHistory: history({ state: "received" }),
    confidence: "none",
    metadata: { drawingId: "drawing-a-105", sourceFormat: "pdf" },
    createdAt: "2026-08-04T09:00:00Z",
    updatedAt: "2026-08-04T09:00:00Z",
    createdBy: "Omar Vale",
  },
  {
    id: "source-client-brief",
    projectId: PROJECT_ID,
    sourceType: "document",
    filename: "Samir Vihar - Client Brief.docx",
    processingState: "needs_review",
    processingHistory: history({ state: "received" }, { state: "classified", detail: "document" }, { state: "needs_review", detail: 'No registered capability handles source type "document" yet.' }),
    confidence: "medium",
    outcomeSummary: 'No registered capability handles source type "document" yet — a future Document Intelligence engine may claim it.',
    metadata: {},
    createdAt: "2026-07-10T09:00:00Z",
    updatedAt: "2026-07-10T09:00:00Z",
    createdBy: "David Roth",
  },
  {
    id: "source-meeting-transcript-w12",
    projectId: PROJECT_ID,
    sourceType: "meeting",
    filename: "Design Coordination Week 12 - Meeting Transcript.docx",
    processingState: "needs_review",
    processingHistory: history({ state: "received" }, { state: "classified", detail: "meeting" }, { state: "needs_review", detail: 'No registered capability handles source type "meeting" yet.' }),
    confidence: "medium",
    outcomeSummary: 'No registered capability handles source type "meeting" yet — a future Meeting Intelligence engine may claim it.',
    metadata: {},
    createdAt: "2026-07-31T10:30:00Z",
    updatedAt: "2026-07-31T10:30:00Z",
    createdBy: "Maya Chen",
  },
  {
    id: "source-spec-accessibility",
    projectId: PROJECT_ID,
    sourceType: "specification",
    filename: "Accessibility Specification.pdf",
    processingState: "needs_review",
    processingHistory: history({ state: "received" }, { state: "classified", detail: "specification" }, { state: "needs_review", detail: 'No registered capability handles source type "specification" yet.' }),
    confidence: "medium",
    outcomeSummary: 'No registered capability handles source type "specification" yet — a future Document Intelligence engine may claim it.',
    metadata: {},
    createdAt: "2026-07-18T09:00:00Z",
    updatedAt: "2026-07-18T09:00:00Z",
    createdBy: "Lina Cruz",
  },
  {
    id: "source-site-photos-canopy",
    projectId: PROJECT_ID,
    sourceType: "photo",
    filename: "Site Photos - Curbside Canopy.jpg",
    processingState: "needs_review",
    processingHistory: history({ state: "received" }, { state: "classified", detail: "photo" }, { state: "needs_review", detail: 'No registered capability handles source type "photo" yet.' }),
    confidence: "medium",
    outcomeSummary: 'No registered capability handles source type "photo" yet — a future Photo Intelligence engine may claim it.',
    metadata: {},
    createdAt: "2026-07-31T10:36:00Z",
    updatedAt: "2026-07-31T10:36:00Z",
    createdBy: "Omar Vale",
  },
  {
    id: "source-boq",
    projectId: PROJECT_ID,
    sourceType: "spreadsheet",
    filename: "Bill of Quantities - Rev A.xlsx",
    processingState: "needs_review",
    processingHistory: history({ state: "received" }, { state: "classified", detail: "spreadsheet" }, { state: "needs_review", detail: 'No registered capability handles source type "spreadsheet" yet.' }),
    confidence: "medium",
    outcomeSummary: 'No registered capability handles source type "spreadsheet" yet — a future Document Intelligence engine may claim it.',
    metadata: {},
    createdAt: "2026-07-28T09:00:00Z",
    updatedAt: "2026-07-28T09:00:00Z",
    createdBy: "Lina Cruz",
  },
  {
    id: "source-email-client-feedback",
    projectId: PROJECT_ID,
    sourceType: "email",
    filename: "Client Feedback Email.eml",
    processingState: "needs_review",
    processingHistory: history({ state: "received" }, { state: "classified", detail: "email" }, { state: "needs_review", detail: 'No registered capability handles source type "email" yet.' }),
    confidence: "medium",
    outcomeSummary: 'No registered capability handles source type "email" yet — a future Document Intelligence engine may claim it.',
    metadata: {},
    createdAt: "2026-07-30T16:10:00Z",
    updatedAt: "2026-07-30T16:10:00Z",
    createdBy: "David Roth",
  },
  {
    id: "source-whatsapp-ramp-width",
    projectId: PROJECT_ID,
    sourceType: "chat",
    filename: "WhatsApp Export - Ramp Width Discussion.txt",
    processingState: "classified",
    processingHistory: history({ state: "received" }, { state: "classified", detail: "chat" }),
    confidence: "medium",
    metadata: { text: "The proposed 2.4 metre clear width retains baggage equipment access while meeting the public circulation strategy." },
    createdAt: "2026-07-30T16:12:00Z",
    updatedAt: "2026-07-30T16:12:00Z",
    createdBy: "Priya Nair",
  },
  {
    id: "source-site-visit-notes",
    projectId: PROJECT_ID,
    sourceType: "site_report",
    filename: "Site Visit Notes - 2026-08-01.docx",
    processingState: "needs_review",
    processingHistory: history({ state: "received" }, { state: "classified", detail: "site_report" }, { state: "needs_review", detail: 'No registered capability handles source type "site_report" yet.' }),
    confidence: "medium",
    outcomeSummary: 'No registered capability handles source type "site_report" yet — a future Meeting Intelligence engine may claim it.',
    metadata: {},
    createdAt: "2026-08-01T14:00:00Z",
    updatedAt: "2026-08-01T14:00:00Z",
    createdBy: "Maya Chen",
  },
];
