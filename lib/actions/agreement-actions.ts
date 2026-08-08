"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPerson } from "@/lib/auth/current-person";
import { uploadDocumentFile } from "@/lib/actions/upload-document-action";
import { getGovernanceRoster } from "@/lib/actions/governance-actions";
import { AgreementReviewService } from "@/lib/services/agreement-review-service";
import { EVENT_TYPES } from "@/lib/events/event-types";
import { publishSafely } from "@/lib/events/event-publisher";
import { requireAgreementRole, requireApprovalAuthority } from "@/lib/permissions/agreement-role";
import { matchClauseFromMessage } from "@/lib/services/clause-matching";

function displayName(person: { first_name: string; last_name: string }): string {
  return `${person.first_name} ${person.last_name}`.trim();
}

/** Module 1: Agreement upload is mandatory — this is the only path onto the collaborative workspace. Reuses the real Document Engine's upload pipeline (`uploadDocumentFile`) rather than building a parallel one; the caller must set `formData.documentType = "Agreement"`. */
export async function uploadInitialAgreement(formData: FormData) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to upload the Agreement.");

  const projectId = formData.get("projectId")?.toString();
  if (!projectId) throw new Error("Missing project.");

  await requireAgreementRole(projectId, ["lead_architect"], "Only the Lead Architect may upload the Agreement.");

  const result = await uploadDocumentFile(formData);

  await publishSafely({
    eventType: EVENT_TYPES.AGREEMENT_UPLOADED,
    actor: { type: "person", id: displayName(person) },
    sourceNode: { id: result.document.id, type: "document" },
    projectId,
  });

  revalidatePath(`/projects/${projectId}/agreement`);
  return result;
}

/** Module 2: Lead Architect uploads a revised Agreement. Same upload pipeline as the initial upload, this time with `documentId` set so it lands as a new `document_revisions` row rather than a new document. */
export async function uploadAgreementRevision(formData: FormData) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to upload a revision.");

  const projectId = formData.get("projectId")?.toString();
  const documentId = formData.get("documentId")?.toString();
  if (!projectId || !documentId) throw new Error("Missing project or document.");

  await requireAgreementRole(projectId, ["lead_architect"], "Only the Lead Architect may upload a revised Agreement.");

  const result = await uploadDocumentFile(formData);

  await publishSafely({
    eventType: EVENT_TYPES.AGREEMENT_REVISION_UPLOADED,
    actor: { type: "person", id: displayName(person) },
    sourceNode: { id: documentId, type: "document" },
    projectId,
    metadata: { title: "revision" in result.document ? result.document.revision : result.document.current_revision },
  });

  revalidatePath(`/projects/${projectId}/agreement`);
  return result;
}

export async function acceptAgreement(projectId: string, documentId: string) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to accept the Agreement.");

  await AgreementReviewService.acceptAgreement(projectId, documentId, person.id, displayName(person));
  revalidatePath(`/projects/${projectId}/agreement`);
  revalidatePath(`/projects/${projectId}/setup`);
}

/** Delta query support (Module 18): the current Agreement document, if one has been uploaded. Kept as a thin action wrapper — never import `AgreementReviewService` directly from a module that might be pulled into a client bundle (the documented Sprint 5.4 client-bundle-leak lesson). */
export async function getCurrentAgreementDocument(projectId: string) {
  return AgreementReviewService.getCurrentAgreement(projectId);
}

export async function requestAgreementRevision(projectId: string, documentId: string, reason: string) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("You must be signed in to request a revision.");

  await requireApprovalAuthority(projectId, "Only the Main Client (or their delegated authority) may request a revision.");

  await AgreementReviewService.requestRevision(projectId, documentId, displayName(person), reason);
  revalidatePath(`/projects/${projectId}/agreement`);
}

/**
 * Post-launch fix: the composer used to require the client to type a
 * Clause Number and a Title before they could ask a question — most
 * clients don't know clause numbers, and shouldn't have to classify their
 * own discussion. Delta now determines the destination itself
 * (`matchClauseFromMessage()`, server-side — the client never gets to
 * assert its own classification): a message that names a clause/section
 * explicitly attaches to that clause; anything else attaches to the
 * Agreement as a whole rather than being guessed onto the wrong clause.
 */
export async function openAgreementClauseDiscussion(params: { projectId: string; documentId: string; initialMessage: string }) {
  const viewer = await requireAgreementRole(params.projectId, ["lead_architect", "main_client"], "You must be the Lead Architect or the Main Client to open a discussion on this Agreement.");

  const match = matchClauseFromMessage(params.initialMessage);
  const title = match.confidence === "high" ? `Clause ${match.clauseRef}` : "Agreement Discussion";

  const discussion = await AgreementReviewService.openClauseDiscussion({
    projectId: params.projectId,
    documentId: params.documentId,
    clauseRef: match.clauseRef ?? undefined,
    title,
    initialMessage: params.initialMessage,
    initiator: { id: viewer.personId, name: viewer.personName, role: viewer.role === "lead_architect" ? "Lead Architect" : "Main Client" },
  });
  revalidatePath(`/projects/${params.projectId}/agreement`);
  return discussion;
}

/** Post-launch fix (stabilizing Sprint 5.8): the missing reply action — "Start Discussion" and "Mark Resolved" existed with nothing in between, so neither party could actually converse. */
export async function replyToAgreementClauseDiscussion(discussionId: string, projectId: string, text: string) {
  const viewer = await requireAgreementRole(projectId, ["lead_architect", "main_client"], "You must be the Lead Architect or the Main Client to reply to this discussion.");

  const discussion = await AgreementReviewService.replyToClauseDiscussion(
    discussionId,
    { id: viewer.personId, name: viewer.personName, role: viewer.role === "lead_architect" ? "Lead Architect" : "Main Client" },
    text,
  );
  revalidatePath(`/projects/${projectId}/agreement`);
  return discussion;
}

export async function resolveAgreementClauseDiscussion(discussionId: string, projectId: string, resolutionNote?: string) {
  const viewer = await requireAgreementRole(projectId, ["lead_architect", "main_client"], "You must be the Lead Architect or the Main Client to resolve this discussion.");
  const discussion = await AgreementReviewService.resolveClauseDiscussion(discussionId, viewer.personId, resolutionNote);
  revalidatePath(`/projects/${projectId}/agreement`);
  return discussion;
}

/**
 * Everything the Agreement Review screen needs in one call: the current
 * Agreement document, its clause Discussions, and who is required to
 * approve it (Module 11's Governance Roster — always Main Client for
 * `object_type = 'agreement'`, per the seeded governance rule).
 */
export async function getAgreementReviewContext(projectId: string) {
  const person = await getCurrentPerson();
  const agreement = await AgreementReviewService.getCurrentAgreement(projectId);

  const [discussions, roster] = await Promise.all([
    agreement ? AgreementReviewService.getClauseDiscussions(projectId, agreement.id) : Promise.resolve([]),
    person && agreement
      ? getGovernanceRoster({
          projectId,
          objectType: "agreement",
          creatorPersonId: person.id,
          creatorPersonName: displayName(person),
          node: { id: agreement.id, type: "document" },
          text: agreement.name,
        })
      : Promise.resolve(null),
  ]);

  return { agreement, discussions, roster };
}
