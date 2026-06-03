import type { Workspace } from "packages/utils/workspace";

export type DevAppPersonaProfileInput = {
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

function hasBrokerageSignals(
  roleSet: Set<string>,
  brokerageOrgIds: readonly string[] | null | undefined
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

function hasIntegrationPartnerSignals(roleSet: Set<string>): boolean {
  return (
    roleSet.has("integration_partner") ||
    roleSet.has("partner_integration") ||
    roleSet.has("integration_partner_admin")
  );
}

/**
 * Maps persisted profile (roles / brokerage org ids) to the active
 * dev workspace persona. Mirrors production identity → workspace derivation for a single hat.
 */
export function deriveDevAppPersonaFromProfile(
  user: DevAppPersonaProfileInput | null | undefined
): Workspace | null {
  if (!user) return null;

  const roleSet = normalizeRoles(user.roles);

  if (hasIntegrationPartnerSignals(roleSet)) {
    return "integration_partner";
  }

  if (hasBrokerageSignals(roleSet, user.brokerage_org_ids)) {
    return "brokerage";
  }

  if (user.roles?.includes("agent")) {
    return "agent";
  }

  if (roleSet.has("seller") && !roleSet.has("buyer")) {
    return "seller";
  }

  return "buyer";
}
