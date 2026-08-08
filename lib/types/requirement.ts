export type RequirementStatus =
  | "Draft"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Archived";

export type RequirementPriority =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

export interface Requirement {
  id: string;
  project_id: string;

  category_id: string;
  source_id: string | null;

  requirement_number: string;
  title: string;

  status: RequirementStatus;
  priority: RequirementPriority;
  verification_status: string;

  owner_id: string | null;
  current_revision_id: string | null;

  active: boolean;

  created_at: string;
  updated_at: string;
}

export interface RequirementListItem extends Requirement {
  category_name?: string;
  source_name?: string;
}