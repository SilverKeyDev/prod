import { useCallback, useEffect, useMemo, useState } from "react";

import { usePreferencesSubmit } from "packages/features/homeauth/hooks/data/usePreferencesSubmit";
import { showErrorToast } from "packages/hooks/ui";

import type { ProfileStep, ValidationResult } from "@/features/profile/utils";
import { handleSubmit as handleSubmitUtil, type OnboardingData } from "@/features/profile/utils";

import { getOnboardingDraftFromStorage, persistOnboardingDraft } from "./useOnboardingForm.helpers";

export type UseOnboardingFormCoreOptions = {
  getSteps: () => ProfileStep[];
  validate: (data: OnboardingData) => ValidationResult;
  /** When provided, called on successful submit instead of navigate (e.g. React Native). */
  onSubmitSuccess?: () => void;
  /** When provided (web), used to navigate after submit. */
  navigate?: (path: string) => void;
};

/**
 * Shared onboarding form state and submit logic. Platform wrappers pass getSteps, validate, and navigation.
 */
export function useOnboardingFormCore(options: UseOnboardingFormCoreOptions) {
  const { getSteps, validate, onSubmitSuccess, navigate } = options;
  const steps = useMemo(() => getSteps(), [getSteps]);
  const submitPreferences = usePreferencesSubmit();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    important_locations: [],
  });
  const [loading, setLoading] = useState(false);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    missingFields: string[];
    errors: string[];
  }>({ missingFields: [], errors: [] });

  const updateFormData = useCallback((field: string | number | symbol, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    const draft = getOnboardingDraftFromStorage();
    setFormData(draft ?? { important_locations: [] });
  }, []);

  useEffect(() => {
    persistOnboardingDraft(formData);
  }, [formData]);

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
      navigate,
      onSuccessNavigate: onSubmitSuccess,
      validateFunction: validate,
      onShowError: showErrorToast,
    });
  }, [formData, submitPreferences, navigate, onSubmitSuccess, validate]);

  const handleCloseValidationWarning = useCallback(() => {
    setShowValidationWarning(false);
  }, []);

  const handleReviewInformation = useCallback(() => {
    setShowValidationWarning(false);
    const firstMissingField = validationResult.missingFields[0];
    if (firstMissingField) {
      if (
        firstMissingField.includes("Age") ||
        firstMissingField.includes("Agent") ||
        firstMissingField.includes("Children")
      )
        setCurrentStep(0);
      else if (firstMissingField.includes("bedroom") || firstMissingField.includes("bathroom"))
        setCurrentStep(1);
      else if (firstMissingField.includes("location")) setCurrentStep(2);
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
    showValidationWarning,
    validationResult,
    handleSubmit,
    handleCloseValidationWarning,
    handleReviewInformation,
  };
}
