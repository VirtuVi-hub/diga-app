"use client";

import { useState } from "react";
import UploadDocumentModal from "@/components/project-records/UploadDocumentModal";

type ProjectRecordsClientProps = {
  projectId: string;
  children: React.ReactNode;
};

export default function ProjectRecordsClient({
  projectId,
  children,
}: ProjectRecordsClientProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Project Documents
        </h2>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/20"
        >
          Upload Document
        </button>
      </div>

      {children}

      <UploadDocumentModal
        projectId={projectId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </>
  );
}
