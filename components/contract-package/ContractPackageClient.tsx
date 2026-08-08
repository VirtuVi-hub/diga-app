"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getContractDocumentViewUrl,
  uploadContractPackageDocument,
} from "@/lib/actions/contract-package-actions";
import type {
  DocumentListItem,
  DocumentRevision,
  DocumentType,
} from "@/lib/types/document";

type ContractDocument = DocumentListItem & { revisions: DocumentRevision[] };
type UploadStep = "type" | "mode" | "new" | "revision";

type ContractPackageClientProps = {
  documentTypes: DocumentType[];
  documents: ContractDocument[];
  projectId: string;
};

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Not uploaded";
}

function uploaderName(revision: DocumentRevision) {
  return revision.created_by ? `User ${revision.created_by.slice(0, 8)}` : "Unknown uploader";
}

function acceptedFileTypes(type: DocumentType | undefined) {
  return [
    type?.file_extension ? `.${type.file_extension.replace(/^\./, "")}` : "",
    type?.mime_type ?? "",
  ]
    .filter(Boolean)
    .join(",") || undefined;
}

export default function ContractPackageClient({
  documentTypes,
  documents,
  projectId,
}: ContractPackageClientProps) {
  const router = useRouter();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [step, setStep] = useState<UploadStep>("type");
  const [documentType, setDocumentType] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedType = documentTypes.find((type) => type.name === documentType);
  const selectedTypeDocuments = useMemo(
    () => documents.filter((document) => document.document_type_name === documentType),
    [documentType, documents],
  );

  function openUpload() {
    setStep("type");
    setDocumentType("");
    setDocumentId("");
    setDocumentName("");
    setFile(null);
    setError("");
    setIsUploadOpen(true);
  }

  function submitUpload() {
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    if (step === "new" && !documentName.trim()) {
      setError("Enter a document name.");
      return;
    }
    if (step === "revision" && !documentId) {
      setError("Choose the document you are revising.");
      return;
    }

    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("documentType", documentType);
    formData.append("file", file);
    if (step === "revision") {
      formData.append("documentId", documentId);
    } else {
      formData.append("documentName", documentName.trim());
    }

    startTransition(async () => {
      try {
        await uploadContractPackageDocument(formData);
        setIsUploadOpen(false);
        router.refresh();
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      }
    });
  }

  function viewDocument(id: string) {
    startTransition(async () => {
      try {
        const url = await getContractDocumentViewUrl(id);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (viewError) {
        setError(viewError instanceof Error ? viewError.message : "Unable to open document.");
      }
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={openUpload} className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400">
          Upload
        </button>
      </div>
      <div className="mt-6 space-y-4">
        {documentTypes.map((type) => {
          const typeDocuments = documents.filter(
            (document) => document.document_type_name === type.name,
          );
          const isOpen = openSections[type.id] ?? true;

          return (
            <section key={type.id} className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur">
              <button onClick={() => setOpenSections((sections) => ({ ...sections, [type.id]: !isOpen }))} className="flex w-full items-center justify-between p-6 text-left">
                <span className="text-xl font-semibold">{isOpen ? "▼" : "▶"} {type.name}</span>
                <span className="text-sm text-slate-400">{typeDocuments.length} document{typeDocuments.length === 1 ? "" : "s"}</span>
              </button>
              {isOpen && <div className="border-t border-white/10 px-6 pb-6 pt-4">
                {typeDocuments.length === 0 ? <p className="text-slate-400">No documents</p> : <div className="space-y-4">{typeDocuments.map((document) => <article key={document.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold text-white">{document.name}</h3><p className="mt-1 text-sm text-slate-400">Revision {document.current_revision ?? "—"} · Updated {formatDate(document.uploaded_at)}</p></div><button onClick={() => viewDocument(document.id)} disabled={isPending} className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50">View</button></div><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => setExpandedHistory((history) => ({ ...history, [document.id]: !history[document.id] }))} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">Revision History</button></div>{expandedHistory[document.id] && <div className="mt-5 space-y-3 border-t border-white/10 pt-4">{document.revisions.map((revision) => <div key={revision.id} className="rounded-xl bg-white/5 p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium text-white">Revision {revision.revision}{revision.is_current ? " · Current" : ""}</span><span className="text-slate-400">{revision.document_status_name ?? "Status unavailable"}</span></div><p className="mt-2 text-slate-400">Uploaded {formatDate(revision.uploaded_at)} by {uploaderName(revision)}</p><p className="mt-1 text-slate-400">Pending AI Analysis</p></div>)}</div>}</article>)}</div>}
              </div>}
            </section>
          );
        })}
      </div>
      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        {documents.length === 0 ? <p className="mt-4 text-slate-400">No contract document activity yet.</p> : <div className="mt-4 space-y-3">{documents.flatMap((document) => document.revisions.map((revision) => ({ document, revision }))).sort((left, right) => new Date(right.revision.uploaded_at).getTime() - new Date(left.revision.uploaded_at).getTime()).slice(0, 8).map(({ document, revision }) => <div key={revision.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4"><div><p className="font-medium text-white">{document.name}</p><p className="mt-1 text-sm text-slate-400">{document.document_type_name} · Revision {revision.revision} uploaded</p></div><p className="text-sm text-slate-400">{formatDate(revision.uploaded_at)}</p></div>)}</div>}
      </section>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {isUploadOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">Upload Contract Document</h2><button onClick={() => setIsUploadOpen(false)} className="rounded-full px-3 py-1 text-slate-400 hover:bg-white/10">×</button></div>{step === "type" && <div className="mt-8"><label className="block text-sm text-slate-300">Choose Document Type<select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"><option value="">Select a document type</option>{documentTypes.map((type) => <option key={type.id} value={type.name}>{type.name}</option>)}</select></label><div className="mt-8 flex justify-end"><button disabled={!documentType} onClick={() => setStep("mode")} className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-medium text-slate-950 disabled:opacity-50">Continue</button></div></div>}{step === "mode" && <div className="mt-8 space-y-3"><button onClick={() => setStep("new")} className="block w-full rounded-2xl border border-white/10 p-5 text-left transition hover:bg-white/5"><span className="block font-medium">New Document</span><span className="mt-1 block text-sm text-slate-400">Create a document of type {documentType}.</span></button><button onClick={() => setStep("revision")} disabled={selectedTypeDocuments.length === 0} className="block w-full rounded-2xl border border-white/10 p-5 text-left transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"><span className="block font-medium">Revision of Existing Document</span><span className="mt-1 block text-sm text-slate-400">Upload the next revision of a selected document.</span></button></div>}{step === "new" && <div className="mt-8"><label className="block text-sm text-slate-300">Document Name<input value={documentName} onChange={(event) => setDocumentName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" /></label></div>}{step === "revision" && <div className="mt-8"><label className="block text-sm text-slate-300">Which document are you revising?<select value={documentId} onChange={(event) => setDocumentId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"><option value="">Select a document</option>{selectedTypeDocuments.map((document) => <option key={document.id} value={document.id}>{document.name} · Revision {document.current_revision} · {formatDate(document.uploaded_at)}</option>)}</select></label></div>}{(step === "new" || step === "revision") && <div className="mt-6"><label className="block text-sm text-slate-300">Choose file<input type="file" accept={acceptedFileTypes(selectedType)} onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-slate-300" /></label><div className="mt-8 flex justify-end gap-3"><button onClick={() => setStep("mode")} className="rounded-full border border-white/10 px-5 py-2 text-sm text-slate-300">Back</button><button onClick={submitUpload} disabled={isPending} className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-medium text-slate-950 disabled:opacity-50">{isPending ? "Uploading..." : "Upload"}</button></div></div>}</div></div>}
    </>
  );
}
