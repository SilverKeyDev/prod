import { useCallback } from "react";

import { preferencesApi } from "packages/config/api";
import type { OnboardingData } from "packages/utils/domain/profile";
import type { PreferencesSubmitResult } from "packages/utils/domain/profile";

/**
 * Returns a stable submitPreferences callback for use with handleSubmit (utils/profile).
 * Allows components to avoid importing config/api directly.
 */
export function usePreferencesSubmit(): (
  formData: OnboardingData,
) => Promise<PreferencesSubmitResult> {
  return useCallback(
    (formData: OnboardingData) => preferencesApi.createOrUpdate(formData),
    [],
  );
}
