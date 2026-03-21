import { useEffect, useMemo, useState } from "react";

import { useGoogleMaps } from "packages/hooks/data/useGoogleMaps";
import { useResponsive } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";

import { getOnboardingStepsUi } from "@/features/profile/components/profilePicture/profileStepsUi";
import { isOnboardingStepComplete } from "@/features/profile/utils";

import { useOnboardingAffordability } from "./useOnboardingAffordability";
import { getScriptsReady } from "./useOnboardingForm.helpers";
import { useOnboardingFormCore } from "./useOnboardingFormCore";

export type UseOnboardingFormOptions = {
  /** When provided, called on successful submit (native uses this; web uses navigate). */
  onSubmitSuccess?: () => void;
};

export function useOnboardingForm(_options?: UseOnboardingFormOptions) {
  const { navigateToPath } = useNavigation();
  const { isMdUp } = useResponsive();
  const [scriptsReadyState, setScriptsReadyState] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const core = useOnboardingFormCore({
    getSteps: (formData) => getOnboardingStepsUi(formData),
    navigate: (path: string) => navigateToPath(path),
  });

  const {
    homePriceLoading,
    homePriceError,
    homePriceResult,
    isAffordabilityCollapsed,
    setIsAffordabilityCollapsed,
  } = useOnboardingAffordability(core.formData, core.currentStep, core.steps);

  const { isLoaded: googleMapsLoaded, error: googleMapsError } = useGoogleMaps();

  const currentStepId = core.steps[core.currentStep]?.id ?? "";
  const isCurrentStepComplete = useMemo(
    () => isOnboardingStepComplete(core.formData, currentStepId),
    [core.formData, currentStepId]
  );
  const showSkipOnNext = currentStepId !== "demographics" && !isCurrentStepComplete;

  useEffect(() => {
    if (googleMapsError) {
      log.error(LOG_CATEGORIES.ERRORS, "Google Maps loading error", googleMapsError);
      setLoadError("Failed to load Google Maps script.");
      return;
    }
    if (getScriptsReady(googleMapsLoaded, googleMapsError)) {
      setScriptsReadyState(true);
    }
  }, [googleMapsLoaded, googleMapsError]);

  return {
    ...core,
    scriptsReady: scriptsReadyState,
    loadError,
    homePriceLoading,
    homePriceError,
    homePriceResult,
    isAffordabilityCollapsed,
    setIsAffordabilityCollapsed,
    isDesktop: isMdUp,
    showSkipOnNext,
  };
}
