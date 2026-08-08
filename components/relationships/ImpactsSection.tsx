import { impactNodeTypeOrder, relationshipNodeTypeConfig } from "@/lib/relationship-types";
import type { Relationship } from "@/types/relationship";
import { RelationshipGroupedList } from "./RelationshipGroupedList";

export function ImpactsSection({ relationships }: { relationships: Relationship[] }) {
  return (
    <div className="border-t border-border-subtle px-5 py-4">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Potential Impacts</h2>
      <RelationshipGroupedList
        relationships={relationships}
        nodeTypeOrder={impactNodeTypeOrder}
        config={relationshipNodeTypeConfig}
        emptyLabel="No impacts yet."
      />
    </div>
  );
}
