import { evidenceNodeTypeOrder, relationshipNodeTypeConfig } from "@/lib/relationship-types";
import type { Relationship } from "@/types/relationship";
import { RelationshipGroupedList } from "./RelationshipGroupedList";

export function EvidenceSection({ relationships }: { relationships: Relationship[] }) {
  return (
    <div className="border-t border-border-subtle px-5 py-4">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Evidence</h2>
      <RelationshipGroupedList
        relationships={relationships}
        nodeTypeOrder={evidenceNodeTypeOrder}
        config={relationshipNodeTypeConfig}
        emptyLabel="No evidence yet."
      />
    </div>
  );
}
