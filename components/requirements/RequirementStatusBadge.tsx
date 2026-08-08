interface RequirementStatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-slate-600/20 text-slate-300 border-slate-500/30",
  "Under Review": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  Archived: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

export function RequirementStatusBadge({
  status,
}: RequirementStatusBadgeProps) {
  const style =
    STATUS_STYLES[status] ??
    "bg-slate-500/20 text-slate-300 border-slate-500/30";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}
