import Link from "next/link";
import type { UpcomingSection } from "@/lib/types/dashboard";

/** Module 8: Upcoming — a foundation panel. Only genuinely real data is ever shown; sections with none render their own honest empty state rather than inventing content (see `dashboard-actions.ts` for why Meetings/Milestones are always empty this sprint). */
export function UpcomingPanel({ sections }: { sections: UpcomingSection[] }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-text-primary">Upcoming</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.key}
            className="rounded-xl border border-border-subtle bg-surface-secondary p-4"
          >
            <p className="text-[13px] font-semibold text-text-primary">{section.label}</p>
            {section.items.length === 0 ? (
              <p className="mt-1.5 text-[12px] text-text-tertiary">{section.emptyState}</p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {section.items.map((item) =>
                  item.href ? (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="text-[12px] text-accent-primary hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-[11px] text-text-tertiary">{item.detail}</p>
                    </li>
                  ) : (
                    <li key={item.id}>
                      <p className="text-[12px] text-text-secondary">{item.title}</p>
                      <p className="text-[11px] text-text-tertiary">{item.detail}</p>
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
