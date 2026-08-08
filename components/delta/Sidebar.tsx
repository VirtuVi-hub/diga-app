"use client";

import { Settings as SettingsIcon, type LucideIcon } from "lucide-react";
import { DeltaMark } from "./DeltaMark";

export type SidebarNavItem = {
  label: string;
  icon: LucideIcon;
};

export function Sidebar({
  items,
  activeItem,
  onNavigate,
}: {
  items: SidebarNavItem[];
  activeItem: string;
  onNavigate: (item: string) => void;
}) {
  return (
    <aside className="hidden w-[238px] shrink-0 border-r border-border-subtle bg-surface-secondary px-3 py-4 lg:flex lg:flex-col">
      <button
        type="button"
        onClick={() => onNavigate("All Projects")}
        className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-surface-tertiary"
      >
        <span className="grid size-10 place-items-center rounded-lg bg-accent-primary text-[18px] font-bold text-surface-primary">Δ</span>
        <span>
          <span className="block font-display text-[18px] font-bold tracking-[0.12em] text-text-primary">DELTA</span>
          <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-text-tertiary">Knowledge OS</span>
        </span>
      </button>

      <nav className="mt-9 flex flex-1 flex-col gap-1">
        {items.map(({ label, icon: Icon }) => (
          <button
            type="button"
            key={label}
            onClick={() => onNavigate(label)}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-3 text-left text-[16px] font-medium transition duration-150 ${
              activeItem === label
                ? "bg-accent-muted text-accent-primary"
                : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
            }`}
          >
            <Icon
              size={20}
              strokeWidth={1.7}
              className="shrink-0"
            />
            {label}
            {activeItem === label && <span className="absolute inset-y-3 -left-3 w-0.5 rounded-r bg-accent-primary" />}
          </button>
        ))}
      </nav>

      <div className="border-t border-border-subtle pt-3">
        <button
          type="button"
          onClick={() => onNavigate("Settings")}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[16px] font-medium transition ${
            activeItem === "Settings" ? "bg-accent-muted text-accent-primary" : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
          }`}
        >
          <SettingsIcon
            size={20}
            strokeWidth={1.7}
          />
          Settings
        </button>

        <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface-tertiary px-3 py-2.5 text-[11px] text-text-tertiary">
          <DeltaMark size={12} />
          Delta Workspace • Alpha
        </div>
      </div>
    </aside>
  );
}
