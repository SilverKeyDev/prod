/**
 * Pure derivation of UX workspaces from server-driven identity.
 * Server remains source of truth; this only mirrors what the client may present.
 */

export type Workspace =
  | "buyer"
  | "seller"
  | "renter"
  | "agent"
  | "brokerage"
  | "integration_partner";

/** All UX shells — used by admin dev preview; identity may allow fewer in production. */
export const ALL_WORKSPACES: readonly Workspace[] = [
  "buyer",
  "seller",
  "renter",
  "agent",
  "brokerage",
  "integration_partner",
] as const;

export type DeriveAllowedWorkspacesInput = {
  /** Role strings from user_roles (e.g. buyer, seller, agent). Lowercased when matching. */
  roles?: readonly string[] | undefined;
  /** When populated from profile/bootstrap, grants brokerage workspace without role heuristics. */
  brokerageOrgIds?: readonly string[] | undefined;
};

function normalizeRoles(roles: readonly string[] | undefined): Set<string> {
  const set = new Set<string>();
  if (!roles?.length) return set;
  for (const r of roles) {
    if (typeof r === "string" && r.trim()) set.add(r.trim().toLowerCase());
  }
  return set;
}

function hasBrokerageAccess(
  roleSet: Set<string>,
  brokerageOrgIds: readonly string[] | undefined
): boolean {
  if (brokerageOrgIds?.some((id) => typeof id === "string" && id.trim().length > 0)) {
    return true;
  }
  return (
    roleSet.has("brokerage_admin") ||
    roleSet.has("brokerage_administrator") ||
    roleSet.has("broker_admin")
  );
}

function hasIntegrationPartnerAccess(roleSet: Set<string>): boolean {
  return (
    roleSet.has("integration_partner") ||
    roleSet.has("partner_integration") ||
    roleSet.has("integration_partner_admin")
  );
}

/**
 * Computes which workspace tabs a user may open. Multi-hat users get multiple entries.
 */
export function deriveAllowedWorkspaces(input: DeriveAllowedWorkspacesInput): Workspace[] {
  const { roles, brokerageOrgIds } = input;
  const roleSet = normalizeRoles(roles);
  const isAgent = roleSet.has("agent");
  const hasBrokerage = hasBrokerageAccess(roleSet, brokerageOrgIds);
  const hasPartner = hasIntegrationPartnerAccess(roleSet);
  const out = new Set<Workspace>();

  if (isAgent) {
    out.add("agent");
  }

  if (!isAgent) {
    if (roleSet.has("buyer")) out.add("buyer");
    if (roleSet.has("seller")) out.add("seller");
    if (roleSet.has("renter")) out.add("renter");
    if (
      !roleSet.has("buyer") &&
      !roleSet.has("seller") &&
      !roleSet.has("renter") &&
      !hasBrokerage &&
      !hasPartner
    ) {
      out.add("buyer");
    }
  } else {
    if (roleSet.has("buyer")) out.add("buyer");
    if (roleSet.has("seller")) out.add("seller");
    if (roleSet.has("renter")) out.add("renter");
  }

  if (hasBrokerage) {
    out.add("brokerage");
  }

  if (hasPartner) {
    out.add("integration_partner");
  }

  const list = [...out];
  if (list.length > 0) return list;
  return isAgent ? ["agent"] : ["buyer"];
}

export function isWorkspace(value: string | null | undefined): value is Workspace {
  return (
    value === "buyer" ||
    value === "seller" ||
    value === "renter" ||
    value === "agent" ||
    value === "brokerage" ||
    value === "integration_partner"
  );
}
