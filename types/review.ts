export type ReviewStatus = "Pending" | "Approved" | "Rejected" | "Needs attention";
export type ReviewObjectType = "Requirement" | "Decision" | "Space" | "Relationship";
export type ReviewAction = "approved" | "rejected" | "merged" | "pending";

export type ReviewObject = {
  id: string;
  type: ReviewObjectType;
  title: string;
  confidence: number;
  reasoning: string[];
  evidence: { source: string; reference: string }[];
  relationships: string[];
  impact: string;
  history: string;
  duplicate?: string;
  conflict?: string;
};

export type ReviewPackage = {
  id: string;
  source: string;
  title: string;
  analyzed: string;
  confidence: number;
  owner: string;
  status: ReviewStatus;
  objects: ReviewObject[];
  conflictCount: number;
  summary: { requirements: number; decisions: number; spaces: number; concepts: number; relationships: number; duplicates: number; conflicts: number };
};
