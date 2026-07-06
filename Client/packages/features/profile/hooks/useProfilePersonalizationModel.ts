import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getPersonalizationStepsUi } from "packages/features/profile/components/profilePicture/profileStepsUi";
import {
  handleSubmit as handleSubmitUtil,
  isAgentIdentityForProfileUi,
  nextPreferencesVersion,
  type OnboardingData,
  resolveAgentPublicProfileShare,
  userPreferencesToOnboardingData,
  type ValidationResult,
} from "packages/features/profile/utils";
import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import { useUserData, useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { log } from "packages/logger";
import { useAuthStore } from "packages/store";

export type ProfileAgentSubject = { userId: string; displayName: string };

export type UseProfilePersonalizationModelOptions = {
  agentSubject?: ProfileAgentSubject | null;
  onSaveSuccess?: (saved: OnboardingData) => void;
  setLoading?: (loading: boolean) => void;
  setValidationResult?: (result: { missingFields: string[]; errors: string[] }) => void;
  setShowValidationWarning?: (show: boolean) => void;
  validateFunction?: (formData: OnboardingData) => ValidationResult;
  /** Defaults to false when validateFunction is set; true otherwise. */
  skipValidation?: boolean;
};

export function useProfilePersonalizationModel({
  agentSubject = null,
  onSaveSuccess,
  setLoading,
  setValidationResult,
  setShowValidationWarning,
  validateFunction,
  skipValidation,
}: UseProfilePersonalizationModelOptions = {}) {
  const skipValidationResolved = skipValidation ?? validateFunction == null;
  const { userProfile } = useUserData();
  const { userPreferences, preferencesLoading, preferencesError, refreshUserPreferences } =
    useUserPreferences(
      agentSubject != null ? { preferencesSubjectUserId: agentSubject.userId } : undefined
    );
  const submitPreferences = usePreferencesSubmit();
  const isAgent = useIsAgent();
  const authUser = useAuthStore((s) => s.user);

  const profileForSync = useMemo(
    () => (agentSubject != null ? { name: agentSubject.displayName } : (userProfile ?? undefined)),
    [agentSubject, userProfile]
  );

  const isAgentForProfileUi = useMemo(
    () =>
      agentSubject != null
        ? isAgentIdentityForProfileUi(false, { roles: [] })
        : isAgentIdentityForProfileUi(isAgent, userProfile),
    [agentSubject, isAgent, userProfile]
  );

  const {
    show: showAgentPublicProfileShare,
    agentId: agentPublicProfileUserId,
    displayName: agentPublicProfileDisplayName,
  } = useMemo(
    () =>
      agentSubject != null
        ? { show: false, agentId: "", displayName: null as string | null }
        : resolveAgentPublicProfileShare({
            storeIsAgent: isAgent,
            authUser,
            userProfile,
          }),
    [agentSubject, isAgent, authUser, userProfile]
  );

  const STEPS = useMemo(() => {
    const base = getPersonalizationStepsUi(isAgentForProfileUi);
    if (agentSubject != null) {
      return base.filter((s) => s.id !== "privacy_data");
    }
    return base;
  }, [isAgentForProfileUi, agentSubject]);

  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const hasInitializedFormRef = useRef(false);

  useEffect(() => {
    hasInitializedFormRef.current = false;
  }, [agentSubject?.userId]);

  useEffect(() => {
    if (preferencesLoading) return;
    if (hasInitializedFormRef.current) return;
    hasInitializedFormRef.current = true;
    const normalized = userPreferencesToOnboardingData(
      userPreferences ? (userPreferences as Record<string, unknown>) : null,
      profileForSync
    );
    setFormData(normalized);
    setOriginalData(normalized);
  }, [preferencesLoading, userPreferences, profileForSync]);

  useEffect(() => {
    if (agentSubject != null) return;
    if (!hasInitializedFormRef.current) return;
    const nameFromProfile =
      userProfile != null && typeof userProfile.name === "string" && userProfile.name.trim() !== ""
        ? userProfile.name.trim()
        : undefined;
    if (!nameFromProfile) return;
    setFormData((prev) => (prev.name ? prev : { ...prev, name: nameFromProfile }));
    setOriginalData((prev) => (prev.name ? prev : { ...prev, name: nameFromProfile }));
  }, [agentSubject, userProfile]);

  const updateField = useCallback((field: keyof OnboardingData, value: unknown) => {
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

  const handleCancel = useCallback(() => {
    setFormData(originalData);
    setIsEditMode(false);
  }, [originalData]);

  const handleSave = useCallback(async () => {
    const newVersion = nextPreferencesVersion(formData.preferences_version);
    const dataToSave: OnboardingData = {
      ...formData,
      preferences_version: newVersion,
    };

    await handleSubmitUtil({
      formData: dataToSave,
      submitPreferences,
      setLoading,
      setValidationResult,
      setShowValidationWarning,
      validateFunction,
      skipValidation: skipValidationResolved,
      onShowError: showErrorToast,
      onSuccess: () => {
        setFormData(dataToSave);
        setOriginalData(dataToSave);
        setIsEditMode(false);
        onSaveSuccess?.(dataToSave);
        log.info("API", "Preferences saved successfully");
      },
      onError: (error) => {
        log.error("ERRORS", "Failed to update preferences", error);
        showErrorToast("Failed to update preferences. Please try again.");
      },
    });
  }, [
    formData,
    submitPreferences,
    setLoading,
    setValidationResult,
    setShowValidationWarning,
    validateFunction,
    skipValidationResolved,
    onSaveSuccess,
  ]);

  const showPrefsLoading =
    agentSubject != null ? preferencesLoading : preferencesLoading && userPreferences === undefined;

  const effectiveEditMode = agentSubject != null ? false : isEditMode;

  return {
    agentSubject,
    userProfile,
    userPreferences,
    preferencesLoading,
    preferencesError,
    refreshUserPreferences,
    profileForSync,
    isAgentForProfileUi,
    STEPS,
    showAgentPublicProfileShare,
    agentPublicProfileUserId,
    agentPublicProfileDisplayName,
    formData,
    originalData,
    isEditMode,
    setIsEditMode,
    effectiveEditMode,
    updateField,
    patchBuyerPreferenceExtensions,
    handleCancel,
    handleSave,
    showPrefsLoading,
  };
}
