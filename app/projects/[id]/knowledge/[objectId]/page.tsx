import { notFound } from "next/navigation";
import { getKnowledgeObject } from "@/lib/actions/knowledge-object-actions";
import { getEvidenceForNode, getImpactsForNode } from "@/lib/actions/relationship-actions";
import { knowledgeValidationEngine } from "@/lib/knowledge-validation/knowledge-validation-engine";
import { WORKSPACE_FEED_PADDING_CLASS } from "@/lib/workspace-layout";
import { KnowledgeObjectDetail } from "@/components/knowledge-objects/KnowledgeObjectDetail";
import { requireActiveProject } from "@/lib/governance/activation-gate";

export default async function KnowledgeObjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; objectId: string }>;
}) {
  const { id, objectId } = await params;
  await requireActiveProject(id);

  const object = await getKnowledgeObject(objectId);

  if (!object) {
    notFound();
  }

  const [evidence, impacts, validation] = await Promise.all([
    getEvidenceForNode({ id: object.id, type: object.type }),
    getImpactsForNode({ id: object.id, type: object.type }),
    knowledgeValidationEngine.assemble(object),
  ]);

  return (
    // Sprint 4.9 (§8) — reuses the shared padding constant instead of a
    // hand-duplicated (if pixel-identical) literal, so this page and the
    // Journal/Timeline pages stay single-sourced.
    <section className={`h-full min-h-0 bg-surface-primary ${WORKSPACE_FEED_PADDING_CLASS}`}>
      <KnowledgeObjectDetail
        object={object}
        evidence={evidence}
        impacts={impacts}
        validation={validation}
      />
    </section>
  );
}
