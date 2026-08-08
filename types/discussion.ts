import type { DiscussionTypeCode } from "@/lib/discussion-types";
import type { RelationshipNodeRef } from "@/types/relationship";

export type DiscussionStatus = "open" | "resolved" | "archived";

export type Participant = {
  id: string;
  name: string;
  initials: string;
  isInitiator?: boolean;
};

export type Message = {
  id: string;
  author: string;
  role: string;
  text: string;
  time: string;
};

export type Topic = {
  id: string;
  label: string;
};

export type LinkedItem = {
  id: string;
  title: string;
};

export type Discussion = {
  id: string;
  title: string;
  type: DiscussionTypeCode;
  summary: string[];
  participants: Participant[];
  topics: Topic[];
  status: DiscussionStatus;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  linkedDocuments: LinkedItem[];
  linkedDrawings: LinkedItem[];
  linkedMeetings: LinkedItem[];
  linkedPhotos: LinkedItem[];
  relatedDiscussions: string[];
  /** Sprint 5.7: which project this Discussion belongs to. Optional — a pre-existing gap, not every Discussion is project-scoped yet. */
  projectId?: string;
  /** Sprint 5.7, Module 2: the object this Discussion is a conversation about (e.g. an Agreement document). Reuses the generic graph node reference, not a new pointer type. */
  attachedTo?: RelationshipNodeRef;
  /** Sprint 5.7, Module 2: a manually entered clause label (e.g. "2.2"). No automatic clause parsing exists — carried forward across document versions by string match. */
  clauseRef?: string;
};

export type CreateDiscussionInput = {
  title: string;
  type: DiscussionTypeCode;
  summary: string[];
  projectId?: string;
  attachedTo?: RelationshipNodeRef;
  clauseRef?: string;
  /**
   * Post-launch fix (stabilizing Sprint 5.8): the real signed-in person
   * opening this discussion. Optional and additive — every pre-existing
   * caller that doesn't pass one keeps today's exact behavior
   * (`MockDiscussionRepository`'s own fixed demo participants), so this
   * doesn't touch the Journal/Requirement/Onboarding discussion flows this
   * fix wasn't asked to change. Only `AgreementReviewService.openClauseDiscussion()`
   * passes one, so real clause discussions show the real person who opened
   * them instead of a hardcoded demo name.
   */
  initiator?: { id: string; name: string; role?: string };
};
