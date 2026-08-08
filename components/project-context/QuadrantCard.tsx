import type { ReactNode } from "react";

export function QuadrantCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-secondary p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-primary">{label}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
