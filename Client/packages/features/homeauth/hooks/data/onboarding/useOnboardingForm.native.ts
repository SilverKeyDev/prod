import { getOnboardingStepsMobile, validateOnboardingDataMobile } from "@/features/profile/utils";

import { useOnboardingFormCore } from "./useOnboardingFormCore";

export type UseOnboardingFormOptions = {
  /** When provided, called on successful submit instead of navigate("/search") (e.g. React Navigation reset). */
  onSubmitSuccess?: () => void;
};

export function useOnboardingForm(options: UseOnboardingFormOptions = {}) {
  const { onSubmitSuccess } = options;

  const core = useOnboardingFormCore({
    getSteps: getOnboardingStepsMobile,
    validate: validateOnboardingDataMobile,
    onSubmitSuccess,
  });

  return {
    ...core,
    scriptsReady: false,
    loadError: null,
  };
}
