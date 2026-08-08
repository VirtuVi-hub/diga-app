"use client";

import { useState } from "react";
import { TopBar } from "@/components/delta/TopBar";
import { AppSidebar } from "./AppSidebar";
import { ProjectIdentityProvider } from "./ProjectIdentityContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  return (
    <ProjectIdentityProvider>
      <div
        data-theme={theme}
        className="flex h-dvh min-h-[640px] overflow-hidden bg-surface-primary text-text-primary"
      >
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            theme={theme}
            onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          />

          {/* Sprint 5.8, Module 9: the one place every workspace page's content scrolls — pages no longer need to (and, before this fix, mostly didn't) declare their own overflow container, so "no browser-level scrolling" is a structural guarantee, not a per-page convention to remember. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
        </div>
      </div>
    </ProjectIdentityProvider>
  );
}
