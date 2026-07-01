import { useCallback } from "react";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import type { PreferencesSubmitResult } from "packages/features/profile/types/onboarding/submitHandler";

import { preferencesApi } from "@/features/homeauth/api/preferences";

/**
 * Returns a stable submitPreferences callback for use with handleSubmit (utils/profile).
 * Allows components to avoid importing config/api directly.
 */
export function usePreferencesSubmit(): (
  formData: OnboardingData
) => Promise<PreferencesSubmitResult> {
  return useCallback((formData: OnboardingData) => preferencesApi.createOrUpdate(formData), []);
}
