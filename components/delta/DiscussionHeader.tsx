import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/lib/format-time";
import type { Discussion } from "@/types/discussion";
import { AvatarStack } from "./AvatarStack";
import { DiscussionTypeBadge } from "./DiscussionTypeBadge";

export function DiscussionHeader({
  discussion,
  backHref,
}: {
  discussion: Discussion;
  backHref: string;
}) {
  return (
    <div className="border-b border-border-subtle px-5 py-4">
      <Link
        href={backHref}
        className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-text-secondary transition hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="min-w-0 truncate font-display text-[20px] font-semibold tracking-[-0.03em] text-text-primary">{discussion.title}</h1>
          <DiscussionTypeBadge type={discussion.type} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <AvatarStack people={discussion.participants} />
          <span className="text-[11px] text-text-tertiary">{formatDateTime(discussion.lastActivityAt)}</span>
        </div>
      </div>
    </div>
  );
}
