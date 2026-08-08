import type { HealthMetric } from "@/lib/types/dashboard";

function formatValue(metric: HealthMetric): string {
  if (metric.value === "Not Available") return "Not Available";
  return metric.unit === "%" ? `${metric.value}%` : `${metric.value}`;
}

/** Module 3: Project Health — every value comes straight from `computeProjectHealth()`; this component only renders. */
export function ProjectHealthGrid({ metrics }: { metrics: HealthMetric[] }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-text-primary">Project Health</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            title={metric.detail}
            className="rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3"
          >
            <p className={`text-xl font-semibold ${metric.value === "Not Available" ? "text-text-tertiary" : "text-text-primary"}`}>{formatValue(metric)}</p>
            <p className="mt-0.5 text-[12px] text-text-tertiary">{metric.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
