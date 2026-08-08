import { GitBranch } from "lucide-react";
import { milestones } from "@/data/evolution";
import { WORKSPACE_TIMELINE_WIDTH_CLASS } from "@/lib/workspace-layout";
import { EvolutionMarker } from "./EvolutionMarker";

const newestFirst = [...milestones].reverse();

export function ProjectEvolutionStrip({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <aside
      className={`relative hidden ${WORKSPACE_TIMELINE_WIDTH_CLASS} shrink-0 border-r border-border-subtle bg-surface-primary lg:block`}
      aria-label="Timeline"
    >
      <div className="flex h-[68px] flex-col items-center justify-center gap-1 border-b border-border-subtle">
        <GitBranch
          size={13}
          className="text-text-tertiary"
        />
      </div>

      <div className="relative mx-auto mt-6 w-full before:absolute before:bottom-6 before:left-1/2 before:top-6 before:border-l before:border-border-subtle">
        {newestFirst.map((milestone) => (
          <EvolutionMarker
            key={milestone.id}
            milestone={milestone}
            selected={selectedId === milestone.id}
            onSelect={() => onSelect(milestone.id)}
          />
        ))}
      </div>
    </aside>
  );
}
