import type { ConfidenceLevel, Evidence, ReasoningResult } from "@/types/evidence";

/**
 * Shared evidence/confidence/reasoning display pieces — extracted from
 * `DeltaResponsePanel.tsx` (Sprint 4.3) so the Knowledge Draft review screen
 * (Sprint 4.4) can reuse the exact same rendering instead of duplicating it.
 * Pure extraction: markup and behavior are unchanged from their original
 * definitions.
 */

export function FieldLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
      {children}
    </p>
  );
}

const CONFIDENCE_CLASS: Record<ConfidenceLevel, string> = {
  high: "bg-success/15 text-success",
  medium: "bg-info/15 text-info",
  low: "bg-warning/15 text-warning",
  none: "bg-error/15 text-error",
};

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

export function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CONFIDENCE_CLASS[confidence]}`}>
      Confidence: {CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) return null;

  return (
    <ul className="mt-1.5 space-y-1">
      {evidence.map((item) => (
        <li
          key={item.id}
          className="text-[13px] text-text-secondary"
        >
          <span className="font-semibold text-text-primary">{item.type}:</span> {item.title}
        </li>
      ))}
    </ul>
  );
}

export function ReasoningSection({ reasoning }: { reasoning: ReasoningResult }) {
  if (reasoning.found.length === 0 && reasoning.missing.length === 0) return null;

  return (
    <div className="space-y-1.5 rounded-lg border border-border-subtle bg-surface-secondary p-2.5">
      <FieldLabel>Reasoning</FieldLabel>

      {reasoning.found.length > 0 && (
        <ul className="space-y-0.5">
          {reasoning.found.map((line) => (
            <li
              key={line}
              className="text-[12px] leading-5 text-success"
            >
              {line}
            </li>
          ))}
        </ul>
      )}

      {reasoning.missing.length > 0 && (
        <ul className="space-y-0.5">
          {reasoning.missing.map((line) => (
            <li
              key={line}
              className="text-[12px] leading-5 text-text-tertiary"
            >
              {line}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[12px] font-medium text-text-secondary">{reasoning.conclusion}</p>
    </div>
  );
}
