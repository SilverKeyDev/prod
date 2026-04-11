import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { usePreferencesSubmit } from "packages/features/homeauth/hooks/data/usePreferencesSubmit";
import { showErrorToast } from "packages/hooks/ui";

import type { ProfileStep } from "@/features/profile/utils";
import {
  handleSubmit as handleSubmitUtil,
  nextPreferencesVersion,
  type OnboardingData,
} from "@/features/profile/utils";

import {
  getOnboardingDraftFromStorage,
  persistOnboardingDraft,
} from "./useOnboardingForm.helpers";

export type UseOnboardingFormCoreOptions = {
  /** Steps depend on formData so agent steps can be included when is_agent is yes/am_agent. */
  getSteps: (formData: OnboardingData) => ProfileStep[];
  /** When provided, called on successful submit instead of navigate (e.g. React Native). */
  onSubmitSuccess?: () => void;
  /** When provided (web), used to navigate after submit. */
  navigate?: (path: string) => void;
};

/**
 * Shared onboarding form state and submit logic. Platform wrappers pass getSteps(formData), validate, and navigation.
 */
export function useOnboardingFormCore(options: UseOnboardingFormCoreOptions) {
  const { getSteps, onSubmitSuccess, navigate } = options;
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>(() => {
    const draft = getOnboardingDraftFromStorage();
    return draft ?? { important_locations: [] };
  });
  const skipNextPersistRef = useRef(true);
  const steps = useMemo(() => getSteps(formData), [getSteps, formData]);
  const submitPreferences = usePreferencesSubmit();

  const [loading, setLoading] = useState(false);

  const updateFormData = useCallback(
    (field: string | number | symbol, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const patchBuyerPreferenceExtensions = useCallback(
    (
      fn: (
        prev: OnboardingData["buyerPreferenceExtensions"],
      ) => NonNullable<OnboardingData["buyerPreferenceExtensions"]>,
    ) => {
      setFormData((prev) => ({
        ...prev,
        buyerPreferenceExtensions: fn(prev.buyerPreferenceExtensions),
      }));
    },
    [],
  );

  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
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
    const dataToSave: OnboardingData = {
      ...formData,
      preferences_version: nextPreferencesVersion(formData.preferences_version),
    };
    await handleSubmitUtil({
      formData: dataToSave,
      submitPreferences,
      setLoading,
      navigate,
      onSuccessNavigate: onSubmitSuccess,
      skipValidation: true,
      onShowError: showErrorToast,
    });
  }, [formData, submitPreferences, navigate, onSubmitSuccess]);

  return {
    steps,
    formData,
    updateFormData,
    patchBuyerPreferenceExtensions,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    goToStep,
    loading,
    handleSubmit,
  };
}
