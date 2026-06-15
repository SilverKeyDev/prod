import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import type { ProfileStepId } from "packages/features/profile/types/onboarding/profileStepIds";
import type { HomePriceResult } from "packages/utils/transaction/affordability";

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
  homePriceLoading?: boolean;
  homePriceError?: string | null;
  homePriceResult?: HomePriceResult | null;
  isAffordabilityCollapsed?: boolean;
  setIsAffordabilityCollapsed?: (collapsed: boolean) => void;
  resolvedZipCode?: string;
};
