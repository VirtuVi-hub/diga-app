import type { Relationship, RelationshipNode, RelationshipType } from "@/types/relationship";

const PROJECT_ID = "3c2384a0-bc60-4116-ba8c-5f1f52eedb42";

let sequence = 0;
function nextId() {
  sequence += 1;
  return `relationship-seed-${sequence}`;
}

function node(id: string, type: RelationshipNode["type"], label: string): RelationshipNode {
  return { id, type, label };
}

function relate(nodeA: RelationshipNode, relationshipType: RelationshipType, nodeB: RelationshipNode, createdAt: string): Relationship {
  return {
    id: nextId(),
    projectId: PROJECT_ID,
    nodeA,
    relationshipType,
    nodeB,
    createdAt,
    createdBy: "Delta",
  };
}

// --- Evidence-type node pool (reused across subjects below) ---
const meetingCoordination = node("meeting-design-coordination-w12", "meeting", "Design Coordination — Week 12");
const drawingA101 = node("drawing-a-101", "drawing", "A-101 Ground Floor Plan");
const documentAccessibilityReport = node("document-accessibility-report", "document", "Accessibility Compliance Report");
const photoCurbsideCanopy = node("photo-curbside-canopy", "photo", "Site Photo — Curbside Canopy");
const videoArrivalsWalkthrough = node("video-arrivals-walkthrough", "video", "Site Walkthrough — Arrivals Forecourt");
const referenceAdaGuidelines = node("reference-ada-4-3", "reference", "ADA Accessibility Guidelines §4.3");

// --- Impact-type node pool ---
const requirementCanopyClearance = node("requirement-canopy-clearance", "requirement", "Canopy Structural Clearance");
const decisionCanopyMaterial = node("decision-canopy-material", "decision", "Canopy Grid Material Approved");
const actionUpdateA101 = node("action-update-a101", "action", "Update A-101 Drawing Set");
const issueSignageOverlap = node("issue-signage-overlap", "issue", "Canopy Overlap with Signage Zone");
const riskWeatherExposure = node("risk-weather-exposure", "risk", "Weather Exposure at Transition Point");
const drawingA102 = node("drawing-a-102", "drawing", "A-102 Canopy Detail");
const meetingStructuralReview = node("meeting-structural-review", "meeting", "Structural Coordination Review");

// --- Related-knowledge node pool ---
const requirementFloorFinish = node("requirement-floor-finish", "requirement", "Floor Finish");
const decisionMaterialSelection = node("decision-material-selection", "decision", "Material Selection");

// --- Drawing Intelligence (Sprint 5.1, Module 12: Seed a Complete Story) ---
// `drawingA101`/`drawingA102` above are the SAME nodes already referenced as
// evidence/impact targets below — Sprint 5.1 gives them real `Drawing`
// records (`data/drawings.ts`) with matching ids/labels, and adds the rest
// of a believable sheet set, connected the way a real drawing set actually
// is: schedules and elevations reference the plan they were derived from.
const drawingSitePlan = node("drawing-a-100", "drawing", "Site Plan");
const drawingFirstFloorPlan = node("drawing-a-103", "drawing", "First Floor Plan");
const drawingNorthElevation = node("drawing-a-201", "drawing", "North Elevation");
const drawingSectionAA = node("drawing-a-301", "drawing", "Section A-A");
const drawingDoorSchedule = node("drawing-a-501", "drawing", "Door Schedule");
const drawingRoomSchedule = node("drawing-a-502", "drawing", "Room Schedule");

// --- Subjects (nodeA) ---
const knowledgeObjectRequirementDemo = node(
  "requirement-demo-1",
  "requirement",
  "Weather-protected clearance to accessible entrance",
);
const discussionAccessibility = node("conv-accessibility", "discussion", "Entrance Accessibility");
const discussionFireExit = node("conv-fire-exit", "discussion", "Fire Exit");
const discussionRamp = node("conv-ramp", "discussion", "Ramp Width");
const discussionSecurity = node("conv-security", "discussion", "South Security Hall");

