"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptProjectInvitationByCode } from "@/lib/actions/project-invitation-actions";
import { getProjectLifecycleStage } from "@/lib/actions/project-actions";

export function AcceptInvitationButton({ code }: { code: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      try {
        const result = await acceptProjectInvitationByCode(code);
        const stage = await getProjectLifecycleStage(result.invitation.project_id);
        const destination =
          stage === "active"
            ? `/projects/${result.invitation.project_id}/dashboard`
            : stage === "draft" || stage === "agreement_review" || stage === "agreement_accepted"
              ? `/projects/${result.invitation.project_id}/agreement`
              : `/projects/${result.invitation.project_id}/setup`;
        router.push(destination);
      } catch (acceptError) {
        setError(acceptError instanceof Error ? acceptError.message : "Failed to accept the invitation.");
      }
    });
  }

  return (
    <div>
      <button type="button" onClick={accept} disabled={isPending} className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
        {isPending ? "Joining..." : "Accept Invitation"}
      </button>
      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </div>
  );
}
