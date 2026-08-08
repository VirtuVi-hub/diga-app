"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { KnowledgeObjectFormValues } from "@/components/knowledge-objects/KnowledgeObjectModal";
import { createDiscussion, matchDiscussionForRequirement } from "@/lib/actions/discussion-actions";
import { relinkKnowledgeObjectDiscussion } from "@/lib/actions/knowledge-object-actions";
import { raiseGovernedKnowledgeObject } from "@/lib/actions/governance-actions";
import type { Discussion } from "@/types/discussion";

type PendingMatch = { objectId: string; objectTitle: string; discussion: Discussion };

/**
 * Creates a requirement in the current discussion, then checks whether a
 * different existing discussion is a better fit and offers to move it there
 * (or spin up a new discussion) if so.
 */
export function useRequirementRouting({ projectId, discussionId }: { projectId: string; discussionId: string }) {
  const router = useRouter();
  const [pendingMatch, setPendingMatch] = useState<PendingMatch | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const createRequirement = async (values: KnowledgeObjectFormValues) => {
    const created = await raiseGovernedKnowledgeObject({
      projectId,
      discussionId,
      type: "requirement",
      createdBy: "Maya Chen",
      ...values,
    });

    const match = await matchDiscussionForRequirement({ title: created.title, description: created.description });
    if (match && match.id !== discussionId) {
      setPendingMatch({ objectId: created.id, objectTitle: created.title, discussion: match });
      return;
    }

    router.refresh();
  };

  const addToMatchedDiscussion = async () => {
    if (!pendingMatch) return;
    setIsResolving(true);
    try {
      await relinkKnowledgeObjectDiscussion(pendingMatch.objectId, pendingMatch.discussion.id);
      setPendingMatch(null);
      router.refresh();
    } finally {
      setIsResolving(false);
    }
  };

  const createNewDiscussionForMatch = async () => {
    if (!pendingMatch) return;
    setIsResolving(true);
    try {
      const newDiscussion = await createDiscussion({
        title: pendingMatch.objectTitle,
        type: "REQ",
        summary: [],
      });
      await relinkKnowledgeObjectDiscussion(pendingMatch.objectId, newDiscussion.id);
      setPendingMatch(null);
      router.refresh();
    } finally {
      setIsResolving(false);
    }
  };

  const cancel = () => setPendingMatch(null);

  return { createRequirement, pendingMatch, isResolving, addToMatchedDiscussion, createNewDiscussionForMatch, cancel };
}
