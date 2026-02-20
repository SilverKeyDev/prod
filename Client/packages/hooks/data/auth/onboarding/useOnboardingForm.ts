import { useCallback, useEffect, useMemo, useState } from "react";

import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import { useGoogleMaps } from "packages/hooks/data/useGoogleMaps";
import { useResponsive } from "packages/hooks/ui";
import { showErrorToast } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import {
  getOnboardingSteps,
  handleSubmit as handleSubmitUtil,
  type OnboardingData,
} from "packages/utils/domain/profile";

import { useOnboardingAffordability } from "./useOnboardingAffordability";
import {
  getOnboardingDraftFromStorage,
  getScriptsReady,
  persistOnboardingDraft,
} from "./useOnboardingForm.helpers";

export function useOnboardingForm() {
  const steps = useMemo(() => getOnboardingSteps(), []);
  const { navigateToPath } = useNavigation();
  const { isMdUp } = useResponsive();
  const submitPreferences = usePreferencesSubmit();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    important_locations: [],
  });
  const [loading, setLoading] = useState(false);
  const [scriptsReadyState, setScriptsReadyState] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    missingFields: string[];
    errors: string[];
  }>({ missingFields: [], errors: [] });

  const {
    homePriceLoading,
    homePriceError,
    homePriceResult,
    isAffordabilityCollapsed,
    setIsAffordabilityCollapsed,
  } = useOnboardingAffordability(formData, currentStep, steps);

  const updateFormData = useCallback(
    (field: string | number | symbol, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  useEffect(() => {
    const draft = getOnboardingDraftFromStorage();
    setFormData(draft ?? { important_locations: [] });
  }, []);

  useEffect(() => {
    persistOnboardingDraft(formData);
  }, [formData]);

  const { isLoaded: googleMapsLoaded, error: googleMapsError } =
    useGoogleMaps();

  useEffect(() => {
    if (googleMapsError) {
      log.error(
        LOG_CATEGORIES.ERRORS,
        "Google Maps loading error",
        googleMapsError,
      );
      setLoadError("Failed to load Google Maps script.");
      return;
    }
    if (getScriptsReady(googleMapsLoaded, googleMapsError)) {
      setScriptsReadyState(true);
    }
  }, [googleMapsLoaded, googleMapsError]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
  }, []);

  const handleSubmit = useCallback(async () => {
    await handleSubmitUtil({
      formData,
      submitPreferences,
      setLoading,
      setValidationResult,
      setShowValidationWarning,
      navigate: (path: string) => navigateToPath(path),
      onShowError: showErrorToast,
    });
  }, [formData, submitPreferences, navigateToPath]);

  const handleCloseValidationWarning = useCallback(() => {
    setShowValidationWarning(false);
  }, []);

  const handleReviewInformation = useCallback(() => {
    setShowValidationWarning(false);
    const firstMissingField = validationResult.missingFields[0];
    if (firstMissingField) {
      if (firstMissingField.includes("Age")) setCurrentStep(0);
      else if (
        firstMissingField.includes("bedroom") ||
        firstMissingField.includes("bathroom")
      )
        setCurrentStep(1);
      else if (firstMissingField.includes("location")) setCurrentStep(2);
      else if (firstMissingField.includes("budget")) setCurrentStep(3);
    }
  }, [validationResult.missingFields]);

  return {
    steps,
    formData,
    updateFormData,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    goToStep,
    loading,
    scriptsReady: scriptsReadyState,
    loadError,
    showValidationWarning,
    validationResult,
    handleSubmit,
    handleCloseValidationWarning,
    handleReviewInformation,
    homePriceLoading,
    homePriceError,
    homePriceResult,
    isAffordabilityCollapsed,
    setIsAffordabilityCollapsed,
    isDesktop: isMdUp,
  };
}
