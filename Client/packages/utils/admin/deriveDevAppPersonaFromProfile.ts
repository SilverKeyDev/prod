export type DevAppPersonaProfileInput = {
  is_agent: boolean;
  roles?: readonly string[] | undefined;
  brokerage_org_ids?: readonly string[] | null | undefined;
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
 * Maps persisted profile (`users.is_agent` + roles / brokerage org ids) to the dev persona
 * buttons. Buyer vs seller uses `user_roles` when present; defaults to buyer for client shell.
 */
export function deriveDevAppPersonaFromProfile(
  user: DevAppPersonaProfileInput | null | undefined
): "agent" | "broker" | "buyer" | "seller" | null {
  if (!user) return null;

  if (user.is_agent) {
    const roleSet = normalizeRoles(user.roles);
    const hasBrokerageOrg =
      user.brokerage_org_ids?.some((id) => typeof id === "string" && id.trim().length > 0) ?? false;
    if (
      hasBrokerageOrg ||
      roleSet.has("brokerage_admin") ||
      roleSet.has("brokerage_administrator") ||
      roleSet.has("broker_admin")
    ) {
      return "broker";
    }
    return "agent";
  }

  const roleSet = normalizeRoles(user.roles);
  if (roleSet.has("seller") && !roleSet.has("buyer")) return "seller";
  if (roleSet.has("buyer") && !roleSet.has("seller")) return "buyer";
  if (roleSet.has("seller") && roleSet.has("buyer")) return "buyer";
  return "buyer";
}
