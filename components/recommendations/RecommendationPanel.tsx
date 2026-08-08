"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptRecommendation, dismissRecommendation } from "@/lib/actions/recommendation-actions";
import type { Recommendation } from "@/types/recommendation";
import { RecommendationCard } from "./RecommendationCard";

/** Hardcoded stand-in for the signed-in user — matches the exact convention already used by `KnowledgeObjectDetail.tsx`/`KnowledgeValidationPanel.tsx`; no real authentication exists yet. */
const CURRENT_ACTOR = "Maya Chen";

/**
 * Reusable Recommendation panel (Sprint 4.8) — generic over every
 * `recommendationType`, works anywhere a list of Recommendations is passed
 * in. Mounted on the Project Intelligence Timeline page this sprint; nothing
 * about the component itself is page-specific.
 */
export function RecommendationPanel({
  projectId,
  initialRecommendations,
}: {
  projectId: string;
  initialRecommendations: Recommendation[];
}) {
  const router = useRouter();
  // Sprint 4.9 fix: resolved recommendations stay in the list (in a distinct
  // "Resolved" section, see below) instead of vanishing the instant Accept/
  // Dismiss is clicked — the disappearing card was a confirmed "did anything
  // actually happen?" bug.
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const resolve = async (id: string, action: (id: string, actorId: string) => Promise<Recommendation>) => {
    setSubmittingId(id);
    try {
      const updated = await action(id, CURRENT_ACTOR);
      setRecommendations((current) => current.map((item) => (item.id === id ? updated : item)));
      router.refresh();
    } finally {
      setSubmittingId(null);
    }
  };

  const open = recommendations.filter((item) => item.status === "open");
  const resolved = recommendations.filter((item) => item.status !== "open");

  if (open.length === 0 && resolved.length === 0) {
    return (
      <div>
        <h3 className="font-display text-lg font-semibold text-text-primary">Recommendations</h3>
        <p className="mt-1 text-[13px] text-text-tertiary">Nothing needs your attention right now.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-text-primary">Recommendations</h3>
      <p className="mt-1 text-[13px] text-text-secondary">
        {open.length > 0 ? "What Delta has noticed since the last change." : "Nothing open right now."}
      </p>

      {open.length > 0 && (
        <div className="mt-4 space-y-3">
          {open.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              projectId={projectId}
              isSubmitting={submittingId === recommendation.id}
              onAccept={() => resolve(recommendation.id, acceptRecommendation)}
              onDismiss={() => resolve(recommendation.id, dismissRecommendation)}
            />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">Resolved</p>
          <div className="mt-2 space-y-3">
            {resolved.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                projectId={projectId}
                isSubmitting={false}
                onAccept={() => {}}
                onDismiss={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
