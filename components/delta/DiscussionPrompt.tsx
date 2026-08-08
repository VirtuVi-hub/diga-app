"use client";

import { AtSign, Paperclip, SendHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { deltaComprehensionService } from "@/lib/comprehension/delta-comprehension-service";
import type { ComprehensionContextInput, DeltaDestination, ExtractedEntity } from "@/types/comprehension";
import type { KnowledgeObjectType } from "@/types/knowledge-object";
import { DeltaMark } from "./DeltaMark";
import { DeltaResponsePanel } from "./DeltaResponsePanel";
import { useDeltaPanel } from "./useDeltaPanel";

const DESTINATION_LABELS: Record<DeltaDestination, string> = {
  delta_query: "Delta Query",
  new_discussion: "Discussion",
  new_requirement: "Requirement",
  new_decision: "Decision",
  new_issue: "Issue",
  new_action: "Action",
};

/** Sprint 4.4: these four destinations now open a Knowledge Draft review instead of Delta's old "workflow item" text response. */
const DESTINATION_TO_KNOWLEDGE_OBJECT_TYPE: Partial<Record<DeltaDestination, KnowledgeObjectType>> = {
  new_requirement: "requirement",
  new_decision: "decision",
  new_issue: "issue",
  new_action: "action",
};

/** Only surface the hint when the prediction is confident and worth flagging. */
const DESTINATION_HINT_CONFIDENCE_THRESHOLD = 0.6;

export function DiscussionPrompt({
  onSubmit,
  onDraftRequested,
  context,
}: {
  onSubmit: (message: string, entities: string[]) => void;
  onDraftRequested: (message: string, entities: ExtractedEntity[], type: KnowledgeObjectType) => void;
  context?: ComprehensionContextInput;
}) {
  const [message, setMessage] = useState("");
  const delta = useDeltaPanel(context);

  /**
   * Computed once per keystroke and reused for both the visible hint and the
   * actual Enter/Send routing decision below — the Journal must never run a
   * second, independent classification of the same message.
   */
  const comprehension = useMemo(() => {
    const trimmed = message.trim();
    if (!trimmed) return null;
    return deltaComprehensionService.comprehend({ text: trimmed, context });
  }, [message, context]);

  const destinationHint = useMemo(() => {
    if (!comprehension) return null;
    const { destination, confidence } = comprehension.destination;
    if (destination === "new_discussion" || confidence < DESTINATION_HINT_CONFIDENCE_THRESHOLD) return null;

    return DESTINATION_LABELS[destination];
  }, [comprehension]);

  const submit = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const destination = comprehension?.destination;
    const isConfident = !!destination && destination.confidence >= DESTINATION_HINT_CONFIDENCE_THRESHOLD;
    const knowledgeObjectType = destination ? DESTINATION_TO_KNOWLEDGE_OBJECT_TYPE[destination.destination] : undefined;

    /**
     * Only the Comprehension Engine's own low-confidence fallback ever
     * produces `new_discussion`, so this never blocks a genuine statement.
     * Requirement/Decision/Issue/Action (Sprint 4.4) now open a Knowledge
     * Draft review instead of Delta's old "workflow item" text response;
     * Delta Query still routes straight to Delta exactly as Sprint 4.3.1
     * built it — neither that path nor Discussion creation change at all.
     */
    if (isConfident && knowledgeObjectType && comprehension) {
      onDraftRequested(trimmed, comprehension.entities, knowledgeObjectType);
    } else if (isConfident && destination!.destination !== "new_discussion") {
      delta.ask(trimmed);
    } else {
      onSubmit(trimmed, (comprehension?.entities ?? []).map((entity) => entity.value));
    }

    setMessage("");
  };

  const askDelta = () => {
    delta.ask(message);
    setMessage("");
  };

  return (
    <div className="relative">
      <div className="rounded-xl border border-border-strong bg-surface-raised p-2 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Attach evidence"
            className="grid size-9 place-items-center rounded-md text-text-secondary transition hover:bg-surface-tertiary hover:text-text-primary"
          >
            <Paperclip size={18} />
          </button>

          <button
            type="button"
            aria-label="Mention project object"
            className="grid size-9 place-items-center rounded-md text-text-secondary transition hover:bg-surface-tertiary hover:text-text-primary"
          >
            <AtSign size={18} />
          </button>

          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            aria-label="Ask Delta about this project"
            placeholder="Ask Delta about this project..."
            className="min-w-0 flex-1 bg-transparent px-1 text-[14px] text-text-primary outline-none placeholder:text-text-tertiary"
          />

          {destinationHint && (
            <span className="shrink-0 rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
              → {destinationHint}
            </span>
          )}

          <button
            type="button"
            onClick={askDelta}
            aria-label="Ask Delta"
            className="grid size-9 place-items-center rounded-md text-accent-primary transition hover:bg-surface-tertiary"
          >
            <DeltaMark size={15} />
          </button>

          <button
            type="button"
            onClick={submit}
            aria-label="Send project conversation"
            className="grid size-9 place-items-center rounded-md bg-accent-primary text-surface-primary transition hover:bg-accent-hover"
          >
            <SendHorizontal size={16} />
          </button>
        </div>
      </div>

      <DeltaResponsePanel
        state={delta.state}
        onClose={delta.close}
        variant="inline"
      />
    </div>
  );
}
