import type { Milestone } from "@/types/evolution";
import { discussionTypeDotClass } from "@/lib/discussion-types";
import { DiscussionTypeBadge } from "./DiscussionTypeBadge";

export function EvolutionMarker({ milestone, selected, onSelect }: { milestone: Milestone; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${milestone.title}, ${milestone.date}`}
      className="group relative flex h-16 w-full items-center justify-center"
    >
      <span className={`size-3 rounded-full ring-4 ring-surface-primary transition-transform group-hover:scale-125 ${discussionTypeDotClass[milestone.discussionType]} ${selected ? "scale-125 ring-accent-muted" : ""}`} />

      <span className="pointer-events-none absolute left-[76px] z-30 hidden w-64 rounded-lg border border-border-strong bg-surface-raised p-3 text-left shadow-[var(--shadow-card)] group-hover:block">
        <span className="flex items-center gap-2">
          <DiscussionTypeBadge type={milestone.discussionType} />
          <span className="text-[11px] font-medium text-text-tertiary">{milestone.date}</span>
        </span>

        <span className="mt-2 block font-display text-[14px] font-semibold text-text-primary">{milestone.title}</span>
        <span className="mt-2 block text-[12px] leading-5 text-text-secondary">{milestone.summary}</span>
        <span className="mt-2 block text-[11px] text-accent-primary">{milestone.impact.requirements} requirements · {milestone.impact.drawings} drawings</span>
      </span>
    </button>
  );
}
