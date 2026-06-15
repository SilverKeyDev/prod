import { useEffect, useRef, useState } from "react";

import { useGoogleMaps } from "packages/hooks/data";
import { useResponsive } from "packages/hooks/ui";
import { log } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";

import { getOnboardingStepsUi } from "@/features/profile/components/profilePicture/profileStepsUi";

import { useOnboardingAffordability } from "./useOnboardingAffordability";
import { getScriptsReady } from "./useOnboardingForm.helpers";
import { useOnboardingFormCore } from "./useOnboardingFormCore";

export type UseOnboardingFormOptions = {
  /** When provided, called on successful submit (native uses this; web uses navigate). */
  onSubmitSuccess?: () => void;
};

export function useOnboardingForm(_options?: UseOnboardingFormOptions) {
  const { navigateToPath } = useNavigation();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const userRef = useRef(user);
  userRef.current = user;
  const { isMdUp } = useResponsive();
  const [scriptsReadyState, setScriptsReadyState] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const core = useOnboardingFormCore({
    getSteps: (formData) => getOnboardingStepsUi(formData),
    navigate: (path: string) => navigateToPath(path),
    afterPreferencesSuccess: () => {
      const current = userRef.current;
      if (current) setUser({ ...current, has_preferences: true });
    },
  });

  const {
    homePriceLoading,
    homePriceError,
    homePriceResult,
    isAffordabilityCollapsed,
    setIsAffordabilityCollapsed,
    resolvedZipCode,
  } = useOnboardingAffordability(core.formData, core.currentStep, core.steps);

  const { isLoaded: googleMapsLoaded, error: googleMapsError } = useGoogleMaps();

  useEffect(() => {
    if (googleMapsError) {
      log.error("ERRORS", "Google Maps loading error", googleMapsError);
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
    resolvedZipCode,
    isDesktop: isMdUp,
  };
}
