import { RelatedDiscussionsSection } from "@/components/delta/RelatedDiscussionsSection";
import { QuadrantCard } from "./QuadrantCard";

export function DiscussionUpdatesCard({ relatedDiscussions }: { relatedDiscussions: string[] }) {
  return (
    <QuadrantCard label="Discussion Updates">
      <RelatedDiscussionsSection relatedDiscussions={relatedDiscussions} />
    </QuadrantCard>
  );
}
