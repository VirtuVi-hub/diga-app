"use client";

import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveKnowledgeObject,
  flagKnowledgeObjectForDiscussion,
  getKnowledgeValidation,
  rejectKnowledgeObject,
  requestKnowledgeObjectApproval,
  revokeKnowledgeObjectApproval,
} from "@/lib/actions/knowledge-validation-actions";
import { validationStateBadgeClass, validationStateLabels } from "@/lib/knowledge-object-types";
import { formatDateTime } from "@/lib/format-time";
import type { KnowledgeObject, ValidationState } from "@/types/knowledge-object";
import type { KnowledgeValidation, ValidationCheck } from "@/types/knowledge-validation";
import { ConfidenceBadge, EvidenceList, FieldLabel, ReasoningSection } from "@/components/delta/EvidenceDisplay";
import { DeltaMark } from "@/components/delta/DeltaMark";
import { DeltaResponsePanel } from "@/components/delta/DeltaResponsePanel";
import { useDeltaPanel } from "@/components/delta/useDeltaPanel";
import { TimelineEntryCard } from "@/components/timeline/TimelineEntryCard";

/** Hardcoded stand-in for the signed-in user, matching the exact convention `KnowledgeObjectDetail.tsx`'s `handleRevise` already uses — no real authentication exists yet. */
const CURRENT_ACTOR = "Maya Chen";

const PRESET_QUESTIONS = ["Why should this be approved?", "Who should review this?", "What's missing?"];

function SectionLabel({ children }: { children: string }) {
  return <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">{children}</p>;
}

function ImpactsBlock({ impacts }: { impacts: KnowledgeValidation["impacts"] }) {
  if (impacts.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/25 bg-warning/5 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-warning">
        <AlertTriangle size={12} />
        Potential Impacts
      </p>
      <div className="mt-2">
        <EvidenceList evidence={impacts} />
      </div>
    </div>
  );
}

