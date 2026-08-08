type RoleClaims = Record<string, unknown>;

function getRole(claims: unknown): string | null {
  if (!claims || typeof claims !== "object") {
    return null;
  }

  const role = (claims as RoleClaims).role;

  return typeof role === "string" ? role : null;
}

export function canViewContractPackage(user: {
  app_metadata: unknown;
  user_metadata: unknown;
} | null): boolean {
  const role = getRole(user?.app_metadata) ?? getRole(user?.user_metadata);

  const normalizedRole = role?.trim().toLowerCase();

  return normalizedRole === "lead architect" || normalizedRole === "client";
}
