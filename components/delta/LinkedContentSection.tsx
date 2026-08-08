import { CalendarDays, FileText, Image as ImageIcon, Ruler } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CompactExpandableRow } from "@/components/project-context/CompactExpandableRow";
import type { LinkedItem } from "@/types/discussion";

function LinkedContentRow({
  label,
  icon,
  items,
}: {
  label: string;
  icon: LucideIcon;
  items: LinkedItem[];
}) {
  return (
    <CompactExpandableRow
      icon={icon}
      label={label}
      count={items.length}
      emptyLabel={`No linked ${label.toLowerCase()} yet.`}
    >
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-2 truncate text-[13px] text-text-secondary"
          >
            <span className="text-accent-primary">•</span>
            {item.title}
          </li>
        ))}
      </ul>
    </CompactExpandableRow>
  );
}

export function LinkedContentSection({
  linkedDocuments,
  linkedDrawings,
  linkedMeetings,
  linkedPhotos,
}: {
  linkedDocuments: LinkedItem[];
  linkedDrawings: LinkedItem[];
  linkedMeetings: LinkedItem[];
  linkedPhotos: LinkedItem[];
}) {
  return (
    <div className="space-y-2">
      <LinkedContentRow
        label="Documents"
        icon={FileText}
        items={linkedDocuments}
      />
      <LinkedContentRow
        label="Drawings"
        icon={Ruler}
        items={linkedDrawings}
      />
      <LinkedContentRow
        label="Meetings"
        icon={CalendarDays}
        items={linkedMeetings}
      />
      <LinkedContentRow
        label="Photos"
        icon={ImageIcon}
        items={linkedPhotos}
      />
    </div>
  );
}
