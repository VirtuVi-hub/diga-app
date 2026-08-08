import { deltaComprehensionService } from "@/lib/comprehension/delta-comprehension-service";
import { getDiscussion } from "@/lib/actions/discussion-actions";
import { getDrawing } from "@/lib/actions/drawing-actions";
import { getKnowledgeObject } from "@/lib/actions/knowledge-object-actions";
import { getRecommendations } from "@/lib/actions/recommendation-actions";
import { getImpactsForNode, queryRelationships } from "@/lib/actions/relationship-actions";
import { getProjectSetupGaps } from "@/lib/project-setup/setup-gaps";
import { EVENT_TYPES } from "@/lib/events/event-types";
import { confidenceScorer } from "@/lib/intelligence-engine/confidence-scorer";
import { evidenceEngine } from "@/lib/intelligence-engine/evidence-engine";
import { reasoningEngine } from "@/lib/intelligence-engine/reasoning-engine";
import { knowledgeObjectTypeConfig } from "@/lib/knowledge-object-types";
import { suggestReviewers } from "@/lib/knowledge-validation/suggested-reviewers";
import { relationshipNodeTypeConfig } from "@/lib/relationship-types";
import { isSameRelationshipNode, KNOWLEDGE_OBJECT_NODE_TYPES } from "@/lib/relationship-utils";
import { RECOMMENDATION_TYPES } from "./recommendation-types";
import type { ExtractedEntity } from "@/types/comprehension";
import type { Event } from "@/types/event";
import type { Evidence } from "@/types/evidence";
import type { ContextScope } from "@/types/intelligence-engine";
import type { CreateRecommendationInput } from "@/types/recommendation";
import type { RelationshipNodeRef } from "@/types/relationship";

/**
 * A rule inspects one Event and decides whether it's worth recommending
 * something. Each rule is independent, cheap to skip (checks `eventType`
 * first), and produces only real, evidence-backed content — never a
 * fabricated claim. Matches the interface + implementation pattern every
 * other engine module in this codebase follows, applied to a list of small
 * rules instead of one class.
 */
export interface RecommendationRule {
  id: string;
  evaluate(event: Event): Promise<CreateRecommendationInput | null>;
}

function reviewerEvidence(reviewers: Awaited<ReturnType<typeof suggestReviewers>>): Evidence[] {
  return reviewers.map((reviewer) => ({
    id: reviewer.id,
    title: reviewer.name,
    type: "Person",
    relationship: "related",
    relevance: 1,
    confidence: 1,
    excerpt: reviewer.reason,
  }));
}

/**
 * Rule 1: Knowledge approved → recommend notifying impacted reviewers.
 * Evidence = the object's own real Impact relationships + the same
 * `suggestReviewers()` the Knowledge Validation Panel (Sprint 4.7) uses.
 */
const notifyReviewersRule: RecommendationRule = {
  id: "approval-granted-notify-reviewers",
  async evaluate(event) {
    if (event.eventType !== EVENT_TYPES.APPROVAL_GRANTED || !event.sourceNode) return null;

    const object = await getKnowledgeObject(event.sourceNode.id);
    if (!object) return null;

    const [impactRelationships, reviewers] = await Promise.all([getImpactsForNode(event.sourceNode), suggestReviewers(object)]);
    if (impactRelationships.length === 0 && reviewers.length === 0) return null;

    const impactEvidence: Evidence[] = impactRelationships.map((relationship) => ({
      id: relationship.nodeB.id,
      title: relationship.nodeB.label,
      type: relationshipNodeTypeConfig[relationship.nodeB.type].label,
      relationship: "impact",
      relevance: 1,
      confidence: 1,
    }));
    const evidence = [...impactEvidence, ...reviewerEvidence(reviewers)];

    return {
      projectId: object.projectId,
      recommendationType: RECOMMENDATION_TYPES.NOTIFY_REVIEWERS,
      title: `Notify reviewers about "${object.title}"`,
      description: `"${object.title}" was just approved. ${impactRelationships.length} linked item(s) and ${reviewers.length} reviewer(s) may need to be informed.`,
      confidence: impactRelationships.length > 0 && reviewers.length > 0 ? "high" : "medium",
      reasoning: {
        found: evidence.map((item) => `✓ ${item.type} "${item.title}"${item.excerpt ? ` — ${item.excerpt}` : " is linked as an impact."}`),
        missing: [],
        conclusion: `Approval affects ${impactRelationships.length} linked item(s); ${reviewers.length} reviewer(s) identified.`,
      },
      evidence,
      relatedNodes: [event.sourceNode, ...impactRelationships.map((relationship): RelationshipNodeRef => ({ id: relationship.nodeB.id, type: relationship.nodeB.type }))],
      sourceEvent: { id: event.id, eventType: event.eventType },
    };
  },
};

