"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EvolutionDetailPanel } from "@/components/delta/EvolutionDetailPanel";
import { PossibleDuplicateKnowledgePrompt } from "@/components/delta/PossibleDuplicateKnowledgePrompt";
import { ProjectEvolutionStrip } from "@/components/delta/ProjectEvolutionStrip";
import { ProjectUpdatesPanel } from "@/components/delta/ProjectUpdatesPanel";
import { QuickActions } from "@/components/delta/QuickActions";
import { SimilarDiscussionPrompt } from "@/components/delta/SimilarDiscussionPrompt";
import { Workspace } from "@/components/delta/Workspace";
import { KnowledgeObjectModal, type KnowledgeObjectFormValues } from "@/components/knowledge-objects/KnowledgeObjectModal";
import { KnowledgeDraftReview } from "@/components/knowledge-objects/KnowledgeDraftReview";
import { RequirementDiscussionPrompt } from "@/components/requirements/RequirementDiscussionPrompt";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { createDiscussion, matchDiscussionForMessage, matchDiscussionForRequirement, replyToDiscussion as replyToDiscussionAction } from "@/lib/actions/discussion-actions";
import { publishEvent } from "@/lib/actions/event-actions";
import { matchKnowledgeObject, reviseKnowledgeObject } from "@/lib/actions/knowledge-object-actions";
import { raiseGovernedKnowledgeObject } from "@/lib/actions/governance-actions";
import type { DiscussionTypeCode } from "@/lib/discussion-types";
import { EVENT_TYPES } from "@/lib/events/event-types";
import { knowledgeCaptureEngine } from "@/lib/knowledge-capture/knowledge-capture-engine";
import { knowledgeObjectTypeConfig } from "@/lib/knowledge-object-types";
import type { ExtractedEntity } from "@/types/comprehension";
import type { Discussion } from "@/types/discussion";
import type { TimelineEntry } from "@/lib/events/timeline-projection";
import type { KnowledgeDraft } from "@/types/knowledge-draft";
import type { KnowledgeObject, KnowledgeObjectType } from "@/types/knowledge-object";
import type { Relationship } from "@/types/relationship";
import { AttentionPanelContent } from "./AttentionPanelContent";

/** No dedicated Discussion type code exists yet for Issue/Risk — falls back to the generic Query code rather than inventing one. */
const KNOWLEDGE_TYPE_TO_DISCUSSION_TYPE: Record<KnowledgeObjectType, DiscussionTypeCode> = {
  requirement: "REQ",
  decision: "DEC",
  action: "ACT",
  issue: "QRY",
  risk: "QRY",
  constraint: "REQ",
  preference: "REQ",
};

type JournalDraftStage = "review" | "editing" | "duplicate-knowledge" | "resolve-discussion";

type JournalDraftState = {
  draft: KnowledgeDraft;
  stage: JournalDraftStage;
  duplicateMatch?: KnowledgeObject;
  discussionMatch?: Discussion | null;
};

