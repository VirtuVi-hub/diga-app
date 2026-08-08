"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadDocumentFile } from "@/lib/actions/upload-document-action";

type UploadDocumentModalProps = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function UploadDocumentModal({
  projectId,
  isOpen,
  onClose,
}: UploadDocumentModalProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("Drawing");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleUpload() {
    if (!selectedFile) {
      setError("Please select a file.");
      return;
    }

    if (!documentName.trim()) {
      setError("Please enter a document name.");
      return;
    }

    setError("");

    const formData = new FormData();

    formData.append("projectId", projectId);
    formData.append("documentName", documentName);
    formData.append("documentType", documentType);
    formData.append("file", selectedFile);

    startTransition(async () => {
      try {
        const result = await uploadDocumentFile(formData);

        console.log(result);

        onClose();
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Upload failed."
        );
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">
            Upload Document
          </h2>

          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Document Name
            </label>

            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              placeholder="Enter document name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Document Type
            </label>

            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              <option>Drawing</option>
              <option>Specification</option>
              <option>Meeting Minutes</option>
              <option>Report</option>
              <option>Site Photograph</option>
              <option>Permit</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              File
            </label>

            <input
              type="file"
              onChange={(e) =>
                setSelectedFile(e.target.files?.[0] ?? null)
              }
              className="block w-full text-slate-300"
            />

            {selectedFile && (
              <p className="mt-3 text-sm text-cyan-300">
                {selectedFile.name}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        <div className="mt-10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-5 py-2 text-slate-300 transition hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={isPending}
            className="rounded-full bg-cyan-500 px-5 py-2 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {isPending ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}