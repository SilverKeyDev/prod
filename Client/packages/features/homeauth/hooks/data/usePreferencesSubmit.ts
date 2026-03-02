import { useCallback } from "react";

import { preferencesApi } from "@/features/homeauth/api/preferences";
import type { OnboardingData } from "@/features/profile/utils";
import type { PreferencesSubmitResult } from "@/features/profile/utils";

/**
 * Returns a stable submitPreferences callback for use with handleSubmit (utils/profile).
 * Allows components to avoid importing config/api directly.
 */
export function usePreferencesSubmit(): (
  formData: OnboardingData
) => Promise<PreferencesSubmitResult> {
  return useCallback((formData: OnboardingData) => preferencesApi.createOrUpdate(formData), []);
}