/**
 * Rule 2: Relationship added → recommend reviewing affected Knowledge. Only
 * fires when at least one side of the new relationship is a real Knowledge
 * Object — `Event.sourceNode`/`targetNode` carry no label, and there is no
 * lookup service for Meeting/Drawing/Document/Photo/Video/Reference node
 * types (they only ever exist as denormalized labels on `Relationship`
 * records), so a title can only be honestly resolved for this case.
 */
const reviewAffectedKnowledgeRule: RecommendationRule = {
  id: "relationship-created-review-affected",
  async evaluate(event) {
    if (event.eventType !== EVENT_TYPES.RELATIONSHIP_CREATED || !event.sourceNode || !event.targetNode) return null;

    const koRefs = [event.sourceNode, event.targetNode].filter((node) => KNOWLEDGE_OBJECT_NODE_TYPES.has(node.type));
    if (koRefs.length === 0) return null;

    const objects = (await Promise.all(koRefs.map((ref) => getKnowledgeObject(ref.id)))).filter((object) => object !== null);
    if (objects.length === 0) return null;

    const relationshipType = typeof event.metadata?.relationshipType === "string" ? event.metadata.relationshipType : "related";
    const evidence: Evidence[] = objects.map((object) => ({
      id: object.id,
      title: object.title,
      type: knowledgeObjectTypeConfig[object.type].label,
      relationship: "related",
      relevance: 1,
      confidence: 1,
    }));

    return {
      projectId: objects[0].projectId,
      recommendationType: RECOMMENDATION_TYPES.REVIEW_AFFECTED_KNOWLEDGE,
      title: objects.length === 1 ? `Review "${objects[0].title}"` : `Review ${objects.length} affected Knowledge items`,
      description: `A new ${relationshipType} relationship was added, connecting ${objects.map((object) => `"${object.title}"`).join(" and ")}. Consider reviewing whether this changes anything.`,
      confidence: "medium",
      reasoning: {
        found: evidence.map((item) => `✓ ${item.type} "${item.title}" is now connected via a new ${relationshipType} relationship.`),
        missing: [],
        conclusion: `${objects.length} Knowledge item(s) affected by this new relationship.`,
      },
      evidence,
      relatedNodes: koRefs,
      sourceEvent: { id: event.id, eventType: event.eventType },
    };
  },
};

/**
 * Rule 3: Knowledge updated → recommend checking related Discussions, using
 * the object's own real `relatedDiscussions` field.
 */
const checkRelatedDiscussionsRule: RecommendationRule = {
  id: "knowledge-updated-check-discussions",
  async evaluate(event) {
    if (event.eventType !== EVENT_TYPES.KNOWLEDGE_OBJECT_UPDATED || !event.sourceNode) return null;

    const object = await getKnowledgeObject(event.sourceNode.id);
    if (!object || object.relatedDiscussions.length === 0) return null;

    const discussions = (await Promise.all(object.relatedDiscussions.map((id) => getDiscussion(id)))).filter((discussion) => discussion !== null);
    if (discussions.length === 0) return null;

    const evidence: Evidence[] = discussions.map((discussion) => ({
      id: discussion.id,
      title: discussion.title,
      type: "Discussion",
      relationship: "related",
      relevance: 1,
      confidence: 1,
    }));

    return {
      projectId: object.projectId,
      recommendationType: RECOMMENDATION_TYPES.CHECK_RELATED_DISCUSSIONS,
      title: `Check discussions related to "${object.title}"`,
      description: `"${object.title}" was just updated. ${discussions.length} related discussion(s) may need a follow-up.`,
      confidence: "medium",
      reasoning: {
        found: evidence.map((item) => `✓ Discussion "${item.title}" is linked to this item.`),
        missing: [],
        conclusion: `${discussions.length} related discussion(s) found.`,
      },
      evidence,
      relatedNodes: [event.sourceNode, ...discussions.map((discussion): RelationshipNodeRef => ({ id: discussion.id, type: "discussion" }))],
      sourceEvent: { id: event.id, eventType: event.eventType },
    };
  },
};

