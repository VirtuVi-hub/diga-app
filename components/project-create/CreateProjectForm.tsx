"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/actions/project-actions";

/**
 * Post-launch fix: replaces the old multi-step Project Creation Wizard.
 * Collects only real project identity (Name / Client / Location / Building
 * Type) — Scope, Timeline, Budget, and Project Team were removed, not
 * hidden: none of them had a real home anywhere in the agreed lifecycle
 * (Team is Project Setup's own step, reachable only after Agreement
 * approval; Scope/Timeline/Budget were never read by anything downstream).
 * One real write (`createProject()`), one redirect — straight to the
 * Agreement, which is now mandatory before anything else.
 */
export function CreateProjectForm({ firmName }: { firmName: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const project = await createProject({
        name: name.trim(),
        client: client.trim() || undefined,
        location: location.trim() || undefined,
        type: type.trim() || undefined,
      });
      // Create Project -> Agreement -> Client Invitation -> Agreement
      // Review -> Agreement Approved -> Project Setup -> Delta Review ->
      // Project Active. Agreement upload is mandatory — this is the only
      // place a freshly created project goes next.
      router.push(`/projects/${project.id}/agreement`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">New Project — {firmName}</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-text-primary">Project Details</h1>
      <p className="mt-1 text-sm text-text-secondary">Just enough to get started — everything else (team, scope, documents) comes next, once the Agreement is in place.</p>

      {error && <p className="mt-4 text-sm text-error">{error}</p>}

      <div className="mt-8 space-y-4">
        <Field label="Project Name" value={name} onChange={setName} placeholder="Riverfront Residence" required />
        <Field label="Client Name" value={client} onChange={setClient} placeholder="Apex Developments" />
        <Field label="Location" value={location} onChange={setLocation} placeholder="Seattle, WA" />
        <Field label="Building Type" value={type} onChange={setType} placeholder="Residential" />
      </div>

      <div className="mt-8 flex justify-end">
        <button type="button" onClick={handleCreate} disabled={loading || !name.trim()} className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "Creating..." : "Create Project"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-text-secondary">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3 text-text-primary outline-none"
      />
    </div>
  );
}
