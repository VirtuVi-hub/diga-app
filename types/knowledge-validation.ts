import type { ConfidenceLevel, Evidence, ReasoningResult } from "@/types/evidence";
import type { TimelineEntry } from "@/lib/events/timeline-projection";
import type { WorkflowStage } from "@/lib/knowledge-validation/approval-roster";

/**
 * Knowledge Validation & Approval Intelligence (Sprint 4.7). One generic
 * shape covering every Knowledge Object type — Requirement, Decision,
 * Action, Issue, Risk — since the panel that consumes it must never be
 * type-specific (`DIGA-CORE-ARCHITECTURE-V2.md` §2.4, and the sprint brief's
 * own explicit "do not build RequirementApproval/DecisionApproval/..."
 * instruction). Everything here is assembled from existing engines
 * (`EvidenceEngine`, `ConfidenceScorer`, `ReasoningEngine`, the Event Log) —
 * nothing is a new source of truth.
 */

export type ValidationCheckSeverity = "info" | "warning";

/**
 * A lightweight, informational-only check — never blocks approval, per the
 * brief ("Present these as informational warnings. Do NOT block approval").
 */
export type ValidationCheck = {
  id: string;
  label: string;
  severity: ValidationCheckSeverity;
  detail: string;
};

/**
 * A recommendation only — nothing assigns a reviewer automatically. `reason`
 * traces back to real data (a field on the object, or a linked Discussion's
 * participant list), never a fabricated suggestion.
 */
export type SuggestedReviewer = {
  id: string;
  name: string;
  reason: string;
};

/**
 * Approval Workflow Foundation (Sprint 4.9) — a read-only aggregate built
 * entirely from real `approval.*` Events, per the architecture doc's own §8
 * suggestion ("an approval aggregate — built from approval events, not a
 * competing store"). No gating: this only describes what has happened, it
 * never blocks a transition.
 */
export type ApprovalRoster = {
  /** = `KnowledgeObject.approvalRequiredFrom`, carried here for convenience. */
  requiredReviewers: string[];
  /** Distinct actor ids from `approval.granted.v1` events on this node. */
  approvedBy: string[];
  /** Distinct actor ids from `approval.rejected.v1` events on this node. */
  rejectedBy: string[];
  /** `requiredReviewers` minus `approvedBy` minus `rejectedBy`. */
  pendingReviewers: string[];
  /** Whether an `approval.discussion_requested.v1` event exists for this node. */
  discussionRequested: boolean;
};

export type KnowledgeValidation = {
  knowledgeObjectId: string;
  /** Reuses the object's own description — never synthesized prose. */
  summary: string;
  evidence: Evidence[];
  relatedKnowledge: Evidence[];
  impacts: Evidence[];
  /** Most-recent-first, capped — see `knowledge-validation-engine.ts`. */
  timeline: TimelineEntry[];
  confidence: ConfidenceLevel;
  reasoning: ReasoningResult;
  suggestedReviewers: SuggestedReviewer[];
  checks: ValidationCheck[];
  approvalRoster: ApprovalRoster;
  /** See `lib/knowledge-validation/approval-roster.ts`'s `computeCurrentStage`. */
  currentStage: WorkflowStage;
};
