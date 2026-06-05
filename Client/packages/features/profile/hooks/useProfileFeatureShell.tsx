import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PersonalizationMobileHeader from "packages/features/profile/components/account/MobileHeader";
import { getPersonalizationStepsUi } from "packages/features/profile/components/profilePicture/profileStepsUi";
import type { ProfileFeatureProps } from "packages/features/profile/components/settings/inputs/profileFeatureTypes";
import { useGoogleMapsPlacesReady } from "packages/features/profile/hooks/useGoogleMapsPlacesReady";
import { usePersonalizationScrollActiveSection } from "packages/features/profile/hooks/usePersonalizationScrollActiveSection";
import { useProfileDocSignOAuthReturn } from "packages/features/profile/hooks/useProfileDocSignOAuthReturn";
import { scrollToPersonalizationSection } from "packages/features/profile/utils/personalization/personalizationScrollActiveSection";
import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import { useUserData, useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { useResponsive } from "packages/hooks/ui";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { log } from "packages/logger";
import { useNavigation } from "packages/navigation/hooks/useNavigation";
import { useAuthStore } from "packages/store";

import {
  handleSubmit as handleSubmitUtil,
  isAgentIdentityForProfileUi,
  nextPreferencesVersion,
  type OnboardingData,
  resolveAgentPublicProfileShare,
  userPreferencesToOnboardingData,
} from "@/features/profile/utils";

const noopSetMobileHeaderActions = () => {};

export function useProfileFeatureShell({
  setMobileHeaderActions: setMobileHeaderActionsProp,
  agentSubject = null,
}: ProfileFeatureProps) {
  const setMobileHeaderActions = setMobileHeaderActionsProp ?? noopSetMobileHeaderActions;
  const navigation = useNavigation();
  useProfileDocSignOAuthReturn(navigation);
  const { userProfile } = useUserData();
  const { userPreferences, preferencesLoading, preferencesError } = useUserPreferences(
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

  const sectionIds = useMemo(() => STEPS.map((s) => s.id), [STEPS]);
  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(STEPS[0]?.id ?? "");
  const { scriptsReady, loadError } = useGoogleMapsPlacesReady();
  const hasInitializedFormRef = useRef(false);

  usePersonalizationScrollActiveSection(sectionIds, setActiveSection);

  useEffect(() => {
    hasInitializedFormRef.current = false;
  }, [agentSubject?.userId]);

  useEffect(() => {
    return () => {
      setMobileHeaderActions(null);
    };
  }, [setMobileHeaderActions]);

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

  useEffect(() => {
    if (STEPS.length > 0 && !STEPS.some((s) => s.id === activeSection)) {
      setActiveSection(STEPS[0]?.id ?? "");
    }
  }, [STEPS, activeSection]);

  const updateFormData = useCallback((field: keyof OnboardingData, value: unknown) => {
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

  const handleSaveChanges = useCallback(async () => {
    const newVersion = nextPreferencesVersion(formData.preferences_version);

    const dataToSave = {
      ...formData,
      preferences_version: newVersion,
    };

    await handleSubmitUtil({
      formData: dataToSave,
      submitPreferences,
      setLoading: setIsSaving,
      skipValidation: true,
      onShowError: showErrorToast,
      onSuccess: () => {
        const updatedFormData = {
          ...formData,
          preferences_version: newVersion,
        };
        setFormData(updatedFormData);
        setOriginalData(updatedFormData);
        setIsEditMode(false);
        log.info("API", "Preferences saved successfully");
      },
      onError: (error) => {
        log.error("ERRORS", "Failed to update preferences", error);
        showErrorToast("Failed to update preferences. Please try again.");
      },
    });
  }, [formData, submitPreferences]);

  const handleCancel = useCallback(() => {
    setFormData(originalData);
    setIsEditMode(false);
  }, [originalData]);

  const { isMdDown } = useResponsive();
  const isMobile = isMdDown;
  const isUltraSmallScreen = isMdDown;

  useEffect(() => {
    if (agentSubject != null) {
      setMobileHeaderActions(null);
      return;
    }
    if (isMobile) {
      setMobileHeaderActions(
        <PersonalizationMobileHeader
          isEditMode={isEditMode}
          isSaving={isSaving}
          onEdit={() => setIsEditMode(true)}
          onCancel={handleCancel}
          onSave={handleSaveChanges}
        />
      );
    } else {
      setMobileHeaderActions(null);
    }
  }, [
    agentSubject,
    isMobile,
    isEditMode,
    isSaving,
    setMobileHeaderActions,
    handleCancel,
    handleSaveChanges,
  ]);

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    scrollToPersonalizationSection(sectionId);
  }, []);

  const showPrefsLoading =
    agentSubject != null ? preferencesLoading : preferencesLoading && userPreferences === undefined;

  return {
    agentSubject,
    isAgentForProfileUi,
    preferencesError,
    showPrefsLoading,
    STEPS,
    formData,
    isEditMode,
    isSaving,
    activeSection,
    scriptsReady,
    loadError,
    isUltraSmallScreen,
    isMdDown,
    showAgentPublicProfileShare,
    agentPublicProfileUserId,
    agentPublicProfileDisplayName,
    updateFormData,
    patchBuyerPreferenceExtensions,
    handleSaveChanges,
    handleCancel,
    scrollToSection,
    setIsEditMode,
  };
}
