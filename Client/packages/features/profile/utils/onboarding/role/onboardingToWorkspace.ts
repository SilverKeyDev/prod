import type { Workspace } from "packages/utils/product/workspace";

import type { PrimaryOnboardingRole } from "./onboardingRoleSelection";

/**
 * Active workspace after onboarding for a resolved primary onboarding role.
 */
export function postOnboardingWorkspaceForPrimaryRole(
  role: PrimaryOnboardingRole | undefined
): Workspace {
  if (role === "seller") {
    return "seller";
  }
  if (role === "renter") {
    return "renter";
  }
  if (role === "brokerage") {
    return "brokerage";
  }
  if (role === "integration_partner") {
    return "integration_partner";
  }
  if (role === "agent") {
    return "agent";
  }
  return "buyer";
}
