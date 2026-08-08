"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { activateProjectAction, confirmDeltaReviewAction } from "@/lib/actions/project-setup-actions";
import { knowledgeObjectTypeConfig } from "@/lib/knowledge-object-types";
import type { DocumentListItem } from "@/lib/types/document";
import type { KnowledgeObject } from "@/types/knowledge-object";
import type { ProjectSetupGaps } from "@/lib/project-setup/setup-gaps";
import type { Discussion } from "@/types/discussion";

type Props = {
  projectId: string;
  understandingDraft: string;
  alreadyConfirmed: boolean;
  documents: DocumentListItem[];
  objects: KnowledgeObject[];
  gaps: ProjectSetupGaps;
  outstandingDiscussions: Discussion[];
};

const REVIEW_TYPES = ["requirement", "constraint", "preference", "risk"] as const;

export function DeltaProjectReviewPanel({ projectId, understandingDraft, alreadyConfirmed, documents, objects, gaps, outstandingDiscussions }: Props) {
  const router = useRouter();
  const [understanding, setUnderstanding] = useState(understandingDraft);
  const [confirmed, setConfirmed] = useState(alreadyConfirmed);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      try {
        await confirmDeltaReviewAction(projectId, understanding);
        setConfirmed(true);
        router.refresh();
      } catch (confirmError) {
        setError(confirmError instanceof Error ? confirmError.message : "Failed to confirm.");
      }
    });
  }

  function activate() {
    startTransition(async () => {
      try {
        await activateProjectAction(projectId);
        router.push(`/projects/${projectId}/dashboard`);
      } catch (activateError) {
        setError(activateError instanceof Error ? activateError.message : "Failed to activate the project.");
      }
    });
  }

  const missingInfoItems = [
    ...gaps.missingRoles.map((role) => `No one is assigned as ${role}.`),
    ...gaps.missingDocumentTypes.map((type) => `No ${type} document has been uploaded.`),
    ...(gaps.questionnaireIncomplete ? ["The Client Questionnaire has not been completed."] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Sprint 5.8, Module 8 (relaxed in 5.9.2): same guided-status language as Agreement/Setup — but confirming understanding is optional now, never a prerequisite for Activate Project (only Agreement approval + Lead Architect + Main Client are). */}
      <div className="rounded-xl bg-surface-tertiary px-4 py-3">
        <p className="text-sm font-medium text-text-primary">{!confirmed ? "Review Delta's understanding below, then confirm it — optional, and never required to activate." : "Understanding confirmed."}</p>
      </div>

      <section className="rounded-2xl border border-border-subtle bg-surface-secondary p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">Project Understanding</h2>
        <textarea
          value={understanding}
          onChange={(event) => setUnderstanding(event.target.value)}
          disabled={confirmed}
          rows={5}
          className="mt-3 w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none disabled:opacity-70"
        />
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface-secondary p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">Imported Documents</h2>
        {documents.length === 0 ? (
          <p className="mt-2 text-sm text-text-tertiary">No documents imported yet.</p>
        ) : (
          <ul className="mt-3 space-y-1">
            {documents.map((document) => (
              <li key={document.id} className="text-sm text-text-secondary">
                {document.document_type_name}: {document.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface-secondary p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">Requirements, Constraints, Preferences & Risks</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {REVIEW_TYPES.map((type) => {
            const count = objects.filter((object) => object.type === type).length;
            const pending = objects.filter((object) => object.type === type && object.validationState === "pending").length;
            return (
              <div key={type} className="rounded-xl border border-border-subtle bg-surface-primary p-4">
                <p className="text-2xl font-semibold text-text-primary">{count}</p>
                <p className="text-sm text-text-secondary">{knowledgeObjectTypeConfig[type].pluralLabel}</p>
                {pending > 0 && <p className="mt-1 text-xs text-warning">{pending} pending confirmation</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface-secondary p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">Missing Information</h2>
        {missingInfoItems.length === 0 ? (
          <p className="mt-2 text-sm text-success">Nothing outstanding.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {missingInfoItems.map((item) => (
              <li key={item} className="text-sm text-warning">
                {item}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface-secondary p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">Outstanding Discussions</h2>
        {outstandingDiscussions.length === 0 ? (
          <p className="mt-2 text-sm text-success">No open discussions.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {outstandingDiscussions.map((discussion) => (
              <li key={discussion.id} className="text-sm text-text-secondary">
                {discussion.title}
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={confirm} disabled={isPending || confirmed} className="rounded-full border border-accent-primary/40 bg-accent-primary/10 px-5 py-2.5 text-sm font-medium text-accent-primary disabled:opacity-50">
          {confirmed ? "Understanding Confirmed" : "Confirm Understanding"}
        </button>
        <button type="button" onClick={activate} disabled={isPending} className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          Activate Project
        </button>
      </div>
    </div>
  );
}
