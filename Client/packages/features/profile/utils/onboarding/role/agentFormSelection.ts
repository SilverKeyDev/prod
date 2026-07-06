import type { PrimaryOnboardingRole } from "./onboardingRoleTypes";

/** True when draft primary onboarding role is agent (aligns with `user_roles` / `useIsAgent`). */
export function isAgentFormSelection(primaryRole: PrimaryOnboardingRole | undefined): boolean {
  return primaryRole === "agent";
}

/**
 * For buyer-preference UI (optional callouts): true if the auth user is an agent or the form
 * draft says agent (onboarding before store updates).
 */
export function effectiveIsAgentForOptionalBuyerUi(options: {
  authIsAgent: boolean;
  formPrimaryRole?: PrimaryOnboardingRole;
}): boolean {
  return options.authIsAgent || isAgentFormSelection(options.formPrimaryRole);
}
