"use server";

import { getCurrentPerson } from "@/lib/auth/current-person";
import { findMatchingDiscussion, findMatchingDiscussionForMessage } from "@/lib/services/discussion-matching";
import { DiscussionService } from "@/lib/services/discussion-service";
import type { CreateDiscussionInput } from "@/types/discussion";
import type { RelationshipNodeRef } from "@/types/relationship";

export async function getDiscussions() {
  return DiscussionService.list();
}

export async function getDiscussion(id: string) {
  return DiscussionService.get(id);
}

/**
 * Post-launch fix: this always used to accept `input.initiator` as
 * optional and, when absent, fall through to the repository's own fixed
 * demo participant ("Maya Chen") — never the real signed-in person. That
 * silent fallback is also what let the Project Journal's "Ask Delta about
 * this project..." composer (`HomeWorkspace.tsx`) ship a fake, entirely
 * client-only Discussion-creation path that never called this action at
 * all (confirmed live: the discussion vanished on reload for the creator
 * themselves, and never reached the other party — the reported "Main
 * Client starts a discussion, Lead Architect never sees it" bug). Now
 * resolves the real signed-in person server-side — the client never gets
 * to assert its own identity — for every caller of this action, not just
 * Agreement Clause Discussions.
 */
export async function createDiscussion(input: Omit<CreateDiscussionInput, "initiator">) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to start a discussion.");

  return DiscussionService.create({
    ...input,
    initiator: { id: person.id, name: `${person.first_name} ${person.last_name}`.trim() },
  });
}

/** Post-launch fix: the generic reply capability the Journal and Discussion Detail pages never had — both previously appended a reply to local React state only, authored as a hardcoded "Maya Chen", never persisted. Mirrors `replyToAgreementClauseDiscussion()`'s real-action pattern. */
export async function replyToDiscussion(discussionId: string, text: string) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to reply.");

  return DiscussionService.addMessage(discussionId, { id: person.id, name: `${person.first_name} ${person.last_name}`.trim() }, text);
}

export async function matchDiscussionForRequirement(input: { title: string; description: string }) {
  const discussions = await DiscussionService.list();
  return findMatchingDiscussion(discussions, input);
}

export async function matchDiscussionForMessage(input: { text: string; entities: string[] }) {
  const discussions = await DiscussionService.list();
  return findMatchingDiscussionForMessage(discussions, input);
}

/** Sprint 5.7, Module 2: clause/document-attached Discussions (e.g. all discussions opened against an Agreement). */
export async function getDiscussionsByAttachedTo(attachedTo: RelationshipNodeRef, projectId?: string) {
  return DiscussionService.listByAttachedTo(attachedTo, projectId);
}

/** Sprint 5.7, Module 4: "Discussion Before Approval" — resolving is always available; whether resolving implies acceptance or a revision is the caller's decision. */
export async function resolveDiscussion(id: string, resolutionNote?: string) {
  const person = await getCurrentPerson();
  return DiscussionService.resolve(id, person?.id ?? null, resolutionNote);
}
