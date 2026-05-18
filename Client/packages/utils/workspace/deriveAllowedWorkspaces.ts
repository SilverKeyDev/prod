/**
 * Pure derivation of UX workspaces from server-driven identity.
 * Server remains source of truth; this only mirrors what the client may present.
 */

export type Workspace = "buyer" | "seller" | "agent" | "brokerage";

export type DeriveAllowedWorkspacesInput = {
  isAgent: boolean;
  /** Role strings from user_roles (e.g. buyer, seller, admin). Lowercased when matching. */
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

/**
 * Computes which workspace tabs a user may open. Multi-hat users get multiple entries.
 */
export function deriveAllowedWorkspaces(input: DeriveAllowedWorkspacesInput): Workspace[] {
  const { isAgent, roles, brokerageOrgIds } = input;
  const roleSet = normalizeRoles(roles);
  const out = new Set<Workspace>();

  if (isAgent) {
    out.add("agent");
  }

  if (!isAgent) {
    if (roleSet.has("buyer")) out.add("buyer");
    if (roleSet.has("seller")) out.add("seller");
    if (!roleSet.has("buyer") && !roleSet.has("seller")) {
      out.add("buyer");
    }
  } else {
    if (roleSet.has("buyer")) out.add("buyer");
    if (roleSet.has("seller")) out.add("seller");
  }

  if (
    roleSet.has("brokerage_admin") ||
    roleSet.has("brokerage_administrator") ||
    roleSet.has("broker_admin")
  ) {
    out.add("brokerage");
  }

  if (brokerageOrgIds?.some((id) => typeof id === "string" && id.trim().length > 0)) {
    out.add("brokerage");
  }

  const list = [...out];
  if (list.length > 0) return list;
  return isAgent ? ["agent"] : ["buyer"];
}

export function isWorkspace(value: string | null | undefined): value is Workspace {
  return value === "buyer" || value === "seller" || value === "agent" || value === "brokerage";
}
