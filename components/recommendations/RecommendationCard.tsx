"use client";

import Link from "next/link";
import { ConfidenceBadge, EvidenceList, ReasoningSection } from "@/components/delta/EvidenceDisplay";
import { relationshipNodeTypeConfig } from "@/lib/relationship-types";
import { nodeHref } from "@/lib/relationship-utils";
import type { Recommendation, RecommendationStatus } from "@/types/recommendation";

const RESOLVED_STATUS_LABEL: Partial<Record<RecommendationStatus, string>> = {
  accepted: "Accepted",
  dismissed: "Dismissed",
};

/** One reusable card — works for every `recommendationType`, never a type-specific rendering branch. */
export function RecommendationCard({
  recommendation,
  projectId,
  onAccept,
  onDismiss,
  isSubmitting = false,
}: {
  recommendation: Recommendation;
  projectId: string;
  onAccept: () => void;
  onDismiss: () => void;
  isSubmitting?: boolean;
}) {
  const relatedLinks = recommendation.relatedNodes
    .map((node) => ({ node, href: nodeHref(projectId, node), label: relationshipNodeTypeConfig[node.type].label }))
    .filter((item): item is { node: (typeof recommendation.relatedNodes)[number]; href: string; label: string } => Boolean(item.href));

  const resolvedLabel = RESOLVED_STATUS_LABEL[recommendation.status];

  return (
    <div className={`rounded-xl border border-border-subtle bg-surface-primary p-4 ${resolvedLabel ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-[15px] font-semibold text-text-primary">{recommendation.title}</p>
        <div className="flex shrink-0 items-center gap-2">
          {resolvedLabel && (
            <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">{resolvedLabel}</span>
          )}
          <ConfidenceBadge confidence={recommendation.confidence} />
        </div>
      </div>

      <p className="mt-1.5 text-[13px] leading-5 text-text-secondary">{recommendation.description}</p>

      <div className="mt-3">
        <ReasoningSection reasoning={recommendation.reasoning} />
      </div>

      {recommendation.evidence.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">Evidence</p>
          <EvidenceList evidence={recommendation.evidence} />
        </div>
      )}

      {relatedLinks.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">Related Knowledge</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {relatedLinks.map(({ node, href, label }) => (
              <Link
                key={`${node.type}-${node.id}`}
                href={href}
                className="rounded-full bg-surface-tertiary px-2.5 py-1 text-[12px] font-medium text-accent-primary transition hover:bg-accent-muted"
              >
                Open {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {!resolvedLabel && (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onDismiss}
            className="rounded-md px-3 py-1.5 text-[12px] font-semibold text-text-secondary transition hover:bg-surface-tertiary disabled:opacity-50"
          >
            Dismiss
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onAccept}
            className="rounded-md bg-accent-primary px-3 py-1.5 text-[12px] font-semibold text-surface-primary transition hover:bg-accent-hover disabled:opacity-50"
          >
            Accept
          </button>
        </div>
      )}
    </div>
  );
}
