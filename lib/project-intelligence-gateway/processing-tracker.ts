import type { ProcessingHistoryEntry, ProcessingState } from "@/types/project-intelligence-gateway";

/**
 * Module 5: Processing Tracker. A generic processing state (Received →
 * Classified → [Queued] → Processing → Completed / Needs Review / Failed) —
 * architectural only this sprint, per the brief: it does not yet power a
 * real upload-progress UI, it just gives `Source.processingHistory` an
 * honest, append-only record of every transition, the same "immutable
 * revision history" precedent `KnowledgeObject.revisions[]` already
 * established.
 */
export interface ProcessingTracker {
  record(history: ProcessingHistoryEntry[], state: ProcessingState, detail?: string): ProcessingHistoryEntry[];
}

export class AppendOnlyProcessingTracker implements ProcessingTracker {
  record(history: ProcessingHistoryEntry[], state: ProcessingState, detail?: string): ProcessingHistoryEntry[] {
    return [...history, { state, timestamp: new Date().toISOString(), detail }];
  }
}

export const processingTracker: ProcessingTracker = new AppendOnlyProcessingTracker();