export function HomeWorkspace({
  projectId,
  initialDiscussions,
  relationships,
  recentUpdates,
}: {
  projectId: string;
  initialDiscussions: Discussion[];
  relationships: Relationship[];
  recentUpdates: TimelineEntry[];
}) {
  const router = useRouter();
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>(initialDiscussions);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [pendingRequirement, setPendingRequirement] = useState<{
    values: KnowledgeObjectFormValues;
    match: Discussion | null;
  } | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [pendingJournalMessage, setPendingJournalMessage] = useState<{ text: string; match: Discussion } | null>(null);
  const [isResolvingJournalMessage, setIsResolvingJournalMessage] = useState(false);
  const [journalDraft, setJournalDraft] = useState<JournalDraftState | null>(null);
  const [isResolvingJournalDraft, setIsResolvingJournalDraft] = useState(false);

  const selectMilestone = (id: string) =>
    setSelectedMilestone((current) => (current === id ? null : id));

  const addDiscussion = (discussion: Discussion) => setDiscussions((current) => [discussion, ...current]);

  /**
   * Post-launch fix: this used to fabricate a Discussion entirely in local
   * React state — hardcoded "Maya Chen" author, never calling the real
   * `createDiscussion` action. Confirmed live that it vanished on reload
   * even for the person who typed it, and never reached the other party —
   * the root cause of the reported "Main Client starts a discussion, Lead
   * Architect never sees it" bug. Now creates it for real, attributed to
   * whoever is actually signed in (resolved server-side by the action).
   */
  const createDiscussionFromMessage = async (message: string) => {
    const newDiscussion = await createDiscussion({
      title: message.length > 60 ? `${message.slice(0, 57)}...` : message,
      type: "QRY",
      summary: [message],
      projectId,
    });
    addDiscussion(newDiscussion);
  };

  /** Post-launch fix: was local-only state (see `createDiscussionFromMessage`) — same root cause, same fix. */
  const replyToDiscussion = async (id: string, text: string) => {
    const updated = await replyToDiscussionAction(id, text);
    setDiscussions((current) => [updated, ...current.filter((item) => item.id !== id)]);
  };

  /**
   * Only reached when the Journal input's own router (`DiscussionPrompt`)
   * has already decided this message is Discussion-bound — Delta Queries
   * and every other destination never call this. Duplicate-checks against
   * existing discussions (Sprint 4.3.1) before creating a new card.
   */
  const addDiscussionFromPrompt = async (message: string, entities: string[]) => {
    const match = await matchDiscussionForMessage({ text: message, entities });
    if (match) {
      setPendingJournalMessage({ text: message, match });
    } else {
      await createDiscussionFromMessage(message);
    }
  };

  const continueExistingJournalMessage = async () => {
    if (!pendingJournalMessage) return;
    setIsResolvingJournalMessage(true);
    try {
      await replyToDiscussion(pendingJournalMessage.match.id, pendingJournalMessage.text);
      setPendingJournalMessage(null);
    } finally {
      setIsResolvingJournalMessage(false);
    }
  };

  const createNewFromJournalMessage = async () => {
    if (!pendingJournalMessage) return;
    await createDiscussionFromMessage(pendingJournalMessage.text);
    setPendingJournalMessage(null);
  };

  const handleAddRequirement = async (values: KnowledgeObjectFormValues) => {
    setIsRequirementModalOpen(false);
    const match = await matchDiscussionForRequirement({ title: values.title, description: values.description });
    setPendingRequirement({ values, match });
  };

  const createRequirementIn = async (discussion: Discussion) => {
    if (!pendingRequirement) return;
    await raiseGovernedKnowledgeObject({
      projectId,
      discussionId: discussion.id,
      type: "requirement",
      createdBy: "Maya Chen",
      ...pendingRequirement.values,
    });
    setPendingRequirement(null);
  };

  const addRequirementToExisting = async () => {
    if (!pendingRequirement?.match) return;
    setIsResolving(true);
    try {
      const discussion = pendingRequirement.match;
      await createRequirementIn(discussion);
      // Never leave the user with no feedback (a confirmed Sprint 4.9 bug):
      // nothing on the Journal itself renders Knowledge Objects, so land on
      // the discussion that now holds the new requirement.
      router.push(`/projects/${projectId}/discussions/${discussion.id}`);
    } finally {
      setIsResolving(false);
    }
  };

  const createNewDiscussionForRequirement = async () => {
    if (!pendingRequirement) return;
    setIsResolving(true);
    try {
      const newDiscussion = await createDiscussion({
        title: pendingRequirement.values.title,
        type: "REQ",
        summary: pendingRequirement.values.description ? [pendingRequirement.values.description] : [],
        projectId,
      });
      addDiscussion(newDiscussion);
      await createRequirementIn(newDiscussion);
    } finally {
      setIsResolving(false);
    }
  };

  /**
   * The Knowledge Capture Engine (Sprint 4.4) — only reached for
   * Requirement/Decision/Issue/Action destinations. Generates a draft;
   * nothing is created until the review screen's Approve is pressed. This
   * state machine is deliberately separate from the QuickActions
   * Requirement flow above (`pendingRequirement`, untouched) — both share
   * the same underlying components/actions, but keeping the state separate
   * means this new flow can't regress the existing one.
   */
  const onDraftRequested = async (message: string, entities: ExtractedEntity[], type: KnowledgeObjectType) => {
    const draft = await knowledgeCaptureEngine.draft({
      type,
      text: message,
      entities,
      context: { page: "journal", projectId },
    });
    setJournalDraft({ draft, stage: "review" });
  };

  const cancelJournalDraft = () => setJournalDraft(null);

  const editJournalDraft = () => setJournalDraft((current) => (current ? { ...current, stage: "editing" } : current));

  const resolveDiscussionForDraft = async (draft: KnowledgeDraft) => {
    const discussionMatch = await matchDiscussionForMessage({
      text: `${draft.title} ${draft.description}`,
      entities: draft.entities.map((entity) => entity.value),
    });
    setJournalDraft({ draft, stage: "resolve-discussion", discussionMatch });
  };

  const approveJournalDraft = async (draft: KnowledgeDraft) => {
    setIsResolvingJournalDraft(true);
    try {
      // The human-approval fact itself (Sprint 4.5), independent of whether
      // it resolves to a create or a revise below. Never allowed to block
      // the actual approval flow — the Event Engine is additive only.
      try {
        await publishEvent({
          eventType: EVENT_TYPES.KNOWLEDGE_DRAFT_APPROVED,
          actor: { type: "person", id: "Maya Chen" },
          projectId,
          metadata: { knowledgeObjectType: draft.type, title: draft.title },
          confidence: draft.confidence,
        });
      } catch (error) {
        console.error("Event publish failed:", error);
      }

      const duplicateMatch = await matchKnowledgeObject({
        text: `${draft.title} ${draft.description}`,
        entities: draft.entities.map((entity) => entity.value),
      });
      if (duplicateMatch) {
        setJournalDraft({ draft, stage: "duplicate-knowledge", duplicateMatch });
      } else {
        await resolveDiscussionForDraft(draft);
      }
    } finally {
      setIsResolvingJournalDraft(false);
    }
  };

  const submitEditedJournalDraft = async (values: KnowledgeObjectFormValues) => {
    if (!journalDraft) return;
    await approveJournalDraft({
      ...journalDraft.draft,
      title: values.title,
      description: values.description,
      priority: values.priority,
    });
  };

  const continueExistingKnowledge = async () => {
    if (!journalDraft?.duplicateMatch) return;
    setIsResolvingJournalDraft(true);
    try {
      const duplicateMatch = journalDraft.duplicateMatch;
      await reviseKnowledgeObject(duplicateMatch.id, {
        title: journalDraft.draft.title,
        description: journalDraft.draft.description,
        priority: journalDraft.draft.priority,
        status: duplicateMatch.status,
        relatedTopics: duplicateMatch.relatedTopics,
        createdBy: "Maya Chen",
      });
      setJournalDraft(null);
      // Never silently fail (a confirmed Sprint 4.9 bug): "Continue Existing"
      // must immediately continue into the existing Knowledge Object.
      router.push(`/projects/${projectId}/knowledge/${duplicateMatch.id}`);
    } finally {
      setIsResolvingJournalDraft(false);
    }
  };

  const createNewKnowledgeInstead = async () => {
    if (!journalDraft) return;
    setIsResolvingJournalDraft(true);
    try {
      await resolveDiscussionForDraft(journalDraft.draft);
    } finally {
      setIsResolvingJournalDraft(false);
    }
  };

  const addKnowledgeToExistingDiscussion = async () => {
    if (!journalDraft?.discussionMatch) return;
    setIsResolvingJournalDraft(true);
    try {
      const discussionMatch = journalDraft.discussionMatch;
      await raiseGovernedKnowledgeObject({
        projectId,
        discussionId: discussionMatch.id,
        type: journalDraft.draft.type,
        title: journalDraft.draft.title,
        description: journalDraft.draft.description,
        priority: journalDraft.draft.priority,
        status: "open",
        relatedTopics: [],
        createdBy: "Maya Chen",
      });
      setJournalDraft(null);
      router.push(`/projects/${projectId}/discussions/${discussionMatch.id}`);
    } finally {
      setIsResolvingJournalDraft(false);
    }
  };

  const createNewDiscussionForKnowledge = async () => {
    if (!journalDraft) return;
    setIsResolvingJournalDraft(true);
    try {
      const newDiscussion = await createDiscussion({
        title: journalDraft.draft.title,
        type: KNOWLEDGE_TYPE_TO_DISCUSSION_TYPE[journalDraft.draft.type],
        summary: [journalDraft.draft.description],
        projectId,
      });
      addDiscussion(newDiscussion);
      await raiseGovernedKnowledgeObject({
        projectId,
        discussionId: newDiscussion.id,
        type: journalDraft.draft.type,
        title: journalDraft.draft.title,
        description: journalDraft.draft.description,
        priority: journalDraft.draft.priority,
        status: "open",
        relatedTopics: [],
        createdBy: "Maya Chen",
      });
      setJournalDraft(null);
    } finally {
      setIsResolvingJournalDraft(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <ProjectEvolutionStrip
        selectedId={selectedMilestone}
        onSelect={selectMilestone}
      />

      <WorkspaceLayout
        leftPrimaryContent={
          selectedMilestone ? (
            <EvolutionDetailPanel
              id={selectedMilestone}
              onClose={() => setSelectedMilestone(null)}
            />
          ) : (
            <Workspace
              projectId={projectId}
              items={discussions}
              relationships={relationships}
              onAddDiscussion={addDiscussionFromPrompt}
              onDraftRequested={onDraftRequested}
              onReply={replyToDiscussion}
            />
          )
        }
        attentionPanel={<AttentionPanelContent projectId={projectId} />}
        actionsPanel={<QuickActions onAddRequirement={() => setIsRequirementModalOpen(true)} />}
        updatesPanel={<ProjectUpdatesPanel entries={recentUpdates} />}
      />

      <KnowledgeObjectModal
        mode="create"
        type="requirement"
        isOpen={isRequirementModalOpen}
        onClose={() => setIsRequirementModalOpen(false)}
        onSubmit={handleAddRequirement}
      />

      <RequirementDiscussionPrompt
        isOpen={pendingRequirement !== null}
        matchedDiscussion={pendingRequirement?.match ?? null}
        onAddToExisting={addRequirementToExisting}
        onCreateNew={createNewDiscussionForRequirement}
        onCancel={() => setPendingRequirement(null)}
        isSubmitting={isResolving}
      />

      <SimilarDiscussionPrompt
        isOpen={pendingJournalMessage !== null}
        matchedDiscussion={pendingJournalMessage?.match ?? null}
        onContinueExisting={continueExistingJournalMessage}
        onCreateNew={createNewFromJournalMessage}
        onCancel={() => setPendingJournalMessage(null)}
        isSubmitting={isResolvingJournalMessage}
      />

      <KnowledgeDraftReview
        isOpen={journalDraft?.stage === "review"}
        draft={journalDraft?.draft ?? null}
        onApprove={() => journalDraft && approveJournalDraft(journalDraft.draft)}
        onEdit={editJournalDraft}
        onCancel={cancelJournalDraft}
        isSubmitting={isResolvingJournalDraft}
      />

      <KnowledgeObjectModal
        mode="create"
        type={journalDraft?.draft.type ?? "requirement"}
        isOpen={journalDraft?.stage === "editing"}
        onClose={() => setJournalDraft((current) => (current ? { ...current, stage: "review" } : current))}
        initialValues={
          journalDraft
            ? {
                title: journalDraft.draft.title,
                description: journalDraft.draft.description,
                priority: journalDraft.draft.priority,
                status: "open",
                relatedTopics: [],
              }
            : undefined
        }
        onSubmit={submitEditedJournalDraft}
      />

      <PossibleDuplicateKnowledgePrompt
        isOpen={journalDraft?.stage === "duplicate-knowledge"}
        matchedObject={journalDraft?.duplicateMatch ?? null}
        onContinueExisting={continueExistingKnowledge}
        onCreateNew={createNewKnowledgeInstead}
        onCancel={cancelJournalDraft}
        isSubmitting={isResolvingJournalDraft}
      />

      <RequirementDiscussionPrompt
        isOpen={journalDraft?.stage === "resolve-discussion"}
        matchedDiscussion={journalDraft?.discussionMatch ?? null}
        onAddToExisting={addKnowledgeToExistingDiscussion}
        onCreateNew={createNewDiscussionForKnowledge}
        onCancel={cancelJournalDraft}
        isSubmitting={isResolvingJournalDraft}
        typeLabel={journalDraft ? knowledgeObjectTypeConfig[journalDraft.draft.type].label.toLowerCase() : "requirement"}
      />
    </div>
  );
}
