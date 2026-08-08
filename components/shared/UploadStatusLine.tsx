import type { UploadActionStatus } from "./useUploadAction";

/** Sprint 5.8, Module 4: the shared success/failure line every upload button renders underneath itself — one wording, everywhere. */
export function UploadStatusLine({ status, error, successMessage }: { status: UploadActionStatus; error: string; successMessage: string }) {
  if (status === "error") {
    return <p className="mt-2 text-sm text-error">{error}</p>;
  }

  if (status === "success") {
    return <p className="mt-2 text-sm text-success">{successMessage}</p>;
  }

  return null;
}
