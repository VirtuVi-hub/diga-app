import { notFound } from "next/navigation";
import { getDiscussion } from "@/lib/actions/discussion-actions";
import { getKnowledgeObjects } from "@/lib/actions/knowledge-object-actions";
import { getEvidenceForNode, getImpactsForNode, queryRelationships } from "@/lib/actions/relationship-actions";
import { DiscussionDetail } from "@/components/delta/DiscussionDetail";

export default async function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ id: string; discussionId: string }>;
}) {
  const { id, discussionId } = await params;

  const discussion = await getDiscussion(discussionId);

  if (!discussion) {
    notFound();
  }

  const knowledgeObjects = await getKnowledgeObjects(discussionId);

  const discussionNode = { id: discussion.id, type: "discussion" as const };
  const [evidence, impacts, relatedKnowledge] = await Promise.all([
    getEvidenceForNode(discussionNode),
    getImpactsForNode(discussionNode),
    queryRelationships({ node: discussionNode, relationshipType: "related" }),
  ]);

  return (
    <DiscussionDetail
      discussion={discussion}
      projectId={id}
      knowledgeObjects={knowledgeObjects}
      backHref={`/projects/${id}`}
      evidence={evidence}
      relatedKnowledge={relatedKnowledge}
      impacts={impacts}
    />
  );
}
