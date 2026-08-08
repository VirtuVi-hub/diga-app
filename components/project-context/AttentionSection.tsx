import { AlertTriangle, Bell, CheckCircle2, CircleHelp, ListChecks } from "lucide-react";
import type { KnowledgeObject } from "@/types/knowledge-object";
import { CompactExpandableRow } from "./CompactExpandableRow";
import { QuadrantCard } from "./QuadrantCard";

export function AttentionSection({ knowledgeObjects }: { knowledgeObjects: KnowledgeObject[] }) {
  const pendingApprovals = knowledgeObjects.reduce(
    (count, object) => count + object.approvals.filter((approval) => approval.status === "pending").length,
    0,
  );

  return (
    <QuadrantCard label="Attention">
      <div className="space-y-2">
        <CompactExpandableRow
          icon={CheckCircle2}
          label="Pending Approvals"
          count={pendingApprovals}
          emptyLabel="No pending approvals."
        />

        <CompactExpandableRow
          icon={Bell}
          label="Notifications"
          count={0}
          disabled
          disabledBadge="Soon"
        />

        <CompactExpandableRow
          icon={ListChecks}
          label="Items Requiring Action"
          count={0}
          emptyLabel="Nothing requires action yet."
        />

        <CompactExpandableRow
          icon={AlertTriangle}
          label="Conflicts"
          count={0}
          emptyLabel="No conflicts detected."
        />

        <CompactExpandableRow
          icon={CircleHelp}
          label="Missing Information"
          count={0}
          emptyLabel="No missing information flagged."
        />
      </div>
    </QuadrantCard>
  );
}
