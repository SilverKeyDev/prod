export type GetOnboardingStepsOptions = {
  /** When true, financial step is excluded. Use feature flags to control step availability. */
  excludeFinancial?: boolean;
  /** When true, insert agent steps after demographics (onboarding/profile). */
  isAgent?: boolean;
};

export type GetPersonalizationStepsOptions = {
  /** When true, include agent steps after demographics. */
  isAgent?: boolean;
};
