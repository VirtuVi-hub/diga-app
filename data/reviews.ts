import type { ReviewPackage } from "@/types/review";

export const reviewPackages: ReviewPackage[] = [
  {
    id: "rp-meeting-12", source: "Meeting transcript", title: "Weekly Coordination", analyzed: "Today · 10:24", confidence: 96, owner: "Maya Chen", status: "Pending", conflictCount: 1,
    summary: { requirements: 3, decisions: 2, spaces: 1, concepts: 5, relationships: 14, duplicates: 2, conflicts: 1 },
    objects: [
      { id: "accessible-entrance", type: "Requirement", title: "Accessible Entrance", confidence: 97, reasoning: ["Mentioned three times during the curbside circulation discussion", "Agreement v2.1 contains matching access language", "Drawing A-101 references the affected entrance zone"], evidence: [{ source: "Meeting #12", reference: "18:42" }, { source: "Agreement v2.1", reference: "§4.2" }], relationships: ["Accessibility Concept", "Drawing A-101", "Decision D-018"], impact: "Creates a verified accessibility requirement and connects it to arrivals planning.", history: "No existing approved requirement matches this wording.", duplicate: "R-014 Accessible Route" },
      { id: "security-hall", type: "Space", title: "South Security Screening Hall", confidence: 93, reasoning: ["The space boundary was named consistently by both disciplines", "The updated drawing identifies a 1,840 m² screening zone"], evidence: [{ source: "Meeting #12", reference: "24:10" }, { source: "Drawing A-210", reference: "Rev C" }], relationships: ["A-210 Departures plan", "Transfer truss study", "Passenger flow model"], impact: "Adds a governed space object for downstream coordination.", history: "Updates the preliminary spatial record from concept design." },
      { id: "east-pier", type: "Decision", title: "East Pier boarding strategy", confidence: 94, reasoning: ["The preferred option received explicit client approval", "Operations model supports retaining the flexible apron stand"], evidence: [{ source: "Meeting #12", reference: "31:06" }, { source: "Gate planning study", reference: "Option 3" }], relationships: ["Operations brief", "Passenger flow model", "Gate planning study"], impact: "Records the approved boarding strategy and its design dependencies.", history: "Supersedes the provisional pier configuration.", conflict: "Decision D-022 assumes all-contact gates at the terminal head." },
      { id: "arrival-route", type: "Relationship", title: "Curbside route connects to accessible entrance", confidence: 91, reasoning: ["The route is shown on the revised curbside diagram", "Transcript confirms the route must remain weather-protected"], evidence: [{ source: "Drawing A-101", reference: "Callout 4" }, { source: "Meeting #12", reference: "19:15" }], relationships: ["Accessible Entrance", "Curbside drop-off", "Public Realm Brief"], impact: "Adds a traceable relationship between access design and the project brief.", history: "New relationship discovered during analysis." },
    ],
  },
  {
    id: "rp-drawing-a101", source: "Drawing upload", title: "A-101 — Arrivals Level Plan", analyzed: "Today · 9:38", confidence: 92, owner: "Studio North", status: "Needs attention", conflictCount: 2,
    summary: { requirements: 2, decisions: 1, spaces: 2, concepts: 3, relationships: 9, duplicates: 1, conflicts: 2 },
    objects: [
      { id: "curbside-canopy", type: "Requirement", title: "Curbside canopy clearance", confidence: 92, reasoning: ["Clearance note added in drawing revision C", "Vehicle envelope is shown against canopy supports"], evidence: [{ source: "Drawing A-101", reference: "Detail 6" }], relationships: ["Curbside drop-off", "Structural grid", "Accessible Entrance"], impact: "Updates the clearance requirement used by transport and structure.", history: "Candidate update to R-021." },
      { id: "arrivals-concourse", type: "Space", title: "Arrivals Concourse", confidence: 88, reasoning: ["Drawing room tag and schedule identify the same boundary", "Passenger flow model uses equivalent area"], evidence: [{ source: "Drawing A-101", reference: "Room A-02" }], relationships: ["A-101 Arrivals plan", "Passenger flow model"], impact: "Normalizes the arrivals concourse as a connected spatial object.", history: "Potential duplicate with S-003." },
    ],
  },
  {
    id: "rp-agreement-21", source: "Agreement", title: "Baggage System Interface Protocol", analyzed: "Yesterday · 11:18", confidence: 98, owner: "Priya Nair", status: "Approved", conflictCount: 0,
    summary: { requirements: 4, decisions: 1, spaces: 1, concepts: 2, relationships: 11, duplicates: 0, conflicts: 0 },
    objects: [],
  },
  {
    id: "rp-site-08", source: "Site visit", title: "Existing Terminal Survey", analyzed: "Yesterday · 1:06", confidence: 89, owner: "Axis Structures", status: "Rejected", conflictCount: 2,
    summary: { requirements: 1, decisions: 0, spaces: 1, concepts: 2, relationships: 4, duplicates: 1, conflicts: 2 },
    objects: [],
  },
];
