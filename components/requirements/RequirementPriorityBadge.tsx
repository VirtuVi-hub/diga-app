interface RequirementPriorityBadgeProps {
  priority: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-slate-600/20 text-slate-300 border-slate-500/30",
  Medium: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  High: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Critical: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function RequirementPriorityBadge({
  priority,
}: RequirementPriorityBadgeProps) {
  const style =
    PRIORITY_STYLES[priority] ??
    "bg-slate-500/20 text-slate-300 border-slate-500/30";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${style}`}
    >
      {priority}
    </span>
  );
}