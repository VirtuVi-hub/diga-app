import type { ReactNode } from "react";

/**
 * Sprint 5.8, Module 7: "There should not be a visible transition between
 * 'outside' and 'inside' Delta." Every auth page (`/auth`, `/register`,
 * `/forgot-password`, `/reset-password`, `/verify`) and `/logout`
 * previously hardcoded its own `bg-slate-950`/`bg-slate-900`/
 * `border-white/10`/`bg-cyan-500` palette — a visibly different product
 * from the real design tokens (`surface-primary`/`surface-secondary`/
 * `border-subtle`/`accent-primary`) every internal page already uses.
 * One shared shell, reusing exactly those tokens plus the same
 * `rounded-xl` input / `rounded-full` accent-button shapes already
 * established throughout the app (e.g. `AgreementWorkspace.tsx`) — not a
 * new visual language, the existing one applied consistently.
 */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-primary px-6">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-secondary p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-accent-primary text-[16px] font-bold text-surface-primary">Δ</span>
          <span className="font-display text-[16px] font-bold tracking-[0.12em] text-text-primary">DELTA</span>
        </div>

        <h1 className="font-display text-2xl font-semibold text-text-primary">{title}</h1>
        {subtitle && <p className="mt-2 text-text-secondary">{subtitle}</p>}

        <div className="mt-8">{children}</div>

        {footer && <div className="mt-6 text-center text-sm text-text-secondary">{footer}</div>}
      </div>
    </main>
  );
}

export const AUTH_INPUT_CLASS = "w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none focus:border-accent-primary";
export const AUTH_BUTTON_CLASS = "w-full rounded-full bg-accent-primary px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50";
export const AUTH_LINK_CLASS = "text-accent-primary hover:opacity-80";
