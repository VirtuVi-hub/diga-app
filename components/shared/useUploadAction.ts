"use client";

import { useCallback, useState } from "react";

/**
 * Sprint 5.8, Module 4: one reusable upload state machine for every
 * upload button in Delta (Agreements today; Drawings/BOQs/Reports/
 * Specifications as each grows its own upload entry point later) — no
 * XHR-level byte progress exists anywhere in this codebase (uploads go
 * through a Next.js Server Action, which has no progress-event API), so
 * "show progress" means an honest indeterminate uploading state, never a
 * fabricated percentage. Duplicate submits are prevented by construction:
 * `run()` no-ops while already `"uploading"`.
 */
export type UploadActionStatus = "idle" | "uploading" | "success" | "error";

export function useUploadAction<T>(action: (formData: FormData) => Promise<T>) {
  const [status, setStatus] = useState<UploadActionStatus>("idle");
  const [error, setError] = useState("");

  const run = useCallback(
    async (formData: FormData): Promise<T | undefined> => {
      if (status === "uploading") return undefined;

      setStatus("uploading");
      setError("");

      try {
        const result = await action(formData);
        setStatus("success");
        return result;
      } catch (uploadError) {
        setStatus("error");
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
        return undefined;
      }
    },
    [action, status],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError("");
  }, []);

  return { status, error, run, reset, isUploading: status === "uploading" };
}
