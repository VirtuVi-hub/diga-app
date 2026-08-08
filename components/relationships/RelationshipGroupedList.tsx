import type { LucideIcon } from "lucide-react";
import type { Relationship, RelationshipNodeType } from "@/types/relationship";

/**
 * Generic "grouped by node type" renderer for a list of relationships.
 * Never knows about specific entity types itself — the caller supplies
 * which node types to group by and in what order, so the same component
 * renders Evidence, Impacts, or any future relationship grouping.
 */
export function RelationshipGroupedList({
  relationships,
  nodeTypeOrder,
  config,
  emptyLabel = "Nothing linked yet.",
}: {
  relationships: Relationship[];
  nodeTypeOrder: RelationshipNodeType[];
  config: Record<RelationshipNodeType, { label: string; pluralLabel: string; icon: LucideIcon }>;
  emptyLabel?: string;
}) {
  const groups = nodeTypeOrder
    .map((type) => ({ type, config: config[type], items: relationships.filter((relationship) => relationship.nodeB.type === type) }))
    .filter((group) => group.items.length > 0);

  if (groups.length === 0) {
    return <p className="mt-3 text-[13px] text-text-tertiary">{emptyLabel}</p>;
  }

  return (
    <div className="mt-3 space-y-3">
      {groups.map(({ type, config: groupConfig, items }) => {
        const Icon = groupConfig.icon;
        return (
          <div key={type}>
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary">
              <Icon
                size={13}
                className="text-text-tertiary"
              />
              {groupConfig.pluralLabel} ({items.length})
            </p>
            <ul className="mt-1.5 space-y-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-2 truncate pl-[19px] text-[13px] text-text-secondary"
                >
                  <span className="text-accent-primary">•</span>
                  {item.nodeB.label}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
