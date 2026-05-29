import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import type { ProfileStepId } from "packages/features/profile/types/onboarding/profileStepIds";

export type RenderOnboardingStepProps = {
  stepId: ProfileStepId;
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData | string, value: unknown) => void;
  patchBuyerPreferenceExtensions?: (
    fn: (
      prev: OnboardingData["buyerPreferenceExtensions"]
    ) => NonNullable<OnboardingData["buyerPreferenceExtensions"]>
  ) => void;
  scriptsReady?: boolean;
  loadError?: string | null;
};
