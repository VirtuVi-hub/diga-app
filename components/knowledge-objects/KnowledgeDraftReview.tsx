"use client";

import { ConfidenceBadge, EvidenceList, FieldLabel, ReasoningSection } from "@/components/delta/EvidenceDisplay";
import { knowledgeObjectTypeConfig } from "@/lib/knowledge-object-types";
import type { KnowledgeDraft } from "@/types/knowledge-draft";
import type { KnowledgeObjectType } from "@/types/knowledge-object";

/**
 * The Knowledge Draft review screen (Sprint 4.4) — Approve / Edit / Cancel.
 * Nothing enters the Knowledge Graph until this screen's action is taken;
 * Edit opens the existing `KnowledgeObjectModal` pre-filled with the draft
 * instead of building a second editing surface.
 *
 * Sprint 4.9: the button no longer says "Approve" — this step approves
 * *creating* the draft, not the resulting object itself, and reusing the
 * word "Approve" here was a genuine, confirmed source of confusion with the
 * separate, later Validation step (`KnowledgeValidationPanel`). Reuses the
 * exact verbs `intelligence-engine.ts`'s `ROUTING_LABELS` already
 * established for the same types, for consistency.
 */
const CREATE_ACTION_LABEL: Record<KnowledgeObjectType, string> = {
  requirement: "Create Requirement",
  decision: "Log Decision",
  action: "Create Action",
  issue: "Raise Issue",
  risk: "Raise Risk",
  constraint: "Create Constraint",
  preference: "Create Preference",
};

export function KnowledgeDraftReview({
  isOpen,
  draft,
  onApprove,
  onEdit,
  onCancel,
  isSubmitting = false,
}: {
  isOpen: boolean;
  draft: KnowledgeDraft | null;
  onApprove: () => void;
  onEdit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  if (!isOpen || !draft) return null;

  const typeLabel = knowledgeObjectTypeConfig[draft.type].label;

  // Sprint 4.9 (§3D): `SuggestedRelationship` is `Evidence` reshaped (Sprint
  // 4.4's own doc), so the two lists were near-always identical — showing
  // both was pure duplication. Only genuinely new suggestions (no matching
  // evidence title) are shown; the section disappears entirely when there's
  // nothing left to add.
  const evidenceTitles = new Set(draft.evidence.map((item) => item.title));
  const novelSuggestedRelationships = draft.suggestedRelationships.filter((relationship) => !evidenceTitles.has(relationship.label));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-strong bg-surface-raised p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-accent-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-primary">
            {typeLabel} Draft
          </span>
          <ConfidenceBadge confidence={draft.confidence} />
        </div>

        <h2 className="mt-4 font-display text-[19px] font-semibold tracking-[-0.02em] text-text-primary">{draft.title}</h2>
        <p className="mt-1.5 text-[13px] leading-5 text-text-secondary">{draft.description}</p>

        <div className="mt-4 space-y-4">
          <ReasoningSection reasoning={draft.reasoning} />

          {draft.evidence.length > 0 && (
            <div>
              <FieldLabel>Evidence</FieldLabel>
              <EvidenceList evidence={draft.evidence} />
            </div>
          )}

          {novelSuggestedRelationships.length > 0 && (
            <div>
              <FieldLabel>Suggested Relationships</FieldLabel>
              <ul className="mt-1.5 space-y-1">
                {novelSuggestedRelationships.map((relationship, index) => (
                  <li
                    key={`${relationship.typeLabel}-${relationship.label}-${index}`}
                    className="text-[13px] text-text-secondary"
                  >
                    <span className="font-semibold text-text-primary">{relationship.typeLabel}:</span> {relationship.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {draft.suggestedParticipants.length > 0 && (
            <div>
              <FieldLabel>Suggested Participants</FieldLabel>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {draft.suggestedParticipants.map((participant) => (
                  <span
                    key={participant}
                    className="rounded-full bg-surface-tertiary px-2 py-0.5 text-[12px] text-text-secondary"
                  >
                    {participant}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="mt-5 text-[12px] leading-5 text-text-tertiary">
          We&apos;ll check for a duplicate and a matching discussion first — nothing is created until that&apos;s resolved.
        </p>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-md px-4 py-2 text-[13px] font-medium text-text-secondary transition hover:bg-surface-tertiary disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onEdit}
            disabled={isSubmitting}
            className="rounded-md border border-border-subtle px-4 py-2 text-[13px] font-semibold text-text-primary transition hover:bg-surface-tertiary disabled:opacity-50"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={onApprove}
            disabled={isSubmitting}
            className="rounded-md bg-accent-primary px-4 py-2 text-[13px] font-semibold text-surface-primary transition hover:bg-accent-hover disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : CREATE_ACTION_LABEL[draft.type]}
          </button>
        </div>
      </div>
    </div>
  );
}
