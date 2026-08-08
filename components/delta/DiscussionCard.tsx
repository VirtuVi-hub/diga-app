"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { filterRelationshipsForNode } from "@/lib/relationship-utils";
import { toDisplayRoleName } from "@/lib/roles/display-role-name";
import type { Discussion } from "@/types/discussion";
import type { Relationship } from "@/types/relationship";
import { AvatarStack } from "./AvatarStack";
import { DeltaInsights } from "./DeltaInsights";
import { DiscussionTypeBadge } from "./DiscussionTypeBadge";
import { ReplyBar } from "./ReplyBar";

const PREVIEW_MESSAGE_COUNT = 3;

export function DiscussionCard({
  discussion,
  projectId,
  href,
  onReply,
  relationships,
}: {
  discussion: Discussion;
  projectId: string;
  href: string;
  onReply: (text: string) => void;
  relationships: Relationship[];
}) {
  const previewMessages = discussion.messages.slice(-PREVIEW_MESSAGE_COUNT);
  const discussionNode = { id: discussion.id, type: "discussion" as const };
  const evidence = filterRelationshipsForNode(relationships, discussionNode, "evidence");
  const impacts = filterRelationshipsForNode(relationships, discussionNode, "impact");
  const relatedKnowledge = filterRelationshipsForNode(relationships, discussionNode, "related");

  return (
    <motion.article
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-primary shadow-[var(--shadow-card)]"
    >
      {/* Header — fixed */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 overflow-hidden border-b border-border-subtle px-5">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="min-w-0 truncate font-display text-[17px] font-semibold tracking-[-0.025em] text-text-primary">{discussion.title}</h2>
          <DiscussionTypeBadge type={discussion.type} />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <AvatarStack people={discussion.participants} />

          <Link
            href={href}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-[12px] font-semibold text-accent-primary transition hover:bg-surface-tertiary"
          >
            Open Discussion
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Discussion preview */}
      <div className="relative overflow-hidden px-5 py-4">
        <div className="space-y-3">
          {previewMessages.map((message) => (
            <p
              key={message.id}
              className="line-clamp-2 text-[13px] leading-5 text-text-secondary"
            >
              <span className="font-bold text-accent-primary">{toDisplayRoleName(message.role)}</span>
              {" "}
              <span className="font-semibold text-text-primary">{message.author}</span>
              <span className="text-text-tertiary"> · {message.time}</span>
              {"  "}
              {message.text}
            </p>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-surface-primary" />
      </div>

      {/* Reply bar — fixed */}
      <div className="flex h-12 shrink-0 items-center px-5">
        <ReplyBar
          onSubmit={onReply}
          context={{ page: "journal", discussionId: discussion.id }}
        />
      </div>

      {/* Delta Insights — same component and props as the Discussion page */}
      <DeltaInsights
        projectId={projectId}
        items={discussion.summary}
        evidence={evidence}
        relatedKnowledge={relatedKnowledge}
        impacts={impacts}
      />
    </motion.article>
  );
}
