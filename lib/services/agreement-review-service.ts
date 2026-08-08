import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { DiscussionService } from "@/lib/services/discussion-service";
import { DocumentRepository } from "@/lib/repositories/document-repository";
import { DelegationRepository } from "@/lib/repositories/delegation-repository";
import { ProjectGovernanceRepository } from "@/lib/repositories/project-governance-repository";
import { canActOnBehalfOf } from "@/lib/governance/authority";
import type { Discussion } from "@/types/discussion";
import type { DocumentListItem } from "@/lib/types/document";

/**
 * Sprint 5.7, Module 1-2: Agreement Review. Deliberately has NO new "state"
 * table — whether the Agreement is accepted is a pure projection over the
 * current `document_revisions` row (real, already exists) plus
 * `agreement.accepted.v1` events in the Event Log, the same "pure
 * aggregation, no new store" pattern `computeApprovalRoster()` already
 * established. Actions here are only meant to be surfaced by the UI while
 * `projects.lifecycle_stage === 'agreement_review'`; a later Agreement
 * amendment (post-Active) is still possible via `uploadRevision()` but
 * does not reopen formal review — a documented scope boundary (Module 1
 * says nothing about re-review after activation), not a gap.
 */
export class AgreementReviewService {
  /**
   * Module 1: "Accept Agreement." Gated so only the Main Client — or their
   * currently active delegate (Module 9) — may accept. There is
   * deliberately no "Reject" path anywhere in this class; disagreement
   * flows through `requestRevision()`/clause Discussions instead (Module 4).
   */
  static async acceptAgreement(projectId: string, documentId: string, actorId: string, actorName: string): Promise<void> {
    const info = await ProjectGovernanceRepository.get(projectId);
    const delegations = await DelegationRepository.listByProject(projectId);

    if (!canActOnBehalfOf(actorId, info.mainClientPersonId, delegations)) {
      throw new Error("Only the Main Client (or their delegated authority) may accept the Agreement.");
    }

    const activeDelegation = delegations.find(
      (delegation) => delegation.original_authority_person_id === info.mainClientPersonId && delegation.delegate_person_id === actorId && delegation.status === "active",
    );

    await publishSafely({
      eventType: EVENT_TYPES.AGREEMENT_ACCEPTED,
      actor: { type: "person", id: actorName },
      sourceNode: { id: documentId, type: "document" },
      projectId,
      metadata: activeDelegation
        ? { delegationId: activeDelegation.id, originalAuthorityPersonName: info.mainClientPersonName, delegationReason: activeDelegation.reason }
        : {},
    });

    await ProjectGovernanceRepository.setLifecycleStage(projectId, "agreement_accepted");
  }

  /** Module 1: "Request Revision" — one of the three review actions, never a rejection. */
  static async requestRevision(projectId: string, documentId: string, actorName: string, reason: string): Promise<void> {
    await publishSafely({
      eventType: EVENT_TYPES.AGREEMENT_REVISION_REQUESTED,
      actor: { type: "person", id: actorName },
      sourceNode: { id: documentId, type: "document" },
      projectId,
      reason,
    });
  }

  /** Module 2 (post-launch fix): clause-attached Discussion when Delta's own classification (`matchClauseFromMessage()`, called by the action layer) is confident; otherwise a general Agreement-level Discussion (`clauseRef` omitted, still attached to the Agreement document itself). */
  static async openClauseDiscussion(params: { projectId: string; documentId: string; clauseRef?: string; title: string; initialMessage: string; initiator: { id: string; name: string; role?: string } }): Promise<Discussion> {
    return DiscussionService.create({
      title: params.title,
      type: "AGR",
      summary: [params.initialMessage],
      projectId: params.projectId,
      attachedTo: { id: params.documentId, type: "document" },
      clauseRef: params.clauseRef,
      initiator: params.initiator,
    });
  }

  /** Post-launch fix (stabilizing Sprint 5.8): the missing reply capability — see `DiscussionService.addMessage()`. */
  static async replyToClauseDiscussion(discussionId: string, author: { id: string; name: string; role?: string }, text: string): Promise<Discussion> {
    return DiscussionService.addMessage(discussionId, author, text);
  }

  static async resolveClauseDiscussion(discussionId: string, actorId: string | null, resolutionNote?: string): Promise<Discussion> {
    return DiscussionService.resolve(discussionId, actorId, resolutionNote);
  }

  static async getClauseDiscussions(projectId: string, documentId: string): Promise<Discussion[]> {
    return DiscussionService.listByAttachedTo({ id: documentId, type: "document" }, projectId);
  }

  /** The current Agreement document for a project, if one has been uploaded — null is honest ("no Agreement yet"), never fabricated. */
  static async getCurrentAgreement(projectId: string): Promise<DocumentListItem | null> {
    const documents = await DocumentRepository.list(projectId);
    return documents.find((doc) => doc.document_type_name === "Agreement") ?? null;
  }
}
