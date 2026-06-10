import type React from "react";

import type { OnboardingData, ValidationResult } from "packages/features/profile/utils";

export type ProfileAgentSubject = {
  userId: string;
  displayName: string;
};

export type ProfileFeatureProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
  /** When set, loads that user's preferences read-only (e.g. agent client hub). */
  agentSubject?: ProfileAgentSubject | null;
  /** Settings personalization runs section validation before save; profile screen skips by default. */
  validateFunction?: (formData: OnboardingData) => ValidationResult;
  skipValidation?: boolean;
};
