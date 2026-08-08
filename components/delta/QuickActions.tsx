import { CalendarPlus, FileText, Handshake, ListPlus } from "lucide-react";

export function QuickActions({ onAddRequirement }: { onAddRequirement?: () => void }) {
  const actions = [
    { label: "Request Meeting", icon: CalendarPlus, onClick: undefined },
    { label: "Upload Document", icon: FileText, onClick: undefined },
    { label: "Add Requirement", icon: ListPlus, onClick: onAddRequirement },
    { label: "Add Decision", icon: Handshake, onClick: undefined },
  ];

  return (
    <div className="flex flex-col gap-1">
      {actions.map(({ label, icon: Icon, onClick }) => (
        <button
          type="button"
          key={label}
          onClick={onClick}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-1.5 text-[13px] font-semibold text-surface-primary transition hover:bg-accent-hover"
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}
