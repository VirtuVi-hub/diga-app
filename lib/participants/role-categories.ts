/**
 * Sprint 5.9, Modules 3-4: the single source of truth for which roles
 * belong to which Project Setup section. Both the invitation engine's
 * per-section role dropdown (`AddParticipantFlow`) and Project Setup's
 * automatic-progression gate (`ProjectSetupService.getProgress()`) read
 * from these same lists, so the two can never drift apart.
 *
 * `lib/project-setup/setup-gaps.ts`'s `CORE_PROJECT_ROLES` is a
 * deliberately separate, independent list feeding the Recommendation
 * Engine's own soft "nudge" rules — not the same concept as these hard
 * Setup-progression categories. See that file's own cross-reference
 * comment.
 */

export const DESIGN_TEAM_SECTION_ROLES = [
  "Architect",
  "Structural Architect",
  "Project Architect",
  "Designer",
  "Interior Designer",
  "Junior Architect",
  "Intern",
];

export const CONSULTANTS_SECTION_ROLES = [
  "Structural Engineer",
  "MEP Engineer",
  "Landscape Architect",
  "Landscape Consultant",
  "Fire Consultant",
  "Lighting Consultant",
  "Consultant",
  "Quantity Surveyor",
  "Contractor",
  "PMC",
  "Site Engineer",
  "Supervisor",
  "Vendor",
];

export const CLIENT_REPRESENTATIVES_SECTION_ROLES = ["Client Representative"];

export type ParticipantSection = "design_team" | "consultants" | "client_representatives" | "main_client" | "all";

export function sectionRoleNames(section: ParticipantSection): string[] | null {
  switch (section) {
    case "design_team":
      return DESIGN_TEAM_SECTION_ROLES;
    case "consultants":
      return CONSULTANTS_SECTION_ROLES;
    case "client_representatives":
      return CLIENT_REPRESENTATIVES_SECTION_ROLES;
    case "main_client":
      return ["Main Client"];
    case "all":
      return null; // no filtering — every project role
  }
}
