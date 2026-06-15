import { getOnboardingStepsMobile, primaryOnboardingRoleFromForm } from "packages/features/profile";

import { useOnboardingAffordability } from "./useOnboardingAffordability";
import { useOnboardingFormCore } from "./useOnboardingFormCore";

export type UseOnboardingFormOptions = {
  /** When provided, called on successful submit instead of navigate("/dashboard") (e.g. React Navigation reset). */
  onSubmitSuccess?: () => void;
};

export function useOnboardingForm(options: UseOnboardingFormOptions = {}) {
  const { onSubmitSuccess } = options;

  const core = useOnboardingFormCore({
    getSteps: (formData) =>
      getOnboardingStepsMobile({
        isAgent: primaryOnboardingRoleFromForm(formData) === "agent",
        primaryRole: primaryOnboardingRoleFromForm(formData),
      }),
    onSubmitSuccess,
  });

  const {
    homePriceLoading,
    homePriceError,
    homePriceResult,
    isAffordabilityCollapsed,
    setIsAffordabilityCollapsed,
    resolvedZipCode,
  } = useOnboardingAffordability(core.formData, core.currentStep, core.steps);

  return {
    ...core,
    scriptsReady: false,
    loadError: null,
    homePriceLoading,
    homePriceError,
    homePriceResult,
    isAffordabilityCollapsed,
    setIsAffordabilityCollapsed,
    resolvedZipCode,
  };
}
