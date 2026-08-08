import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { relationshipNodeTypeConfig } from "@/lib/relationship-types";
import { nodeHref } from "@/lib/relationship-utils";
import type { Relationship } from "@/types/relationship";
import { DeltaMark } from "./DeltaMark";

const COLUMN_HEIGHT_CLASS = "h-[240px] overflow-y-auto pr-1";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
      {children}
    </p>
  );
}

function SummarySection({ items }: { items: string[] }) {
  return (
    <div>
      <SectionLabel>Summary</SectionLabel>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-[13px] leading-5 text-text-secondary"
          >
            <span className="text-accent-primary">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Wraps a row in a `Link` when the node has a real detail page (Sprint 4.9
 * fix — these rows previously rendered as plain, non-clickable text with no
 * way to build an href at all, since `projectId` wasn't even threaded in).
 * Falls back to plain content for node types with no detail page yet
 * (Meeting/Drawing/Document/Photo/Video/Reference), matching the same
 * fallback `RecommendationCard`/`TimelineEntryCard` already use.
 */
function NodeLink({ projectId, relationship, className, children }: { projectId: string; relationship: Relationship; className: string; children: ReactNode }) {
  const href = nodeHref(projectId, relationship.nodeB);
  if (!href) return <div className={className}>{children}</div>;

  return (
    <Link
      href={href}
      className={`${className} transition hover:text-text-primary`}
    >
      {children}
    </Link>
  );
}

function EvidenceSection({ projectId, evidence }: { projectId: string; evidence: Relationship[] }) {
  return (
    <div>
      <SectionLabel>Evidence</SectionLabel>
      <div className="mt-1.5 space-y-1.5">
        {evidence.map((relationship) => {
          const Icon = relationshipNodeTypeConfig[relationship.nodeB.type].icon;
          return (
            <NodeLink
              key={relationship.id}
              projectId={projectId}
              relationship={relationship}
              className="flex items-center gap-2 text-[13px] text-text-secondary"
            >
              <Icon
                size={14}
                className="shrink-0 text-text-tertiary"
              />
              {relationship.nodeB.label}
            </NodeLink>
          );
        })}
      </div>
    </div>
  );
}

function RelatedKnowledgeSection({ projectId, relatedKnowledge }: { projectId: string; relatedKnowledge: Relationship[] }) {
  return (
    <div>
      <SectionLabel>Related Knowledge</SectionLabel>
      <ul className="mt-1.5 space-y-1.5">
        {relatedKnowledge.map((relationship) => (
          <li key={relationship.id}>
            <NodeLink
              projectId={projectId}
              relationship={relationship}
              className="block text-[13px] text-text-secondary"
            >
              <span className="font-semibold text-text-primary">{relationshipNodeTypeConfig[relationship.nodeB.type].label}:</span>{" "}
              {relationship.nodeB.label}
            </NodeLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImpactsSection({ projectId, impacts }: { projectId: string; impacts: Relationship[] }) {
  return (
    <div className="rounded-xl border border-warning/25 bg-warning/5 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-warning">
        <AlertTriangle size={12} />
        Potential Impacts
      </p>
      <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:grid-cols-1">
        {impacts.map((relationship) => {
          const Icon = relationshipNodeTypeConfig[relationship.nodeB.type].icon;
          return (
            <NodeLink
              key={relationship.id}
              projectId={projectId}
              relationship={relationship}
              className="flex items-center gap-1.5 rounded-lg border border-warning/20 bg-surface-primary px-2.5 py-1.5 text-[12px] font-medium text-warning"
            >
              <Icon
                size={13}
                className="shrink-0"
              />
              {relationship.nodeB.label}
            </NodeLink>
          );
        })}
      </div>
    </div>
  );
}

export function DeltaInsights({
  projectId,
  items,
  evidence,
  relatedKnowledge,
  impacts,
}: {
  projectId: string;
  items: string[];
  evidence?: Relationship[];
  relatedKnowledge?: Relationship[];
  impacts?: Relationship[];
}) {
  const hasImpacts = !!impacts && impacts.length > 0;

  return (
    <div className="shrink-0 max-h-[320px] border-t border-border-subtle bg-surface-secondary px-5 py-3.5">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-primary">
        <DeltaMark size={13} />
        Delta Insights
      </p>

      {hasImpacts ? (
        <div className="mt-3 grid grid-cols-1 items-start gap-5 md:grid-cols-[1.2fr_1fr]">
          <div className={`space-y-4 ${COLUMN_HEIGHT_CLASS}`}>
            <SummarySection items={items} />
            {evidence && evidence.length > 0 && <EvidenceSection projectId={projectId} evidence={evidence} />}
            {relatedKnowledge && relatedKnowledge.length > 0 && <RelatedKnowledgeSection projectId={projectId} relatedKnowledge={relatedKnowledge} />}
          </div>

          <div className={COLUMN_HEIGHT_CLASS}>
            <ImpactsSection projectId={projectId} impacts={impacts} />
          </div>
        </div>
      ) : (
        <div className={`mt-3 space-y-4 ${COLUMN_HEIGHT_CLASS}`}>
          <SummarySection items={items} />
          {evidence && evidence.length > 0 && <EvidenceSection projectId={projectId} evidence={evidence} />}
          {relatedKnowledge && relatedKnowledge.length > 0 && <RelatedKnowledgeSection projectId={projectId} relatedKnowledge={relatedKnowledge} />}
        </div>
      )}
    </div>
  );
}