/**
 * Rule 4: Low confidence → recommend gathering more evidence. Recomputes
 * confidence via the unmodified `EvidenceEngine`/`ConfidenceScorer` — the
 * exact same call shape `KnowledgeValidationEngine` uses — never a guessed
 * or fabricated confidence value.
 */
const gatherMoreEvidenceRule: RecommendationRule = {
  id: "low-confidence-gather-evidence",
  async evaluate(event) {
    if ((event.eventType !== EVENT_TYPES.KNOWLEDGE_OBJECT_CREATED && event.eventType !== EVENT_TYPES.KNOWLEDGE_OBJECT_UPDATED) || !event.sourceNode) {
      return null;
    }

    const object = await getKnowledgeObject(event.sourceNode.id);
    if (!object) return null;

    const scopes: ContextScope[] = [{ level: "node", node: event.sourceNode }, { level: "project", projectId: object.projectId }];
    const text = `${object.title} ${object.description}`;
    const [evidenceItems, impacts, related] = await Promise.all([
      evidenceEngine.collect({ text, entities: [], scopes, relationshipType: "evidence" }),
      evidenceEngine.collect({ text, entities: [], scopes, relationshipType: "impact" }),
      evidenceEngine.collect({ text, entities: [], scopes, relationshipType: "related" }),
    ]);
    const combined = [...evidenceItems, ...impacts, ...related];
    const confidence = confidenceScorer.score(combined);
    if (confidence !== "low" && confidence !== "none") return null;

    const entities: ExtractedEntity[] = [{ type: "title", value: object.title, confidence: 1 }];

    return {
      projectId: object.projectId,
      recommendationType: RECOMMENDATION_TYPES.GATHER_MORE_EVIDENCE,
      title: `Gather more evidence for "${object.title}"`,
      description: `Confidence in "${object.title}" is currently ${confidence}. Consider linking supporting Discussions, Meetings, Drawings, or Documents.`,
      confidence,
      reasoning: reasoningEngine.explain(entities, combined, confidence, object.type),
      evidence: combined,
      relatedNodes: [event.sourceNode],
      sourceEvent: { id: event.id, eventType: event.eventType },
    };
  },
};

/**
 * Rule 5: Missing relationships → recommend linking related Knowledge. Only
 * fires when a real query for this exact node returns nothing — the absence
 * itself is the (real, verified) evidence.
 */
const linkRelatedKnowledgeRule: RecommendationRule = {
  id: "missing-relationships-link-knowledge",
  async evaluate(event) {
    if (event.eventType !== EVENT_TYPES.KNOWLEDGE_OBJECT_CREATED || !event.sourceNode) return null;

    const object = await getKnowledgeObject(event.sourceNode.id);
    if (!object) return null;

    const relationships = await queryRelationships({ node: event.sourceNode });
    if (relationships.length > 0) return null;

    return {
      projectId: object.projectId,
      recommendationType: RECOMMENDATION_TYPES.LINK_RELATED_KNOWLEDGE,
      title: `Link related Knowledge to "${object.title}"`,
      description: `"${object.title}" has no evidence, impacts, or related Knowledge linked yet. Consider connecting it to the rest of the Knowledge Graph.`,
      confidence: "low",
      reasoning: {
        found: [],
        missing: ["✗ No relationships found for this item."],
        conclusion: "This item is currently disconnected from the Knowledge Graph.",
      },
      evidence: [],
      relatedNodes: [event.sourceNode],
      sourceEvent: { id: event.id, eventType: event.eventType },
    };
  },
};

const WORKFLOW_DESTINATIONS = new Set(["new_requirement", "new_decision", "new_issue", "new_action"]);

/**
 * Rule 6: Discussion created → recommend extracting Knowledge if
 * appropriate. Reuses the unmodified `deltaComprehensionService` — the exact
 * same destination-prediction signal `KnowledgeCaptureEngine` itself acts
 * on — rather than inventing a new heuristic. "If appropriate" is decided by
 * that real classification, never a guess.
 */
