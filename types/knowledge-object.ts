/**
 * Sprint 5.7, Module 13: "constraint" and "preference" were added alongside
 * the original 5 to represent Client Questionnaire answers that aren't a
 * Requirement or a Risk. This is a data change, not an architecture change
 * — the same open-dictionary reasoning already applied to EVENT_TYPES.
 */
export type KnowledgeObjectType = "requirement" | "decision" | "action" | "issue" | "risk" | "constraint" | "preference";

export type KnowledgeObjectStatus = "draft" | "open" | "approved" | "resolved" | "archived";

export type KnowledgeObjectPriority = "low" | "medium" | "high" | "critical";

/**
 * Whether this Knowledge Object has been validated (Sprint 4.7) — a distinct
 * axis from `KnowledgeObjectStatus`, deliberately not merged into it.
 * `status` is the domain lifecycle (draft/open/resolved/archived/...), which
 * differs per type and will keep diverging as type-specific schemas land
 * (`DIGA-CORE-ARCHITECTURE-V2.md` §2.4/§4.1). `validationState` is the one
 * generic "has a human reviewed and trusted this" signal that applies
 * uniformly to every type. Every object starts `"pending"`.
 *
 * `"needs_discussion"` (Sprint 4.9 — Approval Workflow Foundation) is a 5th,
 * real, human-triggered state: a reviewer can explicitly flag that a
 * decision can't be made without a conversation first, mirroring exactly
 * how the other 4 states already work (one real write + one Event, no
 * transition-validity gating). It is never inferred/computed — there is no
 * honest automatic signal for "this needs discussion," so it only exists
 * when a person deliberately sets it.
 */
export type ValidationState = "pending" | "approved" | "rejected" | "revoked" | "needs_discussion";

export type KnowledgeObjectApproval = {
  id: string;
  approver: string;
  status: "pending" | "approved" | "rejected";
};

export type KnowledgeObjectRevision = {
  id: string;
  revisionNumber: number;
  title: string;
  description: string;
  priority: KnowledgeObjectPriority;
  status: KnowledgeObjectStatus;
  relatedTopics: string[];
  raisedTo?: string;
  approvalRequiredFrom?: string[];
  notify?: string[];
  createdAt: string;
  createdBy: string;
};

export type KnowledgeObject = {
  id: string;
  projectId: string;
  discussionId: string;
  type: KnowledgeObjectType;

  title: string;
  description: string;
  priority: KnowledgeObjectPriority;
  status: KnowledgeObjectStatus;
  relatedTopics: string[];
  raisedTo?: string;
  approvalRequiredFrom?: string[];
  notify?: string[];
  validationState: ValidationState;

  revisions: KnowledgeObjectRevision[];

  relatedDiscussions: string[];
  relatedDocuments: string[];
  relatedDrawings: string[];
  approvals: KnowledgeObjectApproval[];

  createdAt: string;
  updatedAt: string;
};

export type CreateKnowledgeObjectInput = {
  projectId: string;
  discussionId: string;
  type: KnowledgeObjectType;
  title: string;
  description: string;
  priority: KnowledgeObjectPriority;
  status: KnowledgeObjectStatus;
  relatedTopics: string[];
  raisedTo?: string;
  approvalRequiredFrom?: string[];
  notify?: string[];
  createdBy: string;
};

export type ReviseKnowledgeObjectInput = {
  title: string;
  description: string;
  priority: KnowledgeObjectPriority;
  status: KnowledgeObjectStatus;
  relatedTopics: string[];
  raisedTo?: string;
  approvalRequiredFrom?: string[];
  notify?: string[];
  createdBy: string;
};
