import type { OnboardingData } from "packages/features/profile/types/onboarding";
import type { ProfileStepId } from "packages/features/profile/types/profileStepIds";

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
