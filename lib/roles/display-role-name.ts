/**
 * Sprint 5.9, Module 6: a defensive display-layer safety net, not the fix
 * itself. The real fix is that `createFirm()`/`createProject()` assign
 * "Lead Architect" going forward, plus a one-time data migration
 * (`20260807095000_migrate_owner_to_lead_architect.sql`) for rows created
 * by earlier sprints. This helper exists only to guarantee the brief's own
 * hard requirement — "Do not display Owner anywhere. Everywhere." — holds
 * even if some environment's data migration hasn't run yet, or a future
 * write path is added that forgets the rule. Apply at every role-name
 * render site (Participants, Discussions, Notifications, Approvals,
 * Timeline, Governance, Dashboard, Firm Team).
 */
export function toDisplayRoleName(roleName: string | null | undefined): string {
  if (!roleName) return roleName ?? "";
  return roleName === "Owner" ? "Lead Architect" : roleName;
}