const extractKnowledgeRule: RecommendationRule = {
  id: "discussion-created-extract-knowledge",
  async evaluate(event) {
    if (event.eventType !== EVENT_TYPES.DISCUSSION_CREATED || !event.sourceNode) return null;

    const discussion = await getDiscussion(event.sourceNode.id);
    if (!discussion || discussion.summary.length === 0) return null;

    const text = discussion.summary.join(" ");
    const comprehension = deltaComprehensionService.comprehend({ text });
    if (!WORKFLOW_DESTINATIONS.has(comprehension.destination.destination) || comprehension.destination.confidence < 0.5) {
      return null;
    }

    const workflowLabel = comprehension.destination.destination.replace("new_", "");

    return {
      // `Discussion` has no `projectId` field yet — same pre-existing gap
      // `discussion.created.v1` events already carry (Sprint 4.5/4.6).
      projectId: event.projectId,
      recommendationType: RECOMMENDATION_TYPES.EXTRACT_KNOWLEDGE,
      title: `Extract Knowledge from "${discussion.title}"`,
      description: `This discussion's summary matches ${workflowLabel}-shaped language — consider capturing it as a Knowledge Object.`,
      confidence: comprehension.destination.confidence >= 0.7 ? "medium" : "low",
      reasoning: {
        found: [`✓ Summary text classified as "${workflowLabel}" language.`],
        missing: [],
        conclusion: "Detected obligation/decision-shaped language in the discussion summary.",
      },
      evidence: [{ id: discussion.id, title: discussion.title, type: "Discussion", relationship: "related", relevance: 1, confidence: comprehension.destination.confidence }],
      relatedNodes: [event.sourceNode],
      sourceEvent: { id: event.id, eventType: event.eventType },
    };
  },
};

/**
 * Rule 7: Revision Intelligence's design change detected → recommend the
 * follow-up review it implies (Sprint 5.0, Module 9). `suggestedActions`
 * arrives on the event's own metadata, already computed once by
 * `RevisionOrchestrator` from its documented, static lookup table — this
 * rule surfaces that same real, already-computed signal, never a second,
 * independently-fabricated suggestion.
 */
const reviewRevisionImpactRule: RecommendationRule = {
  id: "revision-changes-detected-review-impact",
  async evaluate(event) {
    if (event.eventType !== EVENT_TYPES.REVISION_CHANGES_DETECTED || !event.sourceNode) return null;

    const object = await getKnowledgeObject(event.sourceNode.id);
    if (!object) return null;

    const suggestedActions = Array.isArray(event.metadata?.suggestedActions) ? (event.metadata.suggestedActions as string[]) : [];
    if (suggestedActions.length === 0) return null;

    return {
      projectId: object.projectId,
      recommendationType: RECOMMENDATION_TYPES.REVIEW_REVISION_IMPACT,
      title: `Review impact of "${object.title}"`,
      description: `A detected design change suggests: ${suggestedActions.join("; ")}.`,
      confidence: "medium",
      reasoning: {
        found: [`✓ Detected change: "${object.title}"`],
        missing: [],
        conclusion: `${suggestedActions.length} suggested follow-up action(s) for this change.`,
      },
      evidence: [{ id: object.id, title: object.title, type: knowledgeObjectTypeConfig[object.type].label, relationship: "related", relevance: 1, confidence: 1 }],
      relatedNodes: [event.sourceNode],
      sourceEvent: { id: event.id, eventType: event.eventType },
    };
  },
};

/**
 * Rules 8–12: Project Onboarding (Sprint 5.4, Module 8), extended by
 * Existing Project Import (Sprint 5.6, Module 11) rather than duplicated.
 * Re-evaluated on every document-gap checkpoint event, not just the one
 * that would naturally suggest each gap — a user can skip the Documents
 * step entirely and never publish a `DOCUMENT_UPLOADED` event, and a
 * project that skipped onboarding entirely can still import documents
 * later via `ASSET_IMPORTED` — so "no BOQ uploaded" must be checked on
 * every one of `TEAM_ASSIGNED`/`DOCUMENT_UPLOADED`/`QUESTIONNAIRE_COMPLETED`/
 * `ASSET_IMPORTED` or it would never fire for those real cases. These are
 * the first rules in this codebase to query REAL, Postgres-backed project
 * data (`listProjectTeam`, `getProjectDocuments`) rather than only the mock
 * Knowledge Graph — a genuinely new but consistent extension, not a
 * parallel engine.
 *
 * None of these have a natural graph node to relate to (a "the project
 * itself is missing X" fact isn't about any single Knowledge Object,
 * Drawing, or Discussion) — rather than adding a new `"project"`
 * `RelationshipNodeType` to the closed union in `types/relationship.ts`
 * (untouched by every intelligence sprint so far) just for this, each rule
 * de-duplicates itself by checking for an already-open recommendation of
 * the same type for this project directly, via the existing
 * `getRecommendations()` action — a self-contained solution that doesn't
 * touch the Relationship Engine's own types at all.
 */
