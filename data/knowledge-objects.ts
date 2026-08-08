import type { KnowledgeObject } from "@/types/knowledge-object";

const PROJECT_ID = "3c2384a0-bc60-4116-ba8c-5f1f52eedb42";

/**
 * A single seeded Knowledge Object so the Evidence/Impacts sections on the
 * detail page (`/projects/[id]/knowledge/[objectId]`) have something real to
 * query through `RelationshipRepository` without first creating one by hand.
 * Mirrors how `discussion-repository.ts` seeds from `data/discussions.ts`.
 */
export const knowledgeObjects: KnowledgeObject[] = [
  {
    id: "requirement-demo-1",
    projectId: PROJECT_ID,
    discussionId: "conv-accessibility",
    type: "requirement",
    title: "Weather-protected clearance to accessible entrance",
    description:
      "The curbside route must remain weather-protected all the way to the accessible entrance, including the transition through the arrivals forecourt.",
    priority: "high",
    status: "approved",
    relatedTopics: ["Accessibility", "Canopy"],
    raisedTo: "Lead Architect",
    approvalRequiredFrom: ["Client"],
    notify: ["MEP Team"],
    validationState: "pending",
    revisions: [
      {
        id: "revision-demo-1",
        revisionNumber: 1,
        title: "Weather-protected clearance to accessible entrance",
        description:
          "The curbside route must remain weather-protected all the way to the accessible entrance, including the transition through the arrivals forecourt.",
        priority: "high",
        status: "approved",
        relatedTopics: ["Accessibility", "Canopy"],
        raisedTo: "Lead Architect",
        approvalRequiredFrom: ["Client"],
        notify: ["MEP Team"],
        createdAt: "2026-07-31T10:31:00Z",
        createdBy: "Maya Chen",
      },
    ],
    relatedDiscussions: ["conv-accessibility"],
    relatedDocuments: [],
    relatedDrawings: [],
    approvals: [],
    createdAt: "2026-07-31T10:31:00Z",
    updatedAt: "2026-07-31T10:31:00Z",
  },
  {
    // Sprint 5.1 (Module 12: Seed a Complete Story) — upgrades a node that
    // previously only existed as a denormalized `RelationshipNode` label in
    // `data/relationships.ts` (`decision-canopy-material`, referenced as an
    // impact target of `requirement-demo-1`) into a real Decision Knowledge
    // Object, completing the Requirement → Discussion → Decision → Drawing
    // chain with the *same* id/title rather than a disconnected duplicate.
    id: "decision-canopy-material",
    projectId: PROJECT_ID,
    discussionId: "conv-accessibility",
    type: "decision",
    title: "Canopy Grid Material Approved",
    description:
      "The revised canopy grid material was approved by the client, maintaining weather-protected clearance to the accessible entrance without changing the primary transfer condition.",
    priority: "medium",
    status: "approved",
    relatedTopics: ["Accessibility", "Canopy"],
    raisedTo: "Lead Architect",
    approvalRequiredFrom: ["Client"],
    notify: ["MEP Team"],
    validationState: "approved",
    revisions: [
      {
        id: "revision-decision-canopy-material-1",
        revisionNumber: 1,
        title: "Canopy Grid Material Approved",
        description:
          "The revised canopy grid material was approved by the client, maintaining weather-protected clearance to the accessible entrance without changing the primary transfer condition.",
        priority: "medium",
        status: "approved",
        relatedTopics: ["Accessibility", "Canopy"],
        raisedTo: "Lead Architect",
        approvalRequiredFrom: ["Client"],
        notify: ["MEP Team"],
        createdAt: "2026-07-31T10:41:00Z",
        createdBy: "David Roth",
      },
    ],
    relatedDiscussions: ["conv-accessibility"],
    relatedDocuments: [],
    relatedDrawings: [],
    approvals: [],
    createdAt: "2026-07-31T10:41:00Z",
    updatedAt: "2026-07-31T10:41:00Z",
  },
];
