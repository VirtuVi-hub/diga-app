"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { CompactExpandableRow } from "@/components/project-context/CompactExpandableRow";
import { RequirementDiscussionPrompt } from "@/components/requirements/RequirementDiscussionPrompt";
import { useRequirementRouting } from "@/components/requirements/useRequirementRouting";
import { raiseGovernedKnowledgeObject } from "@/lib/actions/governance-actions";
import { knowledgeObjectTypeConfig } from "@/lib/knowledge-object-types";
import type { KnowledgeObject, KnowledgeObjectType } from "@/types/knowledge-object";
import { KnowledgeObjectModal, type KnowledgeObjectFormValues } from "./KnowledgeObjectModal";

export function KnowledgeTypeGroup({
  type,
  objects,
  projectId,
  discussionId,
}: {
  type: KnowledgeObjectType;
  objects: KnowledgeObject[];
  projectId: string;
  discussionId: string;
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const requirementRouting = useRequirementRouting({ projectId, discussionId });

  const config = knowledgeObjectTypeConfig[type];

  const handleCreate = async (values: KnowledgeObjectFormValues) => {
    setIsModalOpen(false);

    if (type === "requirement") {
      await requirementRouting.createRequirement(values);
      return;
    }

    await raiseGovernedKnowledgeObject({
      projectId,
      discussionId,
      type,
      createdBy: "Maya Chen",
      ...values,
    });
    router.refresh();
  };

  return (
    <>
      <CompactExpandableRow
        icon={config.icon}
        label={config.pluralLabel}
        count={objects.length}
        emptyLabel={`No ${config.pluralLabel.toLowerCase()} yet.`}
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label={`Add ${config.label}`}
            className="grid size-6 shrink-0 place-items-center rounded-md text-text-tertiary transition hover:bg-surface-tertiary hover:text-accent-primary"
          >
            <Plus size={14} />
          </button>
        }
      >
        <ul className="space-y-1.5">
          {objects.map((object) => (
            <li key={object.id}>
              <Link
                href={`/projects/${projectId}/knowledge/${object.id}`}
                className="flex gap-2 truncate text-[13px] text-text-secondary transition hover:text-text-primary"
              >
                <span className="text-accent-primary">•</span>
                {object.title}
              </Link>
            </li>
          ))}
        </ul>
      </CompactExpandableRow>

      <KnowledgeObjectModal
        mode="create"
        type={type}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />

      {type === "requirement" && (
        <RequirementDiscussionPrompt
          isOpen={requirementRouting.pendingMatch !== null}
          matchedDiscussion={requirementRouting.pendingMatch?.discussion ?? null}
          onAddToExisting={requirementRouting.addToMatchedDiscussion}
          onCreateNew={requirementRouting.createNewDiscussionForMatch}
          onCancel={requirementRouting.cancel}
          isSubmitting={requirementRouting.isResolving}
        />
      )}
    </>
  );
}