const DOCUMENT_GAP_CHECKPOINT_EVENTS: string[] = [EVENT_TYPES.TEAM_ASSIGNED, EVENT_TYPES.DOCUMENT_UPLOADED, EVENT_TYPES.QUESTIONNAIRE_COMPLETED, EVENT_TYPES.ASSET_IMPORTED];

async function hasOpenRecommendation(projectId: string, recommendationType: string): Promise<boolean> {
  const open = await getRecommendations({ projectId, status: "open" });
  return open.some((recommendation) => recommendation.recommendationType === recommendationType);
}

const missingConsultantsRule: RecommendationRule = {
  id: "onboarding-missing-consultants",
  async evaluate(event) {
    if (!event.projectId || !DOCUMENT_GAP_CHECKPOINT_EVENTS.includes(event.eventType)) return null;
    if (await hasOpenRecommendation(event.projectId, RECOMMENDATION_TYPES.INVITE_MISSING_CONSULTANTS)) return null;

    const { missingRoles, filledTeam } = await getProjectSetupGaps(event.projectId);
    if (missingRoles.length === 0) return null;

    return {
      projectId: event.projectId,
      recommendationType: RECOMMENDATION_TYPES.INVITE_MISSING_CONSULTANTS,
      title: "Invite missing consultants",
      description: `No one is assigned as: ${missingRoles.join(", ")}.`,
      confidence: "medium",
      reasoning: {
        found: filledTeam.map((member) => `✓ ${member.role}: ${member.name}`),
        missing: missingRoles.map((role) => `✗ No ${role} assigned.`),
        conclusion: `${missingRoles.length} core project role(s) still need a consultant.`,
      },
      evidence: filledTeam.map((member, index) => ({ id: `${event.projectId}-team-${index}`, title: `${member.role}: ${member.name}`, type: "Team Member", relationship: "related", relevance: 1, confidence: 1 })),
      relatedNodes: [],
      sourceEvent: { id: event.id, eventType: event.eventType },
    };
  },
};

function missingDocumentRule(params: { id: string; recommendationType: string; documentTypeName: string; title: string }): RecommendationRule {
  return {
    id: params.id,
    async evaluate(event) {
      if (!event.projectId || !DOCUMENT_GAP_CHECKPOINT_EVENTS.includes(event.eventType)) return null;
      if (await hasOpenRecommendation(event.projectId, params.recommendationType)) return null;

      const { missingDocumentTypes } = await getProjectSetupGaps(event.projectId);
      if (!missingDocumentTypes.includes(params.documentTypeName)) return null;

      return {
        projectId: event.projectId,
        recommendationType: params.recommendationType,
        title: params.title,
        description: `No "${params.documentTypeName}" document has been uploaded for this project yet.`,
        confidence: "medium",
        reasoning: {
          found: [],
          missing: [`✗ No ${params.documentTypeName} document found.`],
          conclusion: `"${params.documentTypeName}" has not been uploaded.`,
        },
        evidence: [],
        relatedNodes: [],
        sourceEvent: { id: event.id, eventType: event.eventType },
      };
    },
  };
}

const missingAgreementRule = missingDocumentRule({
  id: "onboarding-missing-agreement",
  recommendationType: RECOMMENDATION_TYPES.UPLOAD_MISSING_AGREEMENT,
  documentTypeName: "Agreement",
  title: "Upload missing agreement",
});

const missingBoqRule = missingDocumentRule({
  id: "onboarding-missing-boq",
  recommendationType: RECOMMENDATION_TYPES.UPLOAD_MISSING_BOQ,
  documentTypeName: "BOQ",
  title: "No BOQ uploaded",
});

const missingDrawingsRule = missingDocumentRule({
  id: "onboarding-missing-drawings",
  recommendationType: RECOMMENDATION_TYPES.UPLOAD_MISSING_DRAWINGS,
  documentTypeName: "Drawing",
  title: "No drawings uploaded",
});

