import type { Workspace } from "packages/utils/product/workspace";

import type { PrimaryOnboardingRole } from "./onboardingRoleSelection";

export type PostOnboardingTarget = {
  workspace: Workspace;
  path: string;
};

const PLACEHOLDER_SHELL_ROLES = new Set<PrimaryOnboardingRole>([
  "seller",
  "brokerage",
  "integration_partner",
]);

/**
 * Post-onboarding route and workspace for a resolved primary onboarding role.
 * Placeholder shells land on /dashboard; buyer and agent keep /search.
 */
export function postOnboardingTargetForPrimaryRole(
  role: PrimaryOnboardingRole | undefined
): PostOnboardingTarget {
  if (role === "seller") {
    return { workspace: "seller", path: "/dashboard" };
  }
  if (role === "brokerage") {
    return { workspace: "brokerage", path: "/dashboard" };
  }
  if (role === "integration_partner") {
    return { workspace: "integration_partner", path: "/dashboard" };
  }
  if (role === "agent") {
    return { workspace: "agent", path: "/search" };
  }
  return { workspace: "buyer", path: "/search" };
}

export function isPlaceholderShellOnboardingRole(role: PrimaryOnboardingRole | undefined): boolean {
  return role !== undefined && PLACEHOLDER_SHELL_ROLES.has(role);
}