function CheckItem({ check }: { check: ValidationCheck }) {
  const Icon = check.severity === "warning" ? AlertTriangle : Info;
  const toneClass = check.severity === "warning" ? "border-warning/25 bg-warning/5 text-warning" : "border-border-subtle bg-surface-secondary text-text-secondary";

  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px] ${toneClass}`}>
      <Icon
        size={14}
        className="mt-0.5 shrink-0"
      />
      <span>{check.detail}</span>
    </div>
  );
}

function ReviewerChips({ reviewers }: { reviewers: KnowledgeValidation["suggestedReviewers"] }) {
  if (reviewers.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {reviewers.map((reviewer) => (
        <span
          key={reviewer.id}
          title={reviewer.reason}
          className="rounded-full bg-surface-tertiary px-2.5 py-1 text-[12px] font-medium text-text-secondary"
        >
          {reviewer.name}
        </span>
      ))}
    </div>
  );
}

function TimelineBlock({ timeline, projectId }: { timeline: KnowledgeValidation["timeline"]; projectId: string }) {
  if (timeline.length === 0) {
    return <p className="text-[13px] text-text-tertiary">No recorded changes yet.</p>;
  }

  return (
    <div className="space-y-1.5">
      {timeline.map((entry) => (
        <TimelineEntryCard
          key={entry.id}
          entry={entry}
          projectId={projectId}
        />
      ))}
    </div>
  );
}

export function KnowledgeValidationPanel({
  object: initialObject,
  projectId,
  initialValidation,
  onValidationStateChange,
}: {
  object: KnowledgeObject;
  projectId: string;
  initialValidation: KnowledgeValidation;
  /** Lets the parent (`KnowledgeObjectDetail`'s header badge) stay in sync — this panel owns the actual mutation, the parent only mirrors it for display. */
  onValidationStateChange?: (validationState: ValidationState) => void;
}) {
  const router = useRouter();
  const [validationState, setValidationState] = useState<ValidationState>(initialObject.validationState);
  const [validation, setValidation] = useState<KnowledgeValidation>(initialValidation);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const delta = useDeltaPanel({ knowledgeObjectId: initialObject.id, projectId });

  const refresh = async () => {
    const result = await getKnowledgeValidation(initialObject.id);
    if (!result) return;
    setValidationState(result.object.validationState);
    setValidation(result.validation);
    onValidationStateChange?.(result.object.validationState);
    router.refresh();
  };

  const runAction = async (action: (id: string, actorId: string, reason?: string) => Promise<unknown>) => {
    setIsSubmitting(true);
    try {
      await action(initialObject.id, CURRENT_ACTOR, reason.trim() || undefined);
      setReason("");
      await refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t border-border-subtle px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          <DeltaMark size={13} />
          Knowledge Validation
        </h2>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${validationStateBadgeClass[validationState]}`}>
            {validationStateLabels[validationState]}
          </span>
          <ConfidenceBadge confidence={validation.confidence} />
        </div>
      </div>

      <p className="mt-3 text-[14px] leading-6 text-text-secondary">{validation.summary || "No summary available."}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <SectionLabel>Evidence</SectionLabel>
            {validation.evidence.length > 0 ? <EvidenceList evidence={validation.evidence} /> : <p className="mt-1.5 text-[13px] text-text-tertiary">No evidence yet.</p>}
          </div>

          <div>
            <SectionLabel>Related Knowledge</SectionLabel>
            {validation.relatedKnowledge.length > 0 ? (
              <EvidenceList evidence={validation.relatedKnowledge} />
            ) : (
              <p className="mt-1.5 text-[13px] text-text-tertiary">Nothing related yet.</p>
            )}
          </div>

          <ImpactsBlock impacts={validation.impacts} />
        </div>

        <div className="space-y-4">
          <div>
            <SectionLabel>Timeline</SectionLabel>
            <div className="mt-1.5">
              <TimelineBlock
                timeline={validation.timeline}
                projectId={projectId}
              />
            </div>
          </div>

          <div>
            <SectionLabel>Suggested Reviewers</SectionLabel>
            <div className="mt-1.5">
              {validation.suggestedReviewers.length > 0 ? (
                <ReviewerChips reviewers={validation.suggestedReviewers} />
              ) : (
                <p className="text-[13px] text-text-tertiary">No reviewers could be suggested.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ReasoningSection reasoning={validation.reasoning} />
      </div>

      {validation.checks.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
            <ShieldCheck size={12} />
            Validation Checks
          </p>
          {validation.checks.map((check) => (
            <CheckItem
              key={check.id}
              check={check}
            />
          ))}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-border-subtle bg-surface-secondary p-3.5">
        <FieldLabel>Decision</FieldLabel>

        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Add a note (optional)"
          className="mt-2 w-full rounded-md border border-border-subtle bg-surface-primary px-3 py-1.5 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => runAction(requestKnowledgeObjectApproval)}
            className="rounded-md border border-border-subtle px-3 py-1.5 text-[12px] font-semibold text-text-primary transition hover:bg-surface-tertiary disabled:opacity-50"
          >
            Request Approval
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => runAction(approveKnowledgeObject)}
            className="rounded-md bg-accent-primary px-3 py-1.5 text-[12px] font-semibold text-surface-primary transition hover:bg-accent-hover disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => runAction(rejectKnowledgeObject)}
            className="rounded-md border border-error/30 px-3 py-1.5 text-[12px] font-semibold text-error transition hover:bg-error/10 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => runAction(flagKnowledgeObjectForDiscussion)}
            className="rounded-md border border-info/30 px-3 py-1.5 text-[12px] font-semibold text-info transition hover:bg-info/10 disabled:opacity-50"
          >
            Needs Discussion
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => runAction(revokeKnowledgeObjectApproval)}
            className="rounded-md px-3 py-1.5 text-[12px] font-semibold text-text-secondary transition hover:bg-surface-tertiary disabled:opacity-50"
          >
            Revoke Approval
          </button>
        </div>

        <p className="mt-2 text-[11px] text-text-tertiary">Approval decisions are always made by a person — Delta only assembles the information above.</p>
      </div>

      <div className="relative mt-5">
        <FieldLabel>Ask Delta</FieldLabel>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {PRESET_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => delta.ask(question)}
              className="rounded-full border border-border-subtle px-2.5 py-1 text-[12px] text-text-secondary transition hover:bg-surface-tertiary"
            >
              {question}
            </button>
          ))}
        </div>

        <DeltaResponsePanel
          state={delta.state}
          onClose={delta.close}
          variant="inline"
        />
      </div>

      <p className="mt-4 text-[11px] text-text-tertiary">Last updated {formatDateTime(initialObject.updatedAt)}.</p>
    </div>
  );
}