export const relationships: Relationship[] = [
  // --- Evidence + Impacts for the seeded demo Knowledge Object ---
  relate(knowledgeObjectRequirementDemo, "evidence", discussionAccessibility, "2026-07-31T10:32:00Z"),
  relate(knowledgeObjectRequirementDemo, "evidence", meetingCoordination, "2026-07-31T10:33:00Z"),
  relate(knowledgeObjectRequirementDemo, "evidence", drawingA101, "2026-07-31T10:34:00Z"),
  relate(knowledgeObjectRequirementDemo, "evidence", documentAccessibilityReport, "2026-07-31T10:35:00Z"),
  relate(knowledgeObjectRequirementDemo, "evidence", photoCurbsideCanopy, "2026-07-31T10:36:00Z"),
  relate(knowledgeObjectRequirementDemo, "evidence", videoArrivalsWalkthrough, "2026-07-31T10:37:00Z"),
  relate(knowledgeObjectRequirementDemo, "evidence", referenceAdaGuidelines, "2026-07-31T10:38:00Z"),

  relate(knowledgeObjectRequirementDemo, "impact", requirementCanopyClearance, "2026-07-31T10:40:00Z"),
  relate(knowledgeObjectRequirementDemo, "impact", decisionCanopyMaterial, "2026-07-31T10:41:00Z"),
  relate(knowledgeObjectRequirementDemo, "impact", actionUpdateA101, "2026-07-31T10:42:00Z"),
  relate(knowledgeObjectRequirementDemo, "impact", issueSignageOverlap, "2026-07-31T10:43:00Z"),
  relate(knowledgeObjectRequirementDemo, "impact", riskWeatherExposure, "2026-07-31T10:44:00Z"),
  relate(knowledgeObjectRequirementDemo, "impact", drawingA102, "2026-07-31T10:45:00Z"),
  relate(knowledgeObjectRequirementDemo, "impact", meetingStructuralReview, "2026-07-31T10:46:00Z"),

  // --- Evidence + Impacts + Related Knowledge for each seeded discussion (Delta responses) ---
  relate(discussionAccessibility, "evidence", meetingCoordination, "2026-07-31T10:31:30Z"),
  relate(discussionAccessibility, "evidence", drawingA101, "2026-07-31T10:31:45Z"),
  relate(discussionAccessibility, "evidence", photoCurbsideCanopy, "2026-07-31T10:32:15Z"),
  relate(discussionAccessibility, "impact", requirementCanopyClearance, "2026-07-31T10:33:00Z"),
  relate(discussionAccessibility, "impact", drawingA102, "2026-07-31T10:33:15Z"),
  relate(discussionAccessibility, "related", requirementFloorFinish, "2026-07-31T10:33:30Z"),

  relate(discussionFireExit, "evidence", documentAccessibilityReport, "2026-07-31T09:13:00Z"),
  relate(discussionFireExit, "evidence", referenceAdaGuidelines, "2026-07-31T09:13:30Z"),
  relate(discussionFireExit, "impact", issueSignageOverlap, "2026-07-31T09:14:00Z"),
  relate(discussionFireExit, "impact", meetingStructuralReview, "2026-07-31T09:14:30Z"),
  relate(discussionFireExit, "related", decisionMaterialSelection, "2026-07-31T09:15:00Z"),

  relate(discussionRamp, "evidence", drawingA101, "2026-07-30T16:13:00Z"),
  relate(discussionRamp, "evidence", videoArrivalsWalkthrough, "2026-07-30T16:13:30Z"),
  relate(discussionRamp, "impact", actionUpdateA101, "2026-07-30T16:14:00Z"),
  relate(discussionRamp, "impact", riskWeatherExposure, "2026-07-30T16:14:30Z"),
  relate(discussionRamp, "related", requirementCanopyClearance, "2026-07-30T16:15:00Z"),

  relate(discussionSecurity, "evidence", meetingCoordination, "2026-07-30T13:07:00Z"),
  relate(discussionSecurity, "evidence", documentAccessibilityReport, "2026-07-30T13:07:30Z"),
  relate(discussionSecurity, "impact", decisionCanopyMaterial, "2026-07-30T13:08:00Z"),
  relate(discussionSecurity, "impact", drawingA102, "2026-07-30T13:08:30Z"),
  relate(discussionSecurity, "related", requirementFloorFinish, "2026-07-30T13:09:00Z"),

  // --- Drawing Intelligence (Sprint 5.1, Module 9/12): the rest of a
  // believable sheet set, related the way a real drawing set is organized —
  // schedules/elevations/sections reference the plan they were derived
  // from, and the approved Decision carries through to the sheet it drove.
  relate(decisionCanopyMaterial, "impact", drawingA102, "2026-07-31T10:47:00Z"),
  relate(drawingDoorSchedule, "related", drawingA101, "2026-07-25T09:01:00Z"),
  relate(drawingRoomSchedule, "related", drawingA101, "2026-07-25T09:02:00Z"),
  relate(drawingRoomSchedule, "related", drawingFirstFloorPlan, "2026-07-25T09:03:00Z"),
  relate(drawingFirstFloorPlan, "related", drawingA101, "2026-07-20T09:01:00Z"),
  relate(drawingSitePlan, "related", drawingA101, "2026-07-15T09:01:00Z"),
  relate(drawingNorthElevation, "related", drawingA101, "2026-07-22T09:01:00Z"),
  relate(drawingSectionAA, "related", drawingA101, "2026-07-23T09:01:00Z"),
];
