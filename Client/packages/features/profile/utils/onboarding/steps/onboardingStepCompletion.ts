import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { isStepCompleteForOnboarding } from "packages/features/profile/utils/onboarding/registry/stepCompletion";

/**
 * Returns true when every field on the given onboarding step is filled.
 * Used to show "Skip" (white) vs "Next" (primary): when not complete, show Skip.
 * Demographics (About You) never shows Skip regardless of completion.
 */
export function isOnboardingStepComplete(formData: OnboardingData, stepId: string): boolean {
  return isStepCompleteForOnboarding(formData, stepId);
}
