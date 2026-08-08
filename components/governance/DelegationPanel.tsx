"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revokeDelegation } from "@/lib/actions/delegation-actions";
import { DelegationModal } from "@/components/governance/DelegationModal";
import { toDisplayRoleName } from "@/lib/roles/display-role-name";
import type { Delegation } from "@/lib/types/delegation";

type AuthorityHolder = { personId: string; name: string; roleId: string; roleName: string };

/**
 * Sprint 5.7, Module 8: "Delegation must be visible to project
 * participants." Mounted on the Participants page — every active and
 * revoked delegation is shown, never hidden once created (permanent
 * record).
 */
export function DelegationPanel({
  projectId,
  delegations,
  authorityHolders,
  candidates,
}: {
  projectId: string;
  delegations: Delegation[];
  authorityHolders: AuthorityHolder[];
  candidates: { personId: string; name: string }[];
}) {
  const router = useRouter();
  const [selectedAuthorityId, setSelectedAuthorityId] = useState(authorityHolders[0]?.personId ?? "");
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedAuthority = authorityHolders.find((holder) => holder.personId === selectedAuthorityId);

  function revoke(id: string) {
    startTransition(async () => {
      await revokeDelegation(id, projectId);
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-border-subtle bg-surface-secondary p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text-primary">Authority & Delegation</h2>
      </div>
      <p className="mt-1 text-sm text-text-secondary">Approval authority belongs to a person. Responsibility remains with the original role.</p>

      {authorityHolders.length > 0 && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Delegate from</label>
            <select value={selectedAuthorityId} onChange={(event) => setSelectedAuthorityId(event.target.value)} className="rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none">
              {authorityHolders.map((holder) => (
                <option key={holder.personId} value={holder.personId}>
                  {holder.name} ({holder.roleName})
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="rounded-full bg-accent-primary px-4 py-2.5 text-sm font-medium text-white">
            Delegate Authority
          </button>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {delegations.length === 0 ? (
          <li className="text-sm text-text-tertiary">No delegations have been created.</li>
        ) : (
          delegations.map((delegation) => (
            <li key={delegation.id} className="rounded-xl border border-border-subtle bg-surface-primary p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-primary">
                  {delegation.original_authority_person_name ?? "Unknown"} ({toDisplayRoleName(delegation.original_authority_role_name) || "Role"}) → {delegation.delegate_person_name ?? "Unknown"}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${delegation.status === "active" ? "bg-success/15 text-success" : "bg-surface-tertiary text-text-tertiary"}`}>
                  {delegation.status === "active" ? "Active" : delegation.status === "revoked" ? "Revoked" : "Expired"}
                </span>
              </div>
              <p className="mt-1 text-text-secondary">Reason: {delegation.reason}</p>
              {(delegation.start_date || delegation.end_date) && (
                <p className="mt-1 text-text-tertiary">
                  Period: {delegation.start_date ?? "now"} – {delegation.end_date ?? "further notice"}
                </p>
              )}
              {delegation.status === "active" && (
                <button type="button" onClick={() => revoke(delegation.id)} disabled={isPending} className="mt-2 text-xs text-text-tertiary hover:text-error">
                  Revoke
                </button>
              )}
            </li>
          ))
        )}
      </ul>

      {modalOpen && selectedAuthority && (
        <DelegationModal projectId={projectId} originalAuthority={selectedAuthority} candidates={candidates.filter((candidate) => candidate.personId !== selectedAuthority.personId)} onClose={() => setModalOpen(false)} />
      )}
    </section>
  );
}
