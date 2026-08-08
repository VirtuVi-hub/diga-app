import { getKnowledgeObject } from "@/lib/actions/knowledge-object-actions";
import { getGovernanceRoster } from "@/lib/actions/governance-actions";
import { listProjectDelegations } from "@/lib/actions/delegation-actions";
import { resolveKnowledgeObjectIdForContext } from "@/lib/knowledge-validation/approval-query";
import { getCurrentAgreementDocument, getAgreementReviewContext } from "@/lib/actions/agreement-actions";
import { getDocumentRevisionComparison } from "@/lib/actions/document-revision-actions";
import type { DeltaRelatedResult } from "@/lib/intelligence-engine/delta-query-resolver";
import type { ComprehensionContextInput } from "@/types/comprehension";
import type { Evidence } from "@/types/evidence";

/**
 * Sprint 5.7, Module 18: Delta Questions. Structurally mirrors
 * `onboarding-query.ts`/`revision-query.ts`: a small, anchored keyword
 * match, checked before Comprehension runs, answered entirely from data
 * already built this sprint (Governance Roster, Delegations, Document
 * Revision Intelligence) — never a new intelligence pipeline.
 */
export type GovernanceQueryKind =
  | "who_needs_to_approve"
  | "who_has_delegated_authority"
  | "why_is_this_waiting"
  | "what_changed_in_agreement"
  | "which_clause_changed"
  | "why_was_new_version_uploaded"
  | "who_has_been_notified";

export function detectGovernanceQuestion(text: string): GovernanceQueryKind | null {
  const normalized = text.toLowerCase().trim();

  if (/\bwho (still )?needs? to approve\b/.test(normalized)) return "who_needs_to_approve";
  if (/\bwho has delegated authority\b/.test(normalized)) return "who_has_delegated_authority";
  if (/\bwhy is this waiting\b/.test(normalized)) return "why_is_this_waiting";
  if (/\bwhich clause changed\b/.test(normalized)) return "which_clause_changed";
  if (/\bwhy was (version|v)\s*\d*\s*uploaded\b/.test(normalized)) return "why_was_new_version_uploaded";
  if (/\bwhat changed in (the |this )?agreement\b/.test(normalized)) return "what_changed_in_agreement";
  if (/\bwho has been notified\b/.test(normalized)) return "who_has_been_notified";

  return null;
}

function toEvidence(id: string, title: string, excerpt: string): Evidence {
  return { id, title, type: "Governance", relationship: "related", relevance: 1, confidence: 1, excerpt };
}

function emptyResult(heading: string, conclusion: string): DeltaRelatedResult {
  return { kind: "related", heading, evidence: [], reasoning: { found: [], missing: [], conclusion }, confidence: "none" };
}

/**
 * Sprint 5.7 fix (found via this sprint's own live testing): when no
 * Knowledge Object is resolvable from context (asked from the Journal
 * with no discussion in scope, or from the Agreement Review page itself,
 * which has no `knowledgeObjectId`/`discussionId` of its own), these
 * questions used to give up honestly-but-uselessly with "no specific item
 * in context." Since the Agreement is this sprint's own flagship
 * governance workflow, falls back to its roster — reusing
 * `getAgreementReviewContext()` verbatim (the same call
 * `app/projects/[id]/agreement/page.tsx` itself makes) rather than a
 * second roster computation. Still an honest empty result when neither a
 * Knowledge Object nor an Agreement exists yet.
 */
