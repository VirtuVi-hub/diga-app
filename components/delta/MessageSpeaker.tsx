import { toDisplayRoleName } from "@/lib/roles/display-role-name";

export function MessageSpeaker({ author, role }: { author: string; role: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-[11px] font-bold text-accent-primary">{toDisplayRoleName(role)}</span>
      <span className="truncate text-[12px] font-semibold text-text-primary">{author}</span>
    </div>
  );
}
