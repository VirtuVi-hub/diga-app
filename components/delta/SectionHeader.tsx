import type { ReactNode } from "react";

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) { return <div className="flex items-center justify-between"><h3 className="font-display text-[18px] font-semibold tracking-[-0.025em] text-text-primary">{title}</h3>{action}</div>; }
