import { discussions as seedDiscussions } from "@/data/discussions";
import type { CreateDiscussionInput, Discussion, Message } from "@/types/discussion";
import type { RelationshipNodeRef } from "@/types/relationship";

export interface DiscussionRepository {
  list(): Promise<Discussion[]>;
  get(id: string): Promise<Discussion | null>;
  create(input: CreateDiscussionInput): Promise<Discussion>;
  /** Sprint 5.7, Module 2: Discussions attached to a specific object (e.g. an Agreement document), optionally scoped to a project. */
  listByAttachedTo(attachedTo: RelationshipNodeRef, projectId?: string): Promise<Discussion[]>;
  /** Sprint 5.7, Module 4: "Discussion Before Approval" — a Discussion resolving without changing anything vs. requiring a revision. */
  resolve(id: string, resolutionNote?: string): Promise<Discussion>;
  /** Post-launch fix (stabilizing Sprint 5.8): a real reply, appended to `messages` — the capability the Agreement Clause Discussion UI was missing entirely (only "open" and "resolve" existed; there was no way for either party to actually converse). */
  addMessage(id: string, author: { id: string; name: string; role?: string }, text: string): Promise<Discussion>;
}

/**
 * Post-launch fix (stabilizing Sprint 5.8): this store previously lived as
 * a plain module-level `let`, which Next.js dev mode (Turbopack Fast
 * Refresh) can silently reinitialize whenever any file in this module's
 * dependency graph hot-reloads — not just edits to this file itself. In a
 * single-page demo that was invisible; in the first real two-session
 * verification (a Lead Architect and a Main Client on separate devices,
 * over a live dev session with ongoing edits elsewhere in the app) it
 * reproduced exactly as reported: a discussion created moments earlier
 * would vanish for both parties after any unrelated hot reload. Pinning
 * the store on `globalThis` (the same pattern Next.js's own docs recommend
 * for dev-mode singletons, e.g. a cached Prisma client) makes it survive
 * Fast Refresh for the life of the running dev server process. This does
 * NOT make it survive a real process restart or a production deploy — it
 * is still an in-memory mock repository, the same documented, accepted
 * limitation every prior sprint's docs have named for Discussions,
 * Knowledge Objects, Events, Recommendations, Drawings, and Revisions
 * alike. Fixing that for real (a `discussions` Supabase table) is a
 * genuinely larger, cross-cutting change affecting every consumer of
 * Discussions, not a bug fix scoped to the Agreement workflow this pass is
 * stabilizing — out of scope here, called out explicitly rather than
 * silently left unfixed.
 */
type DiscussionStoreGlobal = typeof globalThis & {
  __deltaDiscussionStore?: Discussion[];
  __deltaDiscussionSequence?: number;
};

const globalForStore = globalThis as DiscussionStoreGlobal;

if (!globalForStore.__deltaDiscussionStore) {
  globalForStore.__deltaDiscussionStore = [...seedDiscussions];
  globalForStore.__deltaDiscussionSequence = 0;
}

function getStore(): Discussion[] {
  return globalForStore.__deltaDiscussionStore!;
}

function setStore(next: Discussion[]): void {
  globalForStore.__deltaDiscussionStore = next;
}

function nextId(prefix: string): string {
  globalForStore.__deltaDiscussionSequence = (globalForStore.__deltaDiscussionSequence ?? 0) + 1;
  return `${prefix}-${Date.now()}-${globalForStore.__deltaDiscussionSequence}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export class MockDiscussionRepository implements DiscussionRepository {
  async list(): Promise<Discussion[]> {
    return getStore();
  }

  async get(id: string): Promise<Discussion | null> {
    return getStore().find((item) => item.id === id) ?? null;
  }

  async create(input: CreateDiscussionInput): Promise<Discussion> {
    const now = new Date().toISOString();

    const participants = input.initiator
      ? [{ id: input.initiator.id, name: input.initiator.name, initials: initials(input.initiator.name), isInitiator: true }]
      : [
          { id: "maya-chen", name: "Maya Chen", initials: "MC", isInitiator: true },
          { id: "delta", name: "Delta", initials: "Δ" },
        ];

    const discussion: Discussion = {
      id: nextId("discussion"),
      title: input.title,
      type: input.type,
      summary: input.summary,
      participants,
      topics: [],
      status: "open",
      messages: [],
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      linkedDocuments: [],
      linkedDrawings: [],
      linkedMeetings: [],
      linkedPhotos: [],
      relatedDiscussions: [],
      projectId: input.projectId,
      attachedTo: input.attachedTo,
      clauseRef: input.clauseRef,
    };

    setStore([discussion, ...getStore()]);
    return discussion;
  }

  async listByAttachedTo(attachedTo: RelationshipNodeRef, projectId?: string): Promise<Discussion[]> {
    return getStore().filter(
      (item) =>
        item.attachedTo?.id === attachedTo.id &&
        item.attachedTo?.type === attachedTo.type &&
        (!projectId || item.projectId === projectId),
    );
  }

  async resolve(id: string, resolutionNote?: string): Promise<Discussion> {
    const existing = getStore().find((item) => item.id === id);
    if (!existing) {
      throw new Error(`Discussion "${id}" was not found.`);
    }

    const now = new Date().toISOString();
    const resolved: Discussion = {
      ...existing,
      status: "resolved",
      updatedAt: now,
      lastActivityAt: now,
      summary: resolutionNote ? [...existing.summary, resolutionNote] : existing.summary,
    };

    setStore(getStore().map((item) => (item.id === id ? resolved : item)));
    return resolved;
  }

  async addMessage(id: string, author: { id: string; name: string; role?: string }, text: string): Promise<Discussion> {
    const existing = getStore().find((item) => item.id === id);
    if (!existing) {
      throw new Error(`Discussion "${id}" was not found.`);
    }

    const now = new Date().toISOString();
    const message: Message = { id: nextId(`${id}-m`), author: author.name, role: author.role ?? "", text, time: now };

    const alreadyParticipant = existing.participants.some((participant) => participant.id === author.id);
    const participants = alreadyParticipant
      ? existing.participants
      : [...existing.participants, { id: author.id, name: author.name, initials: initials(author.name) }];

    const updated: Discussion = {
      ...existing,
      messages: [...existing.messages, message],
      participants,
      updatedAt: now,
      lastActivityAt: now,
    };

    setStore(getStore().map((item) => (item.id === id ? updated : item)));
    return updated;
  }
}

export const discussionRepository: DiscussionRepository = new MockDiscussionRepository();
