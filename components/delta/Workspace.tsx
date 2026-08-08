import { WORKSPACE_FEED_MAX_WIDTH_CLASS, WORKSPACE_FEED_PADDING_CLASS } from "@/lib/workspace-layout";
import type { ExtractedEntity } from "@/types/comprehension";
import type { Discussion } from "@/types/discussion";
import type { KnowledgeObjectType } from "@/types/knowledge-object";
import type { Relationship } from "@/types/relationship";
import { DiscussionCard } from "./DiscussionCard";
import { DiscussionPrompt } from "./DiscussionPrompt";
import { WorkspaceHeader } from "./WorkspaceHeader";

export function Workspace({
  projectId,
  items,
  relationships,
  onAddDiscussion,
  onDraftRequested,
  onReply,
}: {
  projectId: string;
  items: Discussion[];
  relationships: Relationship[];
  onAddDiscussion: (message: string, entities: string[]) => void;
  onDraftRequested: (message: string, entities: ExtractedEntity[], type: KnowledgeObjectType) => void;
  onReply: (id: string, text: string) => void;
}) {
  return (
    <section className={`flex h-full min-h-0 min-w-0 flex-col bg-surface-primary ${WORKSPACE_FEED_PADDING_CLASS}`}>
      <div className={`mx-auto flex h-full min-h-0 w-full ${WORKSPACE_FEED_MAX_WIDTH_CLASS} flex-col`}>
        <WorkspaceHeader />

        <div className="mt-3 shrink-0">
          <DiscussionPrompt
            onSubmit={onAddDiscussion}
            onDraftRequested={onDraftRequested}
            context={{ page: "journal", projectId }}
          />
        </div>

        <div className="mt-3 flex-1 space-y-4 overflow-y-auto pb-2">
          {items.map((discussion) => (
            <DiscussionCard
              key={discussion.id}
              discussion={discussion}
              projectId={projectId}
              href={`/projects/${projectId}/discussions/${discussion.id}`}
              onReply={(text) => onReply(discussion.id, text)}
              relationships={relationships}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
