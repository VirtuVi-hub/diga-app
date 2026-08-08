import { X } from "lucide-react";
import type { ReactNode } from "react";
import { ConfidenceBadge, EvidenceList, FieldLabel, ReasoningSection } from "./EvidenceDisplay";
import type { DeltaPanelState } from "./useDeltaPanel";
import { DeltaMark } from "./DeltaMark";

/**
 * "You asked" line (Sprint 4.9) — makes every Delta interaction read like a
 * conversation instead of the question vanishing the instant it's answered.
 */
function UserQuestion({ query }: { query: string }) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">You</p>
      <p className="mt-0.5 text-[13px] leading-5 text-text-primary">{query}</p>
    </div>
  );
}

function DeltaResponseBody({ state }: { state: DeltaPanelState }) {
  if (state.status === "loading") {
    return (
      <>
        <UserQuestion query={state.query} />
        <p className="mt-3 text-[13px] leading-5 text-text-secondary">Searching project knowledge...</p>
      </>
    );
  }

  if (state.status !== "result") return null;

  const { result, query } = state;

  let answer: ReactNode = null;

  if (result.kind === "answer") {
    answer = (
      <div className="space-y-3">
        <div>
          <FieldLabel>{result.label}</FieldLabel>
          <p className="mt-1 font-display text-[22px] font-semibold text-text-primary">{result.value}</p>
        </div>

        <ConfidenceBadge confidence={result.confidence} />

        <div>
          <FieldLabel>Evidence</FieldLabel>
          <EvidenceList evidence={result.evidence} />
        </div>

        <ReasoningSection reasoning={result.reasoning} />
      </div>
    );
  } else if (result.kind === "related") {
    answer = (
      <div className="space-y-3">
        <p className="font-display text-[15px] font-semibold text-text-primary">{result.heading}</p>

        <ConfidenceBadge confidence={result.confidence} />

        <EvidenceList evidence={result.evidence} />

        <ReasoningSection reasoning={result.reasoning} />
      </div>
    );
  } else if (result.kind === "comparison") {
    answer = (
      <div className="space-y-3">
        <ConfidenceBadge confidence={result.confidence} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {result.subjects.map((subject) => (
            <div key={subject.label}>
              <FieldLabel>{subject.label}</FieldLabel>
              <EvidenceList evidence={subject.evidence} />
            </div>
          ))}
        </div>

        <ReasoningSection reasoning={result.reasoning} />
      </div>
    );
  } else if (result.kind === "unknown") {
    answer = (
      <div className="space-y-3">
        <p className="text-[13px] leading-5 text-text-secondary">{result.message}</p>

        <ConfidenceBadge confidence={result.confidence} />

        {result.evidenceFound.length > 0 && (
          <div>
            <FieldLabel>What I Found</FieldLabel>
            <EvidenceList evidence={result.evidenceFound} />
          </div>
        )}

        {result.missingEvidence.length > 0 && (
          <div>
            <FieldLabel>What&apos;s Missing</FieldLabel>
            <ul className="mt-1.5 space-y-1">
              {result.missingEvidence.map((line) => (
                <li
                  key={line}
                  className="text-[13px] text-text-tertiary"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  } else if (result.kind === "clarification") {
    answer = (
      <div className="space-y-2">
        <p className="text-[13px] leading-5 text-text-secondary">{result.prompt}</p>

        {result.options.length > 0 && (
          <ul className="space-y-1">
            {result.options.map((option) => (
              <li
                key={option}
                className="text-[13px] text-accent-primary"
              >
                • {option}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (!answer) return <UserQuestion query={query} />;

  return (
    <>
      <UserQuestion query={query} />
      <div className="mt-3">{answer}</div>
    </>
  );
}

function DeltaResponseHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-primary">
        <DeltaMark size={12} />
        Delta
      </p>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close Delta response"
        className="grid size-6 shrink-0 place-items-center rounded-md text-text-tertiary transition hover:bg-surface-tertiary hover:text-text-primary"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function DeltaResponsePanel({
  state,
  onClose,
  variant = "overlay",
}: {
  state: DeltaPanelState;
  onClose: () => void;
  variant?: "overlay" | "inline";
}) {
  const isOpen = state.status !== "idle";

  if (variant === "overlay") {
    if (!isOpen) return null;

    return (
      <div className="absolute inset-x-0 bottom-full z-20 mb-2 max-h-[220px] overflow-y-auto rounded-xl border border-border-strong bg-surface-raised p-4 shadow-[var(--shadow-card)]">
        <DeltaResponseHeader onClose={onClose} />
        <DeltaResponseBody state={state} />
      </div>
    );
  }

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "mt-2 grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
    >
      <div className="overflow-hidden">
        <div className="max-h-[160px] overflow-y-auto rounded-xl border border-border-strong bg-surface-raised p-4 shadow-[var(--shadow-card)]">
          <DeltaResponseHeader onClose={onClose} />
          <DeltaResponseBody state={state} />
        </div>
      </div>
    </div>
  );
}
