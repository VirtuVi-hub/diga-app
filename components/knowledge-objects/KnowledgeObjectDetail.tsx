"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { discussions } from "@/data/discussions";
import { reviseKnowledgeObject } from "@/lib/actions/knowledge-object-actions";
import { formatDateTime } from "@/lib/format-time";
import { WORKSPACE_FEED_MAX_WIDTH_CLASS } from "@/lib/workspace-layout";
import {
  knowledgeObjectPriorityBadgeClass,
  knowledgeObjectPriorityLabels,
  knowledgeObjectStatusBadgeClass,
  knowledgeObjectStatusLabels,
  knowledgeObjectTypeConfig,
  validationStateBadgeClass,
  validationStateLabels,
  workflowStageBadgeClass,
  workflowStageLabels,
} from "@/lib/knowledge-object-types";
import type { KnowledgeObject } from "@/types/knowledge-object";
import type { KnowledgeValidation } from "@/types/knowledge-validation";
import type { Relationship } from "@/types/relationship";
import { EvidenceSection } from "@/components/relationships/EvidenceSection";
import { ImpactsSection } from "@/components/relationships/ImpactsSection";
import { KnowledgeValidationPanel } from "@/components/knowledge-validation/KnowledgeValidationPanel";
import { KnowledgeObjectModal, type KnowledgeObjectFormValues } from "./KnowledgeObjectModal";

function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className="min-h-[80px] rounded-xl border border-border-subtle bg-surface-primary p-4">
      <h3 className="text-[13px] font-semibold text-text-primary">{label}</h3>
      <p className="mt-2 text-[13px] text-text-tertiary">No {label.toLowerCase()} yet.</p>
    </div>
  );
}

function WorkflowField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">{label}</p>
      <div className="mt-1 text-[13px] text-text-secondary">{children}</div>
    </div>
  );
}

/** Colors a required approver by which bucket the roster (real Event data) places them in — never a guess. */
function ApproverChip({ name, roster }: { name: string; roster: KnowledgeValidation["approvalRoster"] }) {
  const toneClass = roster.approvedBy.includes(name)
    ? "bg-success/15 text-success"
    : roster.rejectedBy.includes(name)
      ? "bg-error/15 text-error"
      : "bg-surface-tertiary text-text-secondary";

  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium ${toneClass}`}>{name}</span>;
}

/**
 * Replaces the old requirement-only, 3-line plain-text block (Sprint 4.9,
 * §4A/§4B/§5 — Approval Workflow Foundation). Works for every Knowledge
 * Object type, not just Requirement. Every field traces to a real, already-
 * fetched value — `revisions[0]`/`raisedTo`/`approvalRequiredFrom`/`notify`
 * are existing `KnowledgeObject` fields; Reviewers and the approver roster
 * come from `validation` (already assembled server-side, zero extra
 * queries); Current Stage is `validation.currentStage`, a derived label, not
 * a stored one.
 */
function WorkflowSection({ object, validation }: { object: KnowledgeObject; validation: KnowledgeValidation }) {
  const raisedBy = object.revisions[0]?.createdBy ?? "—";
  const approvers = object.approvalRequiredFrom ?? [];
  const notify = object.notify ?? [];
  const { pendingReviewers, discussionRequested } = validation.approvalRoster;

  return (
    <div className="border-t border-border-subtle px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Workflow</h2>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${workflowStageBadgeClass[validation.currentStage]}`}>
          {workflowStageLabels[validation.currentStage]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <WorkflowField label="Raised By">{raisedBy}</WorkflowField>
        <WorkflowField label="Current Owner">{object.raisedTo || "—"}</WorkflowField>

        <WorkflowField label="Reviewers">
          {validation.suggestedReviewers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {validation.suggestedReviewers.map((reviewer) => (
                <span
                  key={reviewer.id}
                  title={reviewer.reason}
                  className="inline-flex items-center rounded-full bg-surface-tertiary px-2 py-0.5 text-[12px] font-medium text-text-secondary"
                >
                  {reviewer.name}
                </span>
              ))}
            </div>
          ) : (
            "—"
          )}
        </WorkflowField>

        <WorkflowField label="Approvers">
          {approvers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {approvers.map((name) => (
                <ApproverChip
                  key={name}
                  name={name}
                  roster={validation.approvalRoster}
                />
              ))}
            </div>
          ) : (
            "—"
          )}
        </WorkflowField>

        <WorkflowField label="People Notified">
          {notify.length > 0 ? (
            <>
              {notify.join(", ")}
              <span className="ml-1.5 text-text-tertiary">(recorded, no delivery mechanism yet)</span>
            </>
          ) : (
            "—"
          )}
        </WorkflowField>

        <WorkflowField label="Next Step">
          {discussionRequested
            ? "A discussion was requested before this can proceed."
            : pendingReviewers.length > 0
              ? `Awaiting review from: ${pendingReviewers.join(", ")}`
              : "No pending reviewers."}
        </WorkflowField>
      </div>
    </div>
  );
}

