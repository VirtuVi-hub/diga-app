export function GroupLabel({ children }: { children: string }) {
  return (
    <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
      {children}
    </h3>
  );
}
