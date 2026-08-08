import Link from "next/link";
import type { AttentionItem } from "@/lib/types/dashboard";

const CATEGORY_BADGE_CLASS: Record<AttentionItem["category"], string> = {
  approval: "bg-error/15 text-error",
  review: "bg-warning/15 text-warning",
  recommendation: "bg-accent-primary/15 text-accent-primary",
  onboarding: "bg-info/15 text-info",
  revision: "bg-text-tertiary/15 text-text-tertiary",
};

function ItemBody({ item }: { item: AttentionItem }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] font-semibold text-text-primary">{item.title}</p>
        <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CATEGORY_BADGE_CLASS[item.category]}`}>{item.categoryLabel}</span>
      </div>
      <p className="mt-1 text-[12px] text-text-tertiary">{item.description}</p>
    </>
  );
}

/**
 * Module 4: Attention Center — renders `computeAttentionCenter()`'s already
 * sorted, already deduplicated list. Items with a resolvable `href` link
 * straight to the related object (Knowledge Object, Onboarding), matching
 * `TimelineEntryCard`'s own click-through convention; items with none
 * (Gateway review requests, which have no detail page yet) render as plain
 * cards.
 */
export function AttentionCenterPanel({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="font-display text-lg font-semibold text-text-primary">Attention Center</h3>
        <p className="mt-1 text-[13px] text-text-tertiary">Nothing needs your attention right now.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-text-primary">Attention Center</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) =>
          item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className="block rounded-lg border border-border-subtle bg-surface-primary px-4 py-3 transition hover:border-border-strong"
            >
              <ItemBody item={item} />
            </Link>
          ) : (
            <div
              key={item.id}
              className="rounded-lg border border-border-subtle bg-surface-primary px-4 py-3"
            >
              <ItemBody item={item} />
            </div>
          ),
        )}
      </div>
    </div>
  );
}
