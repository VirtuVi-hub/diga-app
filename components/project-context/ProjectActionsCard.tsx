"use client";

import { useState } from "react";
import { QuickActions } from "@/components/delta/QuickActions";
import { KnowledgeObjectModal } from "@/components/knowledge-objects/KnowledgeObjectModal";
import { RequirementDiscussionPrompt } from "@/components/requirements/RequirementDiscussionPrompt";
import { useRequirementRouting } from "@/components/requirements/useRequirementRouting";
import { QuadrantCard } from "./QuadrantCard";

export function ProjectActionsCard({ projectId, discussionId }: { projectId: string; discussionId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const requirementRouting = useRequirementRouting({ projectId, discussionId });

  const handleCreate = async (values: Parameters<typeof requirementRouting.createRequirement>[0]) => {
    setIsModalOpen(false);
    await requirementRouting.createRequirement(values);
  };

  return (
    <QuadrantCard label="Project Actions">
      <QuickActions onAddRequirement={() => setIsModalOpen(true)} />

      <KnowledgeObjectModal
        mode="create"
        type="requirement"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />

      <RequirementDiscussionPrompt
        isOpen={requirementRouting.pendingMatch !== null}
        matchedDiscussion={requirementRouting.pendingMatch?.discussion ?? null}
        onAddToExisting={requirementRouting.addToMatchedDiscussion}
        onCreateNew={requirementRouting.createNewDiscussionForMatch}
        onCancel={requirementRouting.cancel}
        isSubmitting={requirementRouting.isResolving}
      />
    </QuadrantCard>
  );
}
