import type { RequirementListItem } from "@/lib/types/requirement";
import { RequirementPriorityBadge } from "./RequirementPriorityBadge";
import { RequirementStatusBadge } from "./RequirementStatusBadge";

interface RequirementRowProps {
  requirement: RequirementListItem;
}

export function RequirementRow({
  requirement,
}: RequirementRowProps) {
  return (
    <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
      <td className="px-4 py-3 font-medium whitespace-nowrap">
        {requirement.requirement_number}
      </td>

      <td className="px-4 py-3">
        <div className="font-medium text-white">
          {requirement.title}
        </div>

        {requirement.category_name && (
          <div className="mt-1 text-xs text-slate-400">
            {requirement.category_name}
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <RequirementStatusBadge
          status={requirement.status}
        />
      </td>

      <td className="px-4 py-3">
        <RequirementPriorityBadge
          priority={requirement.priority}
        />
      </td>

      <td className="px-4 py-3 text-slate-300">
        {requirement.source_name ?? "—"}
      </td>

      <td className="px-4 py-3 text-slate-300">
        {requirement.verification_status}
      </td>
    </tr>
  );
}