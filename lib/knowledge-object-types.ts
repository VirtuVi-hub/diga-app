import { AlertTriangle, CheckSquare, FileText, Lock, Scale, ShieldAlert, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { WorkflowStage } from "@/lib/knowledge-validation/approval-roster";
import type { KnowledgeObjectPriority, KnowledgeObjectStatus, KnowledgeObjectType, ValidationState } from "@/types/knowledge-object";

export const knowledgeObjectTypeOrder: KnowledgeObjectType[] = [
  "requirement",
  "decision",
  "action",
  "issue",
  "risk",
  "constraint",
  "preference",
];

export const knowledgeObjectTypeConfig: Record<
  KnowledgeObjectType,
  { label: string; pluralLabel: string; icon: LucideIcon }
> = {
  requirement: { label: "Requirement", pluralLabel: "Requirements", icon: FileText },
  decision: { label: "Decision", pluralLabel: "Decisions", icon: Scale },
  action: { label: "Action", pluralLabel: "Actions", icon: CheckSquare },
  issue: { label: "Issue", pluralLabel: "Issues", icon: AlertTriangle },
  risk: { label: "Risk", pluralLabel: "Risks", icon: ShieldAlert },
  constraint: { label: "Constraint", pluralLabel: "Constraints", icon: Lock },
  preference: { label: "Preference", pluralLabel: "Preferences", icon: Star },
};

export const knowledgeObjectStatusOrder: KnowledgeObjectStatus[] = [
  "draft",
  "open",
  "approved",
  "resolved",
  "archived",
];

export const knowledgeObjectStatusLabels: Record<KnowledgeObjectStatus, string> = {
  draft: "Draft",
  open: "Open",
  approved: "Approved",
  resolved: "Resolved",
  archived: "Archived",
};

export const knowledgeObjectStatusBadgeClass: Record<KnowledgeObjectStatus, string> = {
  draft: "bg-surface-tertiary text-text-secondary",
  open: "bg-info/15 text-info",
  approved: "bg-success/15 text-success",
  resolved: "bg-success/15 text-success",
  archived: "bg-surface-tertiary text-text-tertiary",
};

export const knowledgeObjectPriorityOrder: KnowledgeObjectPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

export const knowledgeObjectPriorityLabels: Record<KnowledgeObjectPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const knowledgeObjectPriorityBadgeClass: Record<KnowledgeObjectPriority, string> = {
  low: "bg-surface-tertiary text-text-secondary",
  medium: "bg-surface-tertiary text-text-secondary",
  high: "bg-warning/15 text-warning",
  critical: "bg-error/15 text-error",
};

export const validationStateOrder: ValidationState[] = ["pending", "approved", "rejected", "needs_discussion", "revoked"];

export const validationStateLabels: Record<ValidationState, string> = {
  pending: "Pending Validation",
  approved: "Approved",
  rejected: "Rejected",
  revoked: "Approval Revoked",
  needs_discussion: "Needs Discussion",
};

export const validationStateBadgeClass: Record<ValidationState, string> = {
  pending: "bg-surface-tertiary text-text-secondary",
  approved: "bg-success/15 text-success",
  rejected: "bg-error/15 text-error",
  revoked: "bg-warning/15 text-warning",
  needs_discussion: "bg-info/15 text-info",
};

/** "Current Stage" (Sprint 4.9) — a richer, presentation-only lens on `ValidationState`; see `approval-roster.ts`. */
export const workflowStageLabels: Record<WorkflowStage, string> = {
  raised: "Raised",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  revoked: "Revoked",
  needs_discussion: "Needs Discussion",
};

export const workflowStageBadgeClass: Record<WorkflowStage, string> = {
  raised: "bg-surface-tertiary text-text-secondary",
  under_review: "bg-info/15 text-info",
  approved: "bg-success/15 text-success",
  rejected: "bg-error/15 text-error",
  revoked: "bg-warning/15 text-warning",
  needs_discussion: "bg-info/15 text-info",
};
