import { knowledgeObjectTypeOrder } from "@/lib/knowledge-object-types";
import type { KnowledgeObject } from "@/types/knowledge-object";
import { KnowledgeTypeGroup } from "./KnowledgeTypeGroup";

export function KnowledgeSection({
  objects,
  projectId,
  discussionId,
}: {
  objects: KnowledgeObject[];
  projectId: string;
  discussionId: string;
}) {
  return (
    <div className="space-y-2">
      {knowledgeObjectTypeOrder.map((type) => (
        <KnowledgeTypeGroup
          key={type}
          type={type}
          objects={objects.filter((object) => object.type === type)}
          projectId={projectId}
          discussionId={discussionId}
        />
      ))}
    </div>
  );
}
