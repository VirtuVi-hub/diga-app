"use client";

import type { Discussion } from "@/types/discussion";

/**
 * Duplicate-discussion confirmation for the Journal's input router (Sprint
 * 4.3.1). Structurally similar to `RequirementDiscussionPrompt` but not the
 * same component — that one's behavior must stay exactly as-is for the
 * Requirement-creation flow. "Continue existing discussion" is the default,
 * autofocused action per the brief.
 */
export function SimilarDiscussionPrompt({
  isOpen,
  matchedDiscussion,
  onContinueExisting,
  onCreateNew,
  onCancel,
  isSubmitting = false,
}: {
  isOpen: boolean;
  matchedDiscussion: Discussion | null;
  onContinueExisting: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  if (!isOpen || !matchedDiscussion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-md rounded-xl border border-border-strong bg-surface-raised p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em] text-text-primary">Similar discussion found</h2>

        <p className="mt-2 text-[13px] leading-5 text-text-secondary">
          This message looks related to the existing &lsquo;{matchedDiscussion.title}&rsquo; discussion. Continuing adds it to
          that conversation; creating new starts a separate one if this is actually something different.
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
            Create new discussion
          </button>

          <button
            type="button"
            autoFocus
            onClick={onContinueExisting}
            disabled={isSubmitting}
            className="rounded-md bg-accent-primary px-4 py-2 text-[13px] font-semibold text-surface-primary transition hover:bg-accent-hover disabled:opacity-50"
          >
            Continue existing discussion
          </button>
        </div>
      </div>
    </div>
  );
}
