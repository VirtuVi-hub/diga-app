import type { DiscussionTypeCode } from "@/lib/discussion-types";

export type MilestoneType = "approved" | "rejected" | "query" | "discussion" | "recommendation" | "concept" | "baseline";

export type Milestone = {
  id: string;
  title: string;
  type: MilestoneType;
  discussionType: DiscussionTypeCode;
  date: string;
  summary: string;
  confidence: number;
  impact: { requirements: number; decisions: number; drawings: number; spaces: number };
  relatedObjects: string[];
  predecessors: string[];
  successors: string[];
  reviewPackageId?: string;
};