const missingSpecificationsRule = missingDocumentRule({
  id: "onboarding-missing-specifications",
  recommendationType: RECOMMENDATION_TYPES.UPLOAD_MISSING_SPECIFICATIONS,
  documentTypeName: "Specification",
  title: "No specifications uploaded",
});

const questionnaireIncompleteRule: RecommendationRule = {
  id: "onboarding-questionnaire-incomplete",
  async evaluate(event) {
    if (!event.projectId || !DOCUMENT_GAP_CHECKPOINT_EVENTS.includes(event.eventType)) return null;
    if (event.eventType === EVENT_TYPES.QUESTIONNAIRE_COMPLETED) return null;
    if (await hasOpenRecommendation(event.projectId, RECOMMENDATION_TYPES.COMPLETE_QUESTIONNAIRE)) return null;

    const { questionnaireIncomplete } = await getProjectSetupGaps(event.projectId);
    if (!questionnaireIncomplete) return null;

    return {
      projectId: event.projectId,
      recommendationType: RECOMMENDATION_TYPES.COMPLETE_QUESTIONNAIRE,
      title: "Client questionnaire incomplete",
      description: "The Client Questionnaire has not been completed yet — its answers become real project Knowledge once submitted.",
      confidence: "medium",
      reasoning: {
        found: [],
        missing: ["✗ Client Questionnaire not yet completed."],
        conclusion: "Completing the questionnaire captures structured project knowledge Delta can reason about.",
      },
      evidence: [],
      relatedNodes: [],
      sourceEvent: { id: event.id, eventType: event.eventType },
    };
  },
};

/**
 * Existing Project Import (Sprint 5.6, Module 11): a recently classified
 * Drawing with zero Relationships to any Requirement — reuses the exact
 * "absence itself is the evidence" pattern `linkRelatedKnowledgeRule`
 * already established for Knowledge Objects, narrowed to Requirement
 * specifically per the brief's own example ("Recent drawing has no linked
 * requirements"). Triggered on `DRAWING_CLASSIFIED`, not `DRAWING_UPLOADED`
 * — `DrawingService.ingest()` publishes `DRAWING_UPLOADED` BEFORE creating
 * the drawing's own suggested Relationships and `DRAWING_CLASSIFIED` AFTER,
 * so checking on the earlier event would see zero relationships every time,
 * even for a drawing about to receive several.
 */
const drawingMissingRequirementLinkRule: RecommendationRule = {
  id: "drawing-classified-missing-requirement-link",
  async evaluate(event) {
    if (event.eventType !== EVENT_TYPES.DRAWING_CLASSIFIED || !event.sourceNode) return null;

    const drawing = await getDrawing(event.sourceNode.id);
    if (!drawing) return null;

    const relationships = await queryRelationships({ node: event.sourceNode });
    const linkedToRequirement = relationships.some((relationship) => {
      const other = isSameRelationshipNode(relationship.nodeA, event.sourceNode!) ? relationship.nodeB : relationship.nodeA;
      return other.type === "requirement";
    });
    if (linkedToRequirement) return null;

    return {
      projectId: drawing.projectId,
      recommendationType: RECOMMENDATION_TYPES.DRAWING_MISSING_REQUIREMENT_LINK,
      title: `Link "${drawing.title}" to a Requirement`,
      description: `"${drawing.title}" (sheet ${drawing.sheetNumber}) isn't linked to any Requirement yet.`,
      confidence: "low",
      reasoning: {
        found: [],
        missing: [`✗ No Requirement is linked to "${drawing.title}".`],
        conclusion: "This drawing is not yet connected to any Requirement.",
      },
      evidence: [],
      relatedNodes: [event.sourceNode],
      sourceEvent: { id: event.id, eventType: event.eventType },
    };
  },
};

export const defaultRecommendationRules: RecommendationRule[] = [
  notifyReviewersRule,
  reviewAffectedKnowledgeRule,
  checkRelatedDiscussionsRule,
  gatherMoreEvidenceRule,
  linkRelatedKnowledgeRule,
  extractKnowledgeRule,
  missingConsultantsRule,
  missingAgreementRule,
  missingBoqRule,
  missingDrawingsRule,
  missingSpecificationsRule,
  questionnaireIncompleteRule,
  reviewRevisionImpactRule,
  drawingMissingRequirementLinkRule,
];
