"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, User, Settings as SettingsIcon, type LucideIcon } from "lucide-react";
import { getFirmContext } from "@/lib/actions/firm-actions";

/**
 * Sprint 5.8, Module 10: "There is currently no obvious way to sign out."
 * The TopBar's avatar button existed (hardcoded "MC", no click handler,
 * no menu) — this makes it real. Reuses `getFirmContext()` (already
 * exported, already used by the Firm page) for the signed-in person's
 * name/email rather than adding a new query. Profile/Account are honest
 * "Soon" stubs, not fake functionality — Sign Out is the one real action
 * this sprint needs, reusing the existing `/logout` route unmodified.
 * Structured as a flat menu-item list so Switch Firm/Switch Project/
 * Settings can be appended later without restructuring.
 */
export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [person, setPerson] = useState<{ first_name: string; last_name: string; email: string | null } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getFirmContext()
      .then(({ person }) => setPerson(person))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const initials = person ? `${person.first_name.charAt(0)}${person.last_name.charAt(0)}`.toUpperCase() : "";
  const fullName = person ? `${person.first_name} ${person.last_name}`.trim() : "Account";

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        aria-label="Open profile menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="ml-1 grid size-9 place-items-center rounded-full bg-accent-muted text-[11px] font-bold text-accent-primary transition hover:opacity-90"
      >
        {initials || "•"}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-border-subtle bg-surface-secondary p-2 shadow-lg">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-text-primary">{fullName}</p>
            {person?.email && <p className="truncate text-xs text-text-tertiary">{person.email}</p>}
          </div>

          <div className="my-1 border-t border-border-subtle" />

          <MenuItem icon={User} label="Profile" />
          <MenuItem icon={SettingsIcon} label="Account" />

          <div className="my-1 border-t border-border-subtle" />

          <Link href="/logout" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-error transition hover:bg-surface-tertiary">
            <LogOut size={16} />
            Sign Out
          </Link>
        </div>
      )}
    </div>
  );
}

/** Honest "Soon" stub — matches this codebase's existing precedent for genuinely-unbuilt features (e.g. the Sidebar's own disabled "Data"/"Knowledge Bank" items) rather than a dead-looking or fake-functional button. */
function MenuItem({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      disabled
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-tertiary opacity-60"
    >
      <Icon size={16} />
      {label}
      <span className="ml-auto text-[10px] uppercase tracking-wide text-text-tertiary">Soon</span>
    </button>
  );
}