async function answerObjectGovernanceQuestion(projectId: string, kind: "who_needs_to_approve" | "why_is_this_waiting" | "who_has_been_notified", context?: ComprehensionContextInput): Promise<DeltaRelatedResult> {
  const objectId = await resolveKnowledgeObjectIdForContext(context ?? {});
  const object = objectId ? await getKnowledgeObject(objectId) : null;

  const roster = object
    ? await getGovernanceRoster({
        projectId,
        objectType: object.type,
        creatorPersonId: object.revisions[0]?.createdBy ?? "Unknown",
        creatorPersonName: object.revisions[0]?.createdBy ?? "Unknown",
        node: { id: object.id, type: object.type },
        text: `${object.title} ${object.description}`,
      })
    : (await getAgreementReviewContext(projectId)).roster;

  if (!roster) {
    return emptyResult("Governance", "No specific item is in context to check governance for.");
  }

  if (kind === "who_has_been_notified") {
    const evidence = roster.mandatoryNotify.map((entry) => toEvidence(entry.roleId, entry.personName ?? entry.roleName, `${entry.roleName} — recorded, no delivery mechanism yet.`));
    return {
      kind: "related",
      heading: "Who Has Been Notified",
      evidence,
      reasoning: { found: evidence.map((item) => `✓ ${item.title}`), missing: [], conclusion: evidence.length ? `${evidence.length} mandatory notification(s) recorded.` : "No mandatory notifications for this item." },
      confidence: evidence.length ? "medium" : "high",
    };
  }

  const evidence = roster.requiredApprovers.map((entry) =>
    toEvidence(entry.roleId, `${entry.roleName}: ${entry.personName ?? "Not yet assigned"}`, entry.delegatedFrom ? `Delegated from ${entry.delegatedFrom.personName}.` : ""),
  );

  return {
    kind: "related",
    heading: kind === "why_is_this_waiting" ? "Why This Is Waiting" : "Who Still Needs To Approve",
    evidence,
    reasoning: { found: evidence.map((item) => `✓ ${item.title}`), missing: [], conclusion: evidence.length ? `${evidence.length} required approver(s).` : "No approvers are required for this item." },
    confidence: evidence.length ? "medium" : "high",
  };
}

async function answerDelegationQuestion(projectId: string): Promise<DeltaRelatedResult> {
  const delegations = (await listProjectDelegations(projectId)).filter((delegation) => delegation.status === "active");
  const evidence = delegations.map((delegation) => toEvidence(delegation.id, `${delegation.original_authority_person_name ?? "Unknown"} → ${delegation.delegate_person_name ?? "Unknown"}`, delegation.reason));

  return {
    kind: "related",
    heading: "Delegated Authority",
    evidence,
    reasoning: { found: evidence.map((item) => `✓ ${item.title}`), missing: [], conclusion: evidence.length ? `${evidence.length} active delegation(s).` : "No active delegations on this project." },
    confidence: evidence.length ? "medium" : "high",
  };
}

async function answerAgreementChangeQuestion(projectId: string, kind: "which_clause_changed" | "why_was_new_version_uploaded" | "what_changed_in_agreement"): Promise<DeltaRelatedResult> {
  const agreement = await getCurrentAgreementDocument(projectId);
  if (!agreement) {
    return emptyResult("Agreement Changes", "No Agreement has been uploaded yet.");
  }

  const comparison = await getDocumentRevisionComparison(agreement.id);
  if (!comparison) {
    return emptyResult("Agreement Changes", "Only one version of the Agreement exists — nothing to compare yet.");
  }

  const evidence = comparison.clauseDiscussionsSinceLastVersion.map((discussion) => toEvidence(discussion.id, discussion.clauseRef ? `Clause ${discussion.clauseRef}` : discussion.title, discussion.summary[0] ?? ""));

  const heading = kind === "which_clause_changed" ? "Which Clause Changed" : kind === "why_was_new_version_uploaded" ? "Why A New Version Was Uploaded" : "What Changed In This Agreement";

  return {
    kind: "related",
    heading,
    evidence,
    reasoning: {
      found: evidence.map((item) => `✓ ${item.title}`),
      missing: [],
      conclusion: evidence.length > 0 ? comparison.analyzerNote : comparison.changed ? comparison.analyzerNote : "The file content appears unchanged from the previous version.",
    },
    confidence: evidence.length ? "medium" : "low",
  };
}

export async function answerGovernanceQuestion(projectId: string, kind: GovernanceQueryKind, context?: ComprehensionContextInput): Promise<DeltaRelatedResult> {
  if (kind === "who_needs_to_approve" || kind === "why_is_this_waiting" || kind === "who_has_been_notified") {
    return answerObjectGovernanceQuestion(projectId, kind, context);
  }

  if (kind === "who_has_delegated_authority") {
    return answerDelegationQuestion(projectId);
  }

  return answerAgreementChangeQuestion(projectId, kind);
}
