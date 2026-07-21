"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/supabase/browser";

type Project = {
  id: string;
  name: string;
  client: string | null;
  location: string | null;
  description: string | null;
  type: string | null;
  created_at: string | null;
};

type ProjectField = "name" | "client" | "location" | "type" | "description";

const fieldLabels: Record<ProjectField, string> = {
  name: "Project Name",
  client: "Client",
  location: "Location",
  type: "Project Type",
  description: "Description",
};

export function ProjectDetailsEditor({
  project,
  projectId,
}: {
  project: Project;
  projectId: string;
}) {
  const [projectData, setProjectData] = useState(project);
  const [editingField, setEditingField] = useState<ProjectField | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const startEditing = (field: ProjectField) => {
    // Future hook: check user permissions before showing the pencil icon.
    setEditingField(field);
    setDraftValue(projectData[field] ?? "");
    setSuccessMessage("");
    setErrorMessage("");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setDraftValue("");
    setErrorMessage("");
  };

  const saveField = async () => {
    if (!editingField) {
      return;
    }

    const trimmedValue = draftValue.trim();

    if (editingField === "name" && !trimmedValue) {
      setErrorMessage("Project name is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const supabase = createBrowserSupabaseClient();
    const nextValue = editingField === "name" || editingField === "client" || editingField === "location" || editingField === "type"
      ? trimmedValue || null
      : trimmedValue || null;

    const { error } = await supabase
      .from("projects")
      .update({ [editingField]: nextValue })
      .eq("id", projectId);

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setProjectData((prev) => ({ ...prev, [editingField]: nextValue }));

    // Future hook: create an Activity Log event after a successful update.
    // Future hook: send notifications after a successful update.
    setSuccessMessage("Project updated.");
    setEditingField(null);
    setDraftValue("");
    setIsSaving(false);
  };

  const renderFieldValue = (field: ProjectField) => {
    if (editingField === field) {
      if (field === "description") {
        return (
          <textarea
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            rows={4}
            className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
          />
        );
      }

      return (
        <input
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
        />
      );
    }

    const value = projectData[field] ?? "—";
    return <p className="mt-2 text-lg text-slate-100">{value}</p>;
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="grid gap-4 sm:grid-cols-2">
        {(["name", "client", "location", "type"] as ProjectField[]).map((field) => (
          <div key={field}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{fieldLabels[field]}</p>
                {renderFieldValue(field)}
              </div>
              <button
                type="button"
                onClick={() => startEditing(field)}
                className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10"
                aria-label={`Edit ${fieldLabels[field]}`}
              >
                ✎
              </button>
            </div>
            {editingField === field ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={saveField}
                  disabled={isSaving}
                  className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300"
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Description</p>
            {renderFieldValue("description")}
          </div>
          <button
            type="button"
            onClick={() => startEditing("description")}
            className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10"
            aria-label="Edit Description"
          >
            ✎
          </button>
        </div>
        {editingField === "description" ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={saveField}
              disabled={isSaving}
              className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300"
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>

      {successMessage ? (
        <p className="mt-6 text-sm text-cyan-200">{successMessage}</p>
      ) : null}
      {errorMessage ? <p className="mt-6 text-sm text-rose-300">{errorMessage}</p> : null}
    </section>
  );
}
