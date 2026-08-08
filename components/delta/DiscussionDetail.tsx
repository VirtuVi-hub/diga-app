"use client";

import { useState } from "react";
import { AttentionSection } from "@/components/project-context/AttentionSection";
import { DiscussionUpdatesCard } from "@/components/project-context/DiscussionUpdatesCard";
import { ProjectActionsCard } from "@/components/project-context/ProjectActionsCard";
import { ProjectContextPanel } from "@/components/project-context/ProjectContextPanel";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { replyToDiscussion } from "@/lib/actions/discussion-actions";
import { WORKSPACE_FEED_MAX_WIDTH_CLASS, WORKSPACE_FEED_PADDING_CLASS } from "@/lib/workspace-layout";
import type { Discussion } from "@/types/discussion";
import type { KnowledgeObject } from "@/types/knowledge-object";
import type { Relationship } from "@/types/relationship";
import { DeltaInsights } from "./DeltaInsights";
import { DiscussionHeader } from "./DiscussionHeader";
import { DiscussionMessages } from "./DiscussionMessages";

export function DiscussionDetail({
  discussion: initialDiscussion,
  projectId,
  knowledgeObjects,
  backHref,
  evidence,
  relatedKnowledge,
  impacts,
}: {
  discussion: Discussion;
  projectId: string;
  knowledgeObjects: KnowledgeObject[];
  backHref: string;
  evidence: Relationship[];
  relatedKnowledge: Relationship[];
  impacts: Relationship[];
}) {
  const [discussion, setDiscussion] = useState(initialDiscussion);

  /** Post-launch fix: was local-only React state, hardcoded "Maya Chen" as the author regardless of who replied — never persisted, invisible to the other party. Now a real, attributed reply. */
  const reply = async (text: string) => {
    const updated = await replyToDiscussion(discussion.id, text);
    setDiscussion(updated);
  };

  return (
    <WorkspaceLayout
      leftPrimaryContent={
        <div className="flex h-full min-h-0 flex-col">
          <DiscussionHeader
            discussion={discussion}
            backHref={backHref}
          />

          <div className={`min-h-0 flex-1 overflow-y-auto ${WORKSPACE_FEED_PADDING_CLASS}`}>
            <div className={`mx-auto w-full ${WORKSPACE_FEED_MAX_WIDTH_CLASS}`}>
              <DiscussionMessages
                messages={discussion.messages}
                onReply={reply}
                context={{ page: "discussion", projectId, discussionId: discussion.id }}
              />

              <DeltaInsights
                projectId={projectId}
                items={discussion.summary}
                evidence={evidence}
                relatedKnowledge={relatedKnowledge}
                impacts={impacts}
              />
            </div>
          </div>
        </div>
      }
      attentionPanel={<AttentionSection knowledgeObjects={knowledgeObjects} />}
      actionsPanel={
        <ProjectActionsCard
          projectId={projectId}
          discussionId={discussion.id}
        />
      }
      updatesPanel={<DiscussionUpdatesCard relatedDiscussions={discussion.relatedDiscussions} />}
      contextPanel={
        <ProjectContextPanel
          knowledgeObjects={knowledgeObjects}
          projectId={projectId}
          discussionId={discussion.id}
          linkedDocuments={discussion.linkedDocuments}
          linkedDrawings={discussion.linkedDrawings}
          linkedMeetings={discussion.linkedMeetings}
          linkedPhotos={discussion.linkedPhotos}
        />
      }
    />
  );
}
