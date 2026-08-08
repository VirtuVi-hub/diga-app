import Link from "next/link";
import { Workflow } from "lucide-react";
import type { KnowledgeObject } from "@/types/knowledge-object";
import { CompactExpandableRow } from "./CompactExpandableRow";

function RequirementWorkflowRow({ object }: { object: KnowledgeObject }) {
  return (
    <div className="space-y-1 border-b border-border-subtle pb-2 last:border-b-0 last:pb-0">
      <Link
        href={`/projects/${object.projectId}/knowledge/${object.id}`}
        className="truncate text-[13px] font-medium text-text-primary transition hover:text-accent-primary"
      >
        {object.title}
      </Link>

      {object.raisedTo && (
        <p className="text-[12px] text-text-secondary">
          <span className="text-text-tertiary">Raised To:</span> {object.raisedTo}
        </p>
      )}

      {object.approvalRequiredFrom && object.approvalRequiredFrom.length > 0 && (
        <p className="text-[12px] text-text-secondary">
          <span className="text-text-tertiary">Approval Required From:</span> {object.approvalRequiredFrom.join(", ")}
        </p>
      )}

      {object.notify && object.notify.length > 0 && (
        <p className="text-[12px] text-text-secondary">
          <span className="text-text-tertiary">Notify:</span> {object.notify.join(", ")}
        </p>
      )}
    </div>
  );
}

export function WorkflowSection({ knowledgeObjects }: { knowledgeObjects: KnowledgeObject[] }) {
  const requirements = knowledgeObjects.filter((object) => object.type === "requirement");

  return (
    <CompactExpandableRow
      icon={Workflow}
      label="Requirement Workflow"
      count={requirements.length}
      emptyLabel="No requirement workflow yet."
    >
      <div className="space-y-2">
        {requirements.map((object) => (
          <RequirementWorkflowRow
            key={object.id}
            object={object}
          />
        ))}
      </div>
    </CompactExpandableRow>
  );
}
