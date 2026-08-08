import { Ellipsis, Moon, Sun } from "lucide-react";
import { useProjectIdentity } from "@/components/project-shell/ProjectIdentityContext";
import { AvatarStack } from "./AvatarStack";
import { AccountMenu } from "./AccountMenu";
import { NotificationBell } from "./NotificationBell";

export function TopBar({ theme, onToggleTheme }: { theme: "dark" | "light"; onToggleTheme: () => void }) {
  const { identity } = useProjectIdentity();

  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between gap-4 border-b border-border-subtle bg-surface-primary px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center">
        {identity && (
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">Current project</p>
            <p className="mt-0.5 max-w-56 truncate font-display text-[16px] font-semibold tracking-[-0.02em] text-text-primary">{identity.name}</p>

            {(identity.client || identity.participants.length > 0) && (
              <div className="mt-0.5 flex items-center gap-3">
                {identity.client && (
                  <p className="min-w-0 flex-1 truncate text-[12px] text-text-secondary">
                    <span className="font-semibold text-text-tertiary">CL</span> · {identity.client}
                  </p>
                )}

                {identity.participants.length > 0 && (
                  <div className="ml-auto hidden shrink-0 lg:block">
                    <AvatarStack people={identity.participants} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={onToggleTheme}
          className="grid size-9 place-items-center rounded-lg text-text-secondary transition hover:bg-surface-tertiary hover:text-text-primary"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <NotificationBell projectId={identity?.id} />
        <button
          type="button"
          aria-label="Project menu"
          className="grid size-9 place-items-center rounded-lg text-text-secondary transition hover:bg-surface-tertiary hover:text-text-primary"
        >
          <Ellipsis size={20} />
        </button>
        <AccountMenu />
      </div>
    </header>
  );
}
