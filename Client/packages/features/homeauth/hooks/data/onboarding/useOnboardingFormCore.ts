import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { usePreferencesSubmit } from "packages/features/homeauth/hooks/data/usePreferencesSubmit";
import type { ProfileStep } from "packages/features/profile";
import {
  handleSubmit as handleSubmitUtil,
  mergeOnboardingServerAndDraft,
  nextPreferencesVersion,
  type OnboardingData,
  postOnboardingWorkspaceForPrimaryRole,
  primaryOnboardingRoleFromForm,
} from "packages/features/profile";
import { useClientSettings } from "packages/hooks/data/user/useClientSettings";
import { useSetActiveWorkspace } from "packages/hooks/store";
import { showErrorToast } from "packages/hooks/ui";

import { getOnboardingDraftFromStorage, persistOnboardingDraft } from "./useOnboardingForm.helpers";

export type UseOnboardingFormCoreOptions = {
  /** Steps depend on formData so agent steps apply when primary_onboarding_role is agent. */
  getSteps: (formData: OnboardingData) => ProfileStep[];
  /** When provided, called on successful submit instead of navigate (e.g. React Native). */
  onSubmitSuccess?: () => void;
  /** Runs after prefs save succeeds, before navigate / onSubmitSuccess (e.g. update auth store on web). */
  afterPreferencesSuccess?: () => void;
  /** When provided (web), used to navigate after submit. */
  navigate?: (path: string) => void;
};

/**
 * Shared onboarding form state and submit logic. Platform wrappers pass getSteps(formData), validate, and navigation.
 */
export function useOnboardingFormCore(options: UseOnboardingFormCoreOptions) {
  const { getSteps, onSubmitSuccess, afterPreferencesSuccess, navigate } = options;
  const { clientSettings, clientSettingsQuery, patchClientSettings } = useClientSettings();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>(() => {
    const draft = getOnboardingDraftFromStorage();
    return draft ?? { important_locations: [] };
  });
  const skipNextPersistRef = useRef(true);
  const hydratedServerDraftRef = useRef(false);
  const steps = useMemo(() => getSteps(formData), [getSteps, formData]);
  const submitPreferences = usePreferencesSubmit();
  const setActiveWorkspace = useSetActiveWorkspace();

  const [loading, setLoading] = useState(false);

  const updateFormData = useCallback((field: string | number | symbol, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const patchBuyerPreferenceExtensions = useCallback(
    (
      fn: (
        prev: OnboardingData["buyerPreferenceExtensions"]
      ) => NonNullable<OnboardingData["buyerPreferenceExtensions"]>
    ) => {
      setFormData((prev) => ({
        ...prev,
        buyerPreferenceExtensions: fn(prev.buyerPreferenceExtensions),
      }));
    },
    []
  );

  useEffect(() => {
    if (hydratedServerDraftRef.current) return;
    if (clientSettingsQuery.isLoading) return;
    hydratedServerDraftRef.current = true;
    const raw = clientSettings?.onboarding_draft;
    if (!raw || typeof raw !== "object") return;
    setFormData((prev) => mergeOnboardingServerAndDraft(raw as OnboardingData, prev));
  }, [clientSettings?.onboarding_draft, clientSettingsQuery.isLoading]);

  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    persistOnboardingDraft(formData);
    patchClientSettings({
      onboarding_draft: formData as unknown as Record<string, unknown>,
    });
  }, [formData, patchClientSettings]);

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
      onSuccess: () => {
        const workspace = postOnboardingWorkspaceForPrimaryRole(
          primaryOnboardingRoleFromForm(dataToSave)
        );
        setActiveWorkspace(workspace);
        afterPreferencesSuccess?.();
      },
      onSuccessNavigate: onSubmitSuccess,
      skipValidation: true,
      onShowError: showErrorToast,
    });
  }, [
    formData,
    submitPreferences,
    navigate,
    onSubmitSuccess,
    afterPreferencesSuccess,
    setActiveWorkspace,
  ]);

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
