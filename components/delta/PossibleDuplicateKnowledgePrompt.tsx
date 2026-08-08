"use client";

import { knowledgeObjectTypeConfig } from "@/lib/knowledge-object-types";
import type { KnowledgeObject } from "@/types/knowledge-object";

/**
 * Duplicate-knowledge confirmation for the Knowledge Capture Engine (Sprint
 * 4.4) — searches the entire Knowledge Graph (every Knowledge Object type),
 * not just Requirements. Structurally identical to `SimilarDiscussionPrompt`
 * (Sprint 4.3.1); "Continue existing" is the default, autofocused action.
 */
export function PossibleDuplicateKnowledgePrompt({
  isOpen,
  matchedObject,
  onContinueExisting,
  onCreateNew,
  onCancel,
  isSubmitting = false,
}: {
  isOpen: boolean;
  matchedObject: KnowledgeObject | null;
  onContinueExisting: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  if (!isOpen || !matchedObject) return null;

  const typeLabel = knowledgeObjectTypeConfig[matchedObject.type].label;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-md rounded-xl border border-border-strong bg-surface-raised p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em] text-text-primary">Possible existing knowledge found</h2>

        <p className="mt-2 text-[13px] leading-5 text-text-secondary">
          This looks similar to an existing {typeLabel.toLowerCase()}: <span className="font-semibold text-text-primary">&lsquo;{matchedObject.title}&rsquo;</span>.
          Continuing revises that {typeLabel.toLowerCase()} with these details instead of creating a duplicate.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
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
            onClick={onCreateNew}
            disabled={isSubmitting}
            className="rounded-md border border-border-subtle px-4 py-2 text-[13px] font-semibold text-text-primary transition hover:bg-surface-tertiary disabled:opacity-50"
          >
            Create new
          </button>

          <button
            type="button"
            autoFocus
            onClick={onContinueExisting}
            disabled={isSubmitting}
            className="rounded-md bg-accent-primary px-4 py-2 text-[13px] font-semibold text-surface-primary transition hover:bg-accent-hover disabled:opacity-50"
          >
            Continue existing
          </button>
        </div>
      </div>
    </div>
  );
}
