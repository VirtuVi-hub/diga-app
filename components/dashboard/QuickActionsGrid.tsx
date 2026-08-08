"use client";

import { useRouter } from "next/navigation";
import { BookOpen, FileUp, Handshake, ListPlus, MessageSquarePlus, PenSquare, ShieldAlert, UserPlus } from "lucide-react";

/**
 * Module 9: Quick Actions — shortcuts into workflows that already exist,
 * never new creation logic. Requirement/Decision/Issue/Action/Discussion all
 * genuinely happen the same way today: typed naturally into the Journal,
 * where the existing Input Router (Sprint 4.3.1) classifies the text and
 * Knowledge Capture (Sprint 4.4) drafts the right type — there is no
 * separate "New Requirement" form to link to honestly, so all five route to
 * the Journal, matching how the app actually works today.
 */
export function QuickActionsGrid({ projectId }: { projectId: string }) {
  const router = useRouter();

  const actions = [
    { label: "Open Journal", icon: BookOpen, href: `/projects/${projectId}` },
    { label: "Create Requirement", icon: ListPlus, href: `/projects/${projectId}` },
    { label: "Create Decision", icon: Handshake, href: `/projects/${projectId}` },
    { label: "Create Issue", icon: ShieldAlert, href: `/projects/${projectId}` },
    { label: "Create Action", icon: PenSquare, href: `/projects/${projectId}` },
    { label: "Start Discussion", icon: MessageSquarePlus, href: `/projects/${projectId}` },
    { label: "Upload Drawing", icon: FileUp, href: `/projects/${projectId}/data` },
    { label: "Upload Document", icon: FileUp, href: `/projects/${projectId}/data` },
    { label: "Invite Team Member", icon: UserPlus, href: "/firm" },
  ];

  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-text-primary">Quick Actions</h3>
      <p className="mt-1 text-[12px] text-text-tertiary">Requirement, Decision, Issue, and Action creation happens by typing naturally in the Journal — Delta drafts it for you.</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map(({ label, icon: Icon, href }) => (
          <button
            key={label}
            type="button"
            onClick={() => router.push(href)}
            className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-secondary px-3 py-2.5 text-left text-[13px] font-medium text-text-secondary transition hover:border-border-strong hover:text-text-primary"
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
