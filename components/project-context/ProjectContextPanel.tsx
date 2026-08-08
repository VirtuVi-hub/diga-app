import { LinkedContentSection } from "@/components/delta/LinkedContentSection";
import { KnowledgeSection } from "@/components/knowledge-objects/KnowledgeSection";
import type { Discussion } from "@/types/discussion";
import type { KnowledgeObject } from "@/types/knowledge-object";
import { GroupLabel } from "./GroupLabel";
import { QuadrantCard } from "./QuadrantCard";
import { WorkflowSection } from "./WorkflowSection";

export function ProjectContextPanel({
  knowledgeObjects,
  projectId,
  discussionId,
  linkedDocuments,
  linkedDrawings,
  linkedMeetings,
  linkedPhotos,
}: {
  knowledgeObjects: KnowledgeObject[];
  projectId: string;
  discussionId: string;
  linkedDocuments: Discussion["linkedDocuments"];
  linkedDrawings: Discussion["linkedDrawings"];
  linkedMeetings: Discussion["linkedMeetings"];
  linkedPhotos: Discussion["linkedPhotos"];
}) {
  return (
    <QuadrantCard label="Project Context">
      <div className="space-y-6">
        <div className="space-y-2">
          <GroupLabel>Workflow</GroupLabel>
          <WorkflowSection knowledgeObjects={knowledgeObjects} />
        </div>

        <div className="space-y-2">
          <GroupLabel>Knowledge</GroupLabel>
          <KnowledgeSection
            objects={knowledgeObjects}
            projectId={projectId}
            discussionId={discussionId}
          />
        </div>

        <div className="space-y-2">
          <GroupLabel>References</GroupLabel>
          <LinkedContentSection
            linkedDocuments={linkedDocuments}
            linkedDrawings={linkedDrawings}
            linkedMeetings={linkedMeetings}
            linkedPhotos={linkedPhotos}
          />
        </div>
      </div>
    </QuadrantCard>
  );
}
