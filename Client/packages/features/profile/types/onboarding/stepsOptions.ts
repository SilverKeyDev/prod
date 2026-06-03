import type { PrimaryOnboardingRole } from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";

export type GetOnboardingStepsOptions = {
  /** When true, financial step is excluded. Use feature flags to control step availability. */
  excludeFinancial?: boolean;
  /** When true, insert agent steps after demographics (onboarding/profile). */
  isAgent?: boolean;
  /** First-screen role; drives seller short path vs full buyer flow. */
  primaryRole?: PrimaryOnboardingRole;
};

export type GetPersonalizationStepsOptions = {
  /** When true, include agent steps after demographics. */
  isAgent?: boolean;
};
