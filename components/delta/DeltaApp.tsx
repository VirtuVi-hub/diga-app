"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, ShieldQuestion } from "lucide-react";
import { discussions as initialDiscussions } from "@/data/discussions";
import type { Discussion, Message } from "@/types/discussion";
import { ActionPanel } from "./ActionPanel";
import { EvolutionDetailPanel } from "./EvolutionDetailPanel";
import { ProjectEvolutionStrip } from "./ProjectEvolutionStrip";
import { ReviewWorkspace } from "./ReviewWorkspace";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Workspace } from "./Workspace";

const demoItems = [
  { label: "All Projects", icon: FolderKanban },
  { label: "Knowledge Review", icon: ShieldQuestion },
];

function withNewMessage(items: Discussion[], id: string, message: Message) {
  const target = items.find((item) => item.id === id);
  if (!target) return items;

  const updated: Discussion = { ...target, messages: [...target.messages, message] };
  return [updated, ...items.filter((item) => item.id !== id)];
}

export function DeltaApp({ initialActiveItem = "All Projects" }: { initialActiveItem?: string }) { const [activeItem, setActiveItem] = useState(initialActiveItem); const [theme, setTheme] = useState<"dark" | "light">("dark"); const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null); const [items, setItems] = useState<Discussion[]>(initialDiscussions); const router = useRouter(); const navigate = (item: string) => { setActiveItem(item); if (item === "Knowledge Review") router.push("/review"); }; const selectMilestone = (id: string) => setSelectedMilestone((current) => current === id ? null : id); const addDiscussion = (message: string) => { const now = new Date().toISOString(); const newDiscussion: Discussion = { id: `discussion-${Date.now()}`, title: "Project Question", type: "QRY", status: "open", summary: ["Delta is reviewing this request."], participants: [{ id: "maya-chen", name: "Maya Chen", initials: "MC", isInitiator: true }, { id: "delta", name: "Delta", initials: "Δ" }], topics: [], messages: [{ id: `discussion-${Date.now()}-m1`, author: "Maya Chen", role: "L Ar.", time: "Just now", text: message }], createdAt: now, updatedAt: now, lastActivityAt: now, linkedDocuments: [], linkedDrawings: [], linkedMeetings: [], linkedPhotos: [], relatedDiscussions: [] }; setItems((current) => [newDiscussion, ...current]); }; const replyToDiscussion = (id: string, text: string) => { setItems((current) => withNewMessage(current, id, { id: `${id}-m${Date.now()}`, author: "Maya Chen", role: "L Ar.", time: "Just now", text })); }; const isReview = activeItem === "Knowledge Review"; const center = isReview ? <ReviewWorkspace /> : selectedMilestone ? <EvolutionDetailPanel id={selectedMilestone} onClose={() => setSelectedMilestone(null)} /> : <Workspace projectId="demo" items={items} relationships={[]} onAddDiscussion={addDiscussion} onDraftRequested={() => {}} onReply={replyToDiscussion} />; return <div data-theme={theme} className="flex h-dvh min-h-[640px] overflow-hidden bg-surface-primary text-text-primary"><Sidebar items={demoItems} activeItem={activeItem} onNavigate={navigate} /><div className="flex min-w-0 flex-1 flex-col"><TopBar theme={theme} onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")} /><div className="flex min-h-0 flex-1 overflow-hidden">{isReview ? center : <><ProjectEvolutionStrip selectedId={selectedMilestone} onSelect={selectMilestone} /><main className="min-w-0 flex-1 overflow-y-auto">{center}</main><ActionPanel /></>}</div></div></div>; }
