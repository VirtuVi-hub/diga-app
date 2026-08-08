import Link from "next/link";

interface EmptyRequirementsProps {
  projectId?: string;
}

export function EmptyRequirements({
  projectId,
}: EmptyRequirementsProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
      <div className="text-5xl">📋</div>

      <h3 className="mt-6 text-xl font-semibold text-white">
        No requirements yet
      </h3>

      <p className="mt-2 max-w-md text-sm text-slate-400">
        Requirements define what the project must achieve and provide the
        foundation for design, verification, and approval.
      </p>

      {projectId && (
        <Link
          href={`/projects/${projectId}/requirements/new`}
          className="mt-8 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-500"
        >
          Create First Requirement
        </Link>
      )}
    </div>
  );
}
