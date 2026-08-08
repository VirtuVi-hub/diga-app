"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDelegation } from "@/lib/actions/delegation-actions";

type PersonOption = { personId: string; name: string; roleId: string; roleName: string };

/**
 * Sprint 5.7, Module 9: "Before delegation, display a confirmation
 * explaining the implications." Two-step modal — pick delegate/reason/
 * dates, then an explicit confirmation screen before the write happens.
 */
export function DelegationModal({
  projectId,
  originalAuthority,
  candidates,
  onClose,
}: {
  projectId: string;
  originalAuthority: PersonOption;
  candidates: { personId: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [delegatePersonId, setDelegatePersonId] = useState(candidates[0]?.personId ?? "");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const delegateName = candidates.find((candidate) => candidate.personId === delegatePersonId)?.name ?? "this person";

  function submit() {
    startTransition(async () => {
      try {
        await createDelegation(
          {
            projectId,
            originalAuthorityPersonId: originalAuthority.personId,
            originalAuthorityRoleId: originalAuthority.roleId,
            delegatePersonId,
            reason: reason.trim(),
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
          delegateName,
        );
        router.refresh();
        onClose();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Failed to create the delegation.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border-subtle bg-surface-secondary p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text-primary">Delegate Approval Authority</h2>
          <button type="button" onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            ×
          </button>
        </div>

        {step === "form" ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-text-secondary">
              {originalAuthority.name} ({originalAuthority.roleName}) delegating to:
            </p>
            <select value={delegatePersonId} onChange={(event) => setDelegatePersonId(event.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none">
              {candidates.length === 0 && <option value="">No project members available</option>}
              {candidates.map((candidate) => (
                <option key={candidate.personId} value={candidate.personId}>
                  {candidate.name}
                </option>
              ))}
            </select>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">Reason (required)</label>
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} className="w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-text-secondary">Start Date (optional)</label>
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-text-secondary">End Date (optional)</label>
                <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none" />
              </div>
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary">
                Cancel
              </button>
              <button
                type="button"
                disabled={!delegatePersonId || !reason.trim()}
                onClick={() => setStep("confirm")}
                className="rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-text-primary">
              <p className="font-medium">This will let {delegateName} act as {originalAuthority.roleName} for this project.</p>
              <p className="mt-2 text-text-secondary">
                {delegateName} will be able to approve on {originalAuthority.name}&apos;s behalf{startDate || endDate ? ` between ${startDate || "now"} and ${endDate || "further notice"}` : ""}. Every approval made under this delegation will permanently record the original authority, the delegate, the reason, and the period. This can be revoked at any time.
              </p>
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setStep("form")} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary">
                Back
              </button>
              <button type="button" onClick={submit} disabled={isPending} className="rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {isPending ? "Delegating..." : "Confirm Delegation"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
