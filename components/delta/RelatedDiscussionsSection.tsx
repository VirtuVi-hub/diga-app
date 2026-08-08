import { MessagesSquare } from "lucide-react";
import { CompactExpandableRow } from "@/components/project-context/CompactExpandableRow";

export function RelatedDiscussionsSection({ relatedDiscussions }: { relatedDiscussions: string[] }) {
  return (
    <CompactExpandableRow
      icon={MessagesSquare}
      label="Related Discussions"
      count={relatedDiscussions.length}
      emptyLabel="No related discussions yet."
    >
      <ul className="space-y-1.5">
        {relatedDiscussions.map((id) => (
          <li
            key={id}
            className="flex gap-2 truncate text-[13px] text-text-secondary"
          >
            <span className="text-accent-primary">•</span>
            {id}
          </li>
        ))}
      </ul>
    </CompactExpandableRow>
  );
}
