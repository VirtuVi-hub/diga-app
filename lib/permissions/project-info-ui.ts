/**
 * TEMPORARY (pre-authentication): there is no real signed-in user yet to
 * check a role against, so every user is assumed to be the Lead Architect
 * and can always see the Project page. This is the ONLY place that
 * assumption lives — once authentication exists, replace this function
 * body with a real role check and no other file needs to change.
 */
export function canViewProjectInfo(): boolean {
  return true;
}
