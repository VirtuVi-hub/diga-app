"use client";

import { useEffect, useRef, useState } from "react";
import { resolveDeltaQuery, type DeltaQueryResult } from "@/lib/intelligence-engine/delta-query-resolver";
import type { ComprehensionContextInput } from "@/types/comprehension";

const SEARCH_DELAY_MS = 550;

/**
 * `query` is carried on both `loading` and `result` (Sprint 4.9) so the
 * response panel can display the original question alongside Delta's
 * answer, like a conversation, instead of silently discarding it — a
 * confirmed UX bug where the user's question vanished on submit and only
 * the floating answer remained.
 */
export type DeltaPanelState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "result"; query: string; result: DeltaQueryResult };

export function useDeltaPanel(context?: ComprehensionContextInput) {
  const [state, setState] = useState<DeltaPanelState>({ status: "idle" });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const ask = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    clearTimeout(timeoutRef.current);
    setState({ status: "loading", query: trimmed });

    timeoutRef.current = setTimeout(() => {
      resolveDeltaQuery(trimmed, context).then((result) => {
        setState({ status: "result", query: trimmed, result });
      });
    }, SEARCH_DELAY_MS);
  };

  const close = () => {
    clearTimeout(timeoutRef.current);
    setState({ status: "idle" });
  };

  return { isOpen: state.status !== "idle", state, ask, close };
}