export function KnowledgeObjectDetail({
  object: initialObject,
  evidence,
  impacts,
  validation,
}: {
  object: KnowledgeObject;
  evidence: Relationship[];
  impacts: Relationship[];
  validation: KnowledgeValidation;
}) {
  const router = useRouter();
  const [object, setObject] = useState(initialObject);
  const [isReviseOpen, setIsReviseOpen] = useState(false);

  const config = knowledgeObjectTypeConfig[object.type];
  const originDiscussion = discussions.find((item) => item.id === object.discussionId);
  const relatedDiscussions = object.relatedDiscussions
    .map((id) => discussions.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const handleRevise = async (values: KnowledgeObjectFormValues) => {
    const updated = await reviseKnowledgeObject(object.id, { createdBy: "Maya Chen", ...values });
    setObject(updated);
    setIsReviseOpen(false);
    router.refresh();
  };

  const revisionsNewestFirst = [...object.revisions].reverse();

  return (
    <div className={`mx-auto flex h-full min-h-0 w-full ${WORKSPACE_FEED_MAX_WIDTH_CLASS} flex-col overflow-y-auto`}>
      <div className="border-b border-border-subtle px-5 py-4">
        {originDiscussion && (
          <Link
            href={`/projects/${object.projectId}/discussions/${object.discussionId}`}
            className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-text-secondary transition hover:text-text-primary"
          >
            <ArrowLeft size={16} />
            Back to Discussion
          </Link>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 truncate font-display text-[20px] font-semibold tracking-[-0.03em] text-text-primary">{object.title}</h1>
            <span className="inline-flex shrink-0 items-center rounded-full bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
              {config.label}
            </span>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${knowledgeObjectStatusBadgeClass[object.status]}`}
            >
              {knowledgeObjectStatusLabels[object.status]}
            </span>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${knowledgeObjectPriorityBadgeClass[object.priority]}`}
            >
              {knowledgeObjectPriorityLabels[object.priority]}
            </span>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${validationStateBadgeClass[object.validationState]}`}
            >
              {validationStateLabels[object.validationState]}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsReviseOpen(true)}
            className="shrink-0 rounded-md px-3 py-1.5 text-[12px] font-semibold text-accent-primary transition hover:bg-surface-tertiary"
          >
            Revise {config.label}
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Description</h2>
        <p className="mt-2 text-[14px] leading-6 text-text-secondary">
          {object.description || "No description provided."}
        </p>
      </div>

      <WorkflowSection
        object={object}
        validation={validation}
      />

      <div className="border-t border-border-subtle px-5 py-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Revision History</h2>

        <div className="mt-3 space-y-3">
          {revisionsNewestFirst.map((revision) => (
            <div
              key={revision.id}
              className="rounded-lg border border-border-subtle bg-surface-primary p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-semibold text-text-primary">Revision {revision.revisionNumber}</span>
                <span className="text-[11px] text-text-tertiary">
                  {formatDateTime(revision.createdAt)} · {revision.createdBy}
                </span>
              </div>
              <p className="mt-1 truncate text-[13px] text-text-secondary">{revision.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border-subtle px-5 py-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Related Discussions</h2>

        <div className="mt-3">
          {relatedDiscussions.length === 0 ? (
            <p className="text-[13px] text-text-tertiary">No related discussions yet.</p>
          ) : (
            <ul className="space-y-1">
              {relatedDiscussions.map((discussion) => (
                <li key={discussion.id}>
                  <Link
                    href={`/projects/${object.projectId}/discussions/${discussion.id}`}
                    className="text-[13px] text-accent-primary hover:text-accent-hover"
                  >
                    {discussion.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <EvidenceSection relationships={evidence} />

      <ImpactsSection relationships={impacts} />

      <div className="grid grid-cols-2 gap-3 px-5 pb-5">
        <PlaceholderCard label="Related Documents" />
        <PlaceholderCard label="Related Drawings" />
      </div>

      <KnowledgeValidationPanel
        object={object}
        projectId={object.projectId}
        initialValidation={validation}
        onValidationStateChange={(nextValidationState) => setObject((current) => ({ ...current, validationState: nextValidationState }))}
      />

      <KnowledgeObjectModal
        mode="revise"
        type={object.type}
        isOpen={isReviseOpen}
        onClose={() => setIsReviseOpen(false)}
        initialValues={{
          title: object.title,
          description: object.description,
          priority: object.priority,
          status: object.status,
          relatedTopics: object.relatedTopics,
          raisedTo: object.raisedTo,
          approvalRequiredFrom: object.approvalRequiredFrom,
          notify: object.notify,
        }}
        onSubmit={handleRevise}
      />
    </div>
  );
}
