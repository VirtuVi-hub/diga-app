import {
  CalendarDays,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  MessagesSquare,
  Ruler,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { knowledgeObjectTypeConfig } from "@/lib/knowledge-object-types";
import type { RelationshipNodeType, RelationshipType } from "@/types/relationship";

/** Node types that can appear as Evidence, in display order. */
export const evidenceNodeTypeOrder: RelationshipNodeType[] = [
  "discussion",
  "meeting",
  "drawing",
  "document",
  "photo",
  "video",
  "reference",
];

/** Node types that can appear as an Impact, in display order. */
export const impactNodeTypeOrder: RelationshipNodeType[] = [
  "requirement",
  "decision",
  "action",
  "issue",
  "risk",
  "drawing",
  "document",
  "meeting",
];

export const relationshipNodeTypeConfig: Record<RelationshipNodeType, { label: string; pluralLabel: string; icon: LucideIcon }> = {
  ...knowledgeObjectTypeConfig,
  discussion: { label: "Discussion", pluralLabel: "Discussions", icon: MessagesSquare },
  meeting: { label: "Meeting", pluralLabel: "Meetings", icon: CalendarDays },
  drawing: { label: "Drawing", pluralLabel: "Drawings", icon: Ruler },
  document: { label: "Document", pluralLabel: "Documents", icon: FileText },
  photo: { label: "Photo", pluralLabel: "Photos", icon: ImageIcon },
  video: { label: "Video", pluralLabel: "Videos", icon: Video },
  reference: { label: "Reference", pluralLabel: "References", icon: LinkIcon },
};

export const relationshipTypeLabels: Record<RelationshipType, string> = {
  evidence: "Evidence",
  impact: "Impact",
  related: "Related",
};
