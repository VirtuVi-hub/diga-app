import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { discussionRepository } from "@/lib/repositories/discussion-repository";
import type { CreateDiscussionInput, Discussion } from "@/types/discussion";
import type { RelationshipNodeRef } from "@/types/relationship";

export class DiscussionService {
  static async list(): Promise<Discussion[]> {
    return discussionRepository.list();
  }

  static async get(id: string): Promise<Discussion | null> {
    return discussionRepository.get(id);
  }

  static async create(input: CreateDiscussionInput): Promise<Discussion> {
    if (!input.title.trim()) {
      throw new Error("Title is required.");
    }

    const discussion = await discussionRepository.create(input);

    // `actor.id` is `null` here — same pre-existing gap this event has
    // always had (see the file history); Sprint 5.7 does add `projectId`
    // now that `Discussion` carries one.
    await publishSafely({
      eventType: EVENT_TYPES.DISCUSSION_CREATED,
      actor: { type: "person", id: null },
      sourceNode: { id: discussion.id, type: "discussion" },
      projectId: discussion.projectId,
      metadata: { title: discussion.title, discussionType: discussion.type, clauseRef: discussion.clauseRef },
    });

    return discussion;
  }

  static async listByAttachedTo(attachedTo: RelationshipNodeRef, projectId?: string): Promise<Discussion[]> {
    return discussionRepository.listByAttachedTo(attachedTo, projectId);
  }

  /**
   * Post-launch fix (stabilizing Sprint 5.8): the reply capability Clause
   * Discussions never had — "Start Discussion"/"Mark Resolved" existed,
   * but nothing in between. No Timeline entry is produced for an
   * individual reply (deliberately — Discussion Created/Resolved are the
   * significant lifecycle moments; a message-by-message Timeline would be
   * noise), matching how `resolve()` itself already treats a resolution
   * note as the significant, loggable moment.
   *
   * Sprint 5.9, Module 1: a reply DOES publish an Event now
   * (`DISCUSSION_REPLIED`), but with `visibility: "internal"` — reaches
   * the Notifications subscriber while still never appearing on the
   * Timeline (its `visibility === "project"` filter excludes it), so the
   * "no Timeline noise" decision above is preserved exactly.
   */
  static async addMessage(id: string, author: { id: string; name: string; role?: string }, text: string): Promise<Discussion> {
    if (!text.trim()) {
      throw new Error("A message cannot be empty.");
    }
    const discussion = await discussionRepository.addMessage(id, author, text.trim());

    await publishSafely({
      eventType: EVENT_TYPES.DISCUSSION_REPLIED,
      actor: { type: "person", id: author.id },
      sourceNode: { id: discussion.id, type: "discussion" },
      projectId: discussion.projectId,
      visibility: "internal",
      metadata: { title: discussion.title, clauseRef: discussion.clauseRef, authorName: author.name },
    });

    return discussion;
  }

  /** Sprint 5.7, Module 4: "Discussion Before Approval" — resolving is always available, resolving with or without a change is the human's call, made elsewhere (e.g. Agreement Review's Accept vs. Request Revision). */
  static async resolve(id: string, actorId: string | null, resolutionNote?: string): Promise<Discussion> {
    const discussion = await discussionRepository.resolve(id, resolutionNote);

    await publishSafely({
      eventType: EVENT_TYPES.DISCUSSION_RESOLVED,
      actor: { type: "person", id: actorId },
      sourceNode: { id: discussion.id, type: "discussion" },
      projectId: discussion.projectId,
      reason: resolutionNote,
      metadata: { title: discussion.title, clauseRef: discussion.clauseRef },
    });

    return discussion;
  }
}
