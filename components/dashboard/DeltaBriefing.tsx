function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Module 2: Delta Daily Briefing — renders the deterministic lines `generateDashboardBriefing()` already composed. No client state, no fetching. */
export function DeltaBriefing({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-secondary p-6">
      <p className="font-display text-lg font-semibold text-text-primary">{greeting()}.</p>
      <p className="mt-1 text-[13px] text-text-tertiary">In the last 7 days:</p>
      <ul className="mt-3 space-y-1.5">
        {lines.map((line) => (
          <li
            key={line}
            className="flex gap-2 text-[14px] text-text-secondary"
          >
            <span
              className="text-accent-primary"
              aria-hidden
            >
              •
            </span>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
