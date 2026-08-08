import { discussionTypeBadgeClass, discussionTypeLabels, type DiscussionTypeCode } from "@/lib/discussion-types";

export function DiscussionTypeBadge({ type }: { type: DiscussionTypeCode }) {
  return (
    <span
      title={discussionTypeLabels[type]}
      className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide ${discussionTypeBadgeClass[type]}`}
    >
      {type}
    </span>
  );
}
