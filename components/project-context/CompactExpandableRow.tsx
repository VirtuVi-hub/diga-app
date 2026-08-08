"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

export function CompactExpandableRow({
  icon: Icon,
  label,
  count,
  action,
  disabled = false,
  disabledBadge,
  emptyLabel = "Nothing here yet.",
  defaultOpen = false,
  children,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  action?: ReactNode;
  disabled?: boolean;
  disabledBadge?: string;
  emptyLabel?: string;
  defaultOpen?: boolean;
  children?: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-primary">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          disabled={disabled}
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px] font-medium text-text-primary disabled:cursor-default disabled:text-text-tertiary"
        >
          {disabled ? (
            <span className="w-3.5 shrink-0" />
          ) : isOpen ? (
            <ChevronDown
              size={14}
              className="shrink-0 text-text-tertiary"
            />
          ) : (
            <ChevronRight
              size={14}
              className="shrink-0 text-text-tertiary"
            />
          )}

          <Icon
            size={14}
            className="shrink-0 text-text-tertiary"
          />

          <span className="truncate">{label}</span>
          <span className="shrink-0 text-text-tertiary">({count})</span>
        </button>

        {disabled && disabledBadge ? (
          <span className="shrink-0 rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
            {disabledBadge}
          </span>
        ) : (
          action
        )}
      </div>

      {isOpen && !disabled && (
        <div className="border-t border-border-subtle px-3 py-2">
          {count === 0 ? (
            <p className="text-[12px] text-text-tertiary">{emptyLabel}</p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
