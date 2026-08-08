import type { RequirementListItem } from "@/lib/types/requirement";
import { RequirementRow } from "./RequirementRow";
import { EmptyRequirements } from "./EmptyRequirements";

interface RequirementTableProps {
  requirements: RequirementListItem[];
  projectId?: string;
}

export function RequirementTable({
  requirements,
  projectId,
}: RequirementTableProps) {
  if (requirements.length === 0) {
    return <EmptyRequirements projectId={projectId} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                No.
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Requirement
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Priority
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Source
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Verification
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10 bg-slate-900/40">
            {requirements.map((requirement) => (
              <RequirementRow
                key={requirement.id}
                requirement={requirement}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}