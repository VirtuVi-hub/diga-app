"use client";

import { Mic, Paperclip, SendHorizontal } from "lucide-react";
import { useState } from "react";
import type { ComprehensionContextInput } from "@/types/comprehension";
import { DeltaMark } from "./DeltaMark";
import { DeltaResponsePanel } from "./DeltaResponsePanel";
import { useDeltaPanel } from "./useDeltaPanel";

export function ReplyBar({
  onSubmit,
  variant = "overlay",
  context,
}: {
  onSubmit?: (text: string) => void;
  variant?: "overlay" | "inline";
  context?: ComprehensionContextInput;
}) {
  const [reply, setReply] = useState("");
  const delta = useDeltaPanel(context);

  const submit = () => {
    const trimmed = reply.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setReply("");
  };

  const askDelta = () => {
    delta.ask(reply);
    setReply("");
  };

  return (
    <div className="relative w-full">
      <div className="flex w-full items-center gap-1 rounded-lg border border-border-subtle bg-surface-primary p-1">
        <button
          type="button"
          aria-label="Attach file"
          className="grid size-7 shrink-0 place-items-center rounded-md text-text-tertiary transition hover:bg-surface-tertiary hover:text-text-primary"
        >
          <Paperclip size={15} />
        </button>

        <button
          type="button"
          aria-label="Voice input"
          disabled
          className="grid size-7 shrink-0 place-items-center rounded-md text-text-tertiary/50"
        >
          <Mic size={15} />
        </button>

        <input
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
          aria-label="Reply to this discussion"
          placeholder="Reply..."
          className="min-w-0 flex-1 bg-transparent px-1 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary"
        />

        <button
          type="button"
          onClick={askDelta}
          aria-label="Ask Delta"
          className="grid size-7 shrink-0 place-items-center rounded-md text-accent-primary transition hover:bg-surface-tertiary"
        >
          <DeltaMark size={13} />
        </button>

        <button
          type="button"
          onClick={submit}
          aria-label="Send reply"
          className="grid size-7 shrink-0 place-items-center rounded-md bg-accent-primary text-surface-primary transition hover:bg-accent-hover"
        >
          <SendHorizontal size={14} />
        </button>
      </div>

      <DeltaResponsePanel
        state={delta.state}
        onClose={delta.close}
        variant={variant}
      />
    </div>
  );
}
