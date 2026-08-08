"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  knowledgeObjectPriorityLabels,
  knowledgeObjectPriorityOrder,
  knowledgeObjectStatusLabels,
  knowledgeObjectStatusOrder,
  knowledgeObjectTypeConfig,
} from "@/lib/knowledge-object-types";
import { REQUIREMENT_ROLE_OPTIONS } from "@/lib/requirement-roles";
import type { KnowledgeObjectPriority, KnowledgeObjectStatus, KnowledgeObjectType } from "@/types/knowledge-object";

export type KnowledgeObjectFormValues = {
  title: string;
  description: string;
  priority: KnowledgeObjectPriority;
  status: KnowledgeObjectStatus;
  relatedTopics: string[];
  raisedTo?: string;
  approvalRequiredFrom?: string[];
  notify?: string[];
};

const DEFAULT_VALUES: KnowledgeObjectFormValues = {
  title: "",
  description: "",
  priority: "medium",
  status: "draft",
  relatedTopics: [],
  raisedTo: REQUIREMENT_ROLE_OPTIONS[0],
  approvalRequiredFrom: [],
  notify: [],
};

export function KnowledgeObjectModal({
  mode,
  type,
  isOpen,
  onClose,
  initialValues,
  onSubmit,
}: {
  mode: "create" | "revise";
  type: KnowledgeObjectType;
  isOpen: boolean;
  onClose: () => void;
  initialValues?: KnowledgeObjectFormValues;
  onSubmit: (values: KnowledgeObjectFormValues) => Promise<void>;
}) {
  const values = initialValues ?? DEFAULT_VALUES;
  const isRequirement = type === "requirement";

  const [title, setTitle] = useState(values.title);
  const [description, setDescription] = useState(values.description);
  const [priority, setPriority] = useState<KnowledgeObjectPriority>(values.priority);
  const [status, setStatus] = useState<KnowledgeObjectStatus>(values.status);
  const [relatedTopics, setRelatedTopics] = useState(values.relatedTopics.join(", "));
  const [raisedTo, setRaisedTo] = useState(values.raisedTo ?? REQUIREMENT_ROLE_OPTIONS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const label = knowledgeObjectTypeConfig[type].label;
  const heading = mode === "create" ? `Add ${label}` : `Revise ${label}`;

  const submit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await onSubmit(
        isRequirement
          ? {
              title: title.trim(),
              description: description.trim(),
              priority,
              status: "open",
              relatedTopics: [],
              raisedTo,
            }
          : {
              title: title.trim(),
              description: description.trim(),
              priority,
              status,
              relatedTopics: relatedTopics
                .split(",")
                .map((topic) => topic.trim())
                .filter(Boolean),
            },
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-lg rounded-xl border border-border-strong bg-surface-raised p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em] text-text-primary">{heading}</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-7 place-items-center rounded-md text-text-tertiary transition hover:bg-surface-tertiary hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-md border border-border-subtle bg-surface-primary px-3 py-2 text-[14px] text-text-primary outline-none focus:border-accent-primary"
              placeholder={`${label} title`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-border-subtle bg-surface-primary px-3 py-2 text-[14px] text-text-primary outline-none focus:border-accent-primary"
              placeholder="Describe this in a sentence or two"
            />
          </div>

          {isRequirement ? (
            <>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Priority</label>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as KnowledgeObjectPriority)}
                  className="w-full rounded-md border border-border-subtle bg-surface-primary px-3 py-2 text-[14px] text-text-primary outline-none focus:border-accent-primary"
                >
                  {knowledgeObjectPriorityOrder.map((option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {knowledgeObjectPriorityLabels[option]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Raised To</label>
                <select
                  value={raisedTo}
                  onChange={(event) => setRaisedTo(event.target.value)}
                  className="w-full rounded-md border border-border-subtle bg-surface-primary px-3 py-2 text-[14px] text-text-primary outline-none focus:border-accent-primary"
                >
                  {REQUIREMENT_ROLE_OPTIONS.map((role) => (
                    <option
                      key={role}
                      value={role}
                    >
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <p className="rounded-md border border-border-subtle bg-surface-primary px-3 py-2.5 text-[12px] text-text-tertiary">
                Delta determines required approvers and mandatory notifications automatically based on impact analysis and project governance rules.
              </p>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Priority</label>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as KnowledgeObjectPriority)}
                    className="w-full rounded-md border border-border-subtle bg-surface-primary px-3 py-2 text-[14px] text-text-primary outline-none focus:border-accent-primary"
                  >
                    {knowledgeObjectPriorityOrder.map((option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {knowledgeObjectPriorityLabels[option]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Status</label>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as KnowledgeObjectStatus)}
                    className="w-full rounded-md border border-border-subtle bg-surface-primary px-3 py-2 text-[14px] text-text-primary outline-none focus:border-accent-primary"
                  >
                    {knowledgeObjectStatusOrder.map((option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {knowledgeObjectStatusLabels[option]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Related Topics</label>
                <input
                  value={relatedTopics}
                  onChange={(event) => setRelatedTopics(event.target.value)}
                  className="w-full rounded-md border border-border-subtle bg-surface-primary px-3 py-2 text-[14px] text-text-primary outline-none focus:border-accent-primary"
                  placeholder="Comma-separated, e.g. accessibility, entrance"
                />
              </div>
            </>
          )}

          {error && <p className="text-[13px] text-error">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-[13px] font-medium text-text-secondary transition hover:bg-surface-tertiary"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={isSaving}
            className="rounded-md bg-accent-primary px-4 py-2 text-[13px] font-semibold text-surface-primary transition hover:bg-accent-hover disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
