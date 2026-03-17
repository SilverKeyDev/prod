import { useEffect, useState } from "react";

import { useGoogleMaps } from "packages/hooks/data/useGoogleMaps";
import { useResponsive } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";

import { getOnboardingStepsUi } from "@/features/profile/components/profilePicture/profileStepsUi";
import { validateOnboardingData } from "@/features/profile/utils";

import { useOnboardingAffordability } from "./useOnboardingAffordability";
import { getScriptsReady } from "./useOnboardingForm.helpers";
import { useOnboardingFormCore } from "./useOnboardingFormCore";

export function useOnboardingForm() {
  const { navigateToPath } = useNavigation();
  const { isMdUp } = useResponsive();
  const [scriptsReadyState, setScriptsReadyState] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const core = useOnboardingFormCore({
    getSteps: getOnboardingStepsUi,
    validate: validateOnboardingData,
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
  };
}
