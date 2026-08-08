"use client";

import type { Discussion } from "@/types/discussion";

export function RequirementDiscussionPrompt({
  isOpen,
  matchedDiscussion,
  onAddToExisting,
  onCreateNew,
  onCancel,
  isSubmitting = false,
  typeLabel = "requirement",
}: {
  isOpen: boolean;
  matchedDiscussion: Discussion | null;
  onAddToExisting: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** Sprint 4.4: this dialog is shared by every Knowledge Object type's discussion-resolution step, not just Requirements. */
  typeLabel?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-md rounded-xl border border-border-strong bg-surface-raised p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em] text-text-primary">
          {matchedDiscussion ? "Related discussion found" : `New project ${typeLabel}`}
        </h2>

        <p className="mt-2 text-[13px] leading-5 text-text-secondary">
          {matchedDiscussion ? (
            <>
              This appears related to the existing &lsquo;{matchedDiscussion.title}&rsquo; discussion. Adding it there keeps
              {" "}
              the conversation in one place — or create a new discussion if this {typeLabel} is actually a separate topic.
            </>
          ) : (
            <>This looks like a new project {typeLabel} with no related discussion yet — creating a new one will hold it.</>
          )}
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

          {matchedDiscussion && (
            <button
              type="button"
              onClick={onAddToExisting}
              disabled={isSubmitting}
              className="rounded-md border border-border-subtle px-4 py-2 text-[13px] font-semibold text-text-primary transition hover:bg-surface-tertiary disabled:opacity-50"
            >
              Add to &lsquo;{matchedDiscussion.title}&rsquo;
            </button>
          )}

          <button
            type="button"
            onClick={onCreateNew}
            disabled={isSubmitting}
            className="rounded-md bg-accent-primary px-4 py-2 text-[13px] font-semibold text-surface-primary transition hover:bg-accent-hover disabled:opacity-50"
          >
            Create New Discussion
          </button>
        </div>
      </div>
    </div>
  );
}
