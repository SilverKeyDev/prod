import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/// <reference types="google.maps" />
import PersonalizationMobileHeader from "packages/features/profile/components/account/MobileHeader";
import {
  convertStepsToNavItems,
  getPersonalizationStepsUi,
} from "packages/features/profile/components/profilePicture/profileStepsUi";
import { useGoogleMapsPlacesReady } from "packages/features/profile/hooks/useGoogleMapsPlacesReady";
import { usePersonalizationScrollActiveSection } from "packages/features/profile/hooks/usePersonalizationScrollActiveSection";
import { useProfileDocSignOAuthReturn } from "packages/features/profile/hooks/useProfileDocSignOAuthReturn";
import { scrollToPersonalizationSection } from "packages/features/profile/utils/personalization/personalizationScrollActiveSection";
import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import { useUserData, useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { useResponsive } from "packages/hooks/ui";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation/hooks/useNavigation";
import { useAuthStore } from "packages/store";
import { Loading } from "packages/ui/components/asset/loading/Loading";
import { Box, Text } from "packages/ui/components/primitives";
import SettingsSidebar from "packages/ui/components/sidebar/SettingsSidebar";

import {
  handleSubmit as handleSubmitUtil,
  isAgentIdentityForProfileUi,
  nextPreferencesVersion,
  type OnboardingData,
  resolveAgentPublicProfileShare,
  userPreferencesToOnboardingData,
} from "@/features/profile/utils";

import { ProfileFeatureSectionPanels } from "./ProfileFeatureSectionPanels";
import type { ProfileFeatureProps } from "./profileFeatureTypes";

const noopSetMobileHeader: React.Dispatch<React.SetStateAction<React.ReactNode | null>> = () => {};

export default function ProfileFeature({
  setMobileHeaderActions: setMobileHeaderActionsProp,
  agentSubject = null,
}: ProfileFeatureProps) {
  const setMobileHeaderActions = setMobileHeaderActionsProp ?? noopSetMobileHeader;
  const navigation = useNavigation();
  useProfileDocSignOAuthReturn(navigation);
  const { userProfile } = useUserData();
  const { userPreferences, refreshUserPreferences, preferencesLoading, preferencesError } =
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
        ? isAgentIdentityForProfileUi(false, { is_agent: false })
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
  const STEPS = useMemo(
    () => getPersonalizationStepsUi(isAgentForProfileUi),
    [isAgentForProfileUi]
  );
  const sectionIds = useMemo(() => STEPS.map((s) => s.id), [STEPS]);
  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  const loadUserPreferencesFromContext = useCallback(() => {
    try {
      setIsLoading(true);

      if (userPreferences) {
        const normalized = userPreferencesToOnboardingData(
          userPreferences as Record<string, unknown>,
          profileForSync
        );
        setFormData(normalized);
        setOriginalData(normalized);
      }
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.ERRORS, "Failed to load user preferences from context", error);
    } finally {
      setIsLoading(false);
    }
  }, [userPreferences, profileForSync]);

  useEffect(() => {
    void refreshUserPreferences();
  }, [refreshUserPreferences]);

  useEffect(() => {
    if (agentSubject != null) return;
    if (!userPreferences) return;
    if (hasInitializedFormRef.current) return;
    hasInitializedFormRef.current = true;
    void loadUserPreferencesFromContext();
  }, [agentSubject, userPreferences, loadUserPreferencesFromContext]);

  useEffect(() => {
    if (agentSubject == null) return;
    if (hasInitializedFormRef.current) return;
    if (preferencesLoading) return;
    hasInitializedFormRef.current = true;
    const normalized = userPreferencesToOnboardingData(
      userPreferences ? (userPreferences as Record<string, unknown>) : null,
      profileForSync
    );
    setFormData(normalized);
    setOriginalData(normalized);
    setIsLoading(false);
  }, [agentSubject, preferencesLoading, userPreferences, profileForSync]);

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
        log.info(LOG_CATEGORIES.API, "Preferences saved successfully");
      },
      onError: (error) => {
        log.error(LOG_CATEGORIES.ERRORS, "Failed to update preferences", error);
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

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    scrollToPersonalizationSection(sectionId);
  };

  if (agentSubject != null && preferencesError) {
    return (
      <Box className="flex flex-1 items-center justify-center p-6">
        <Text className="text-text-secondary text-sm">{preferencesError}</Text>
      </Box>
    );
  }

  const showPrefsLoading = agentSubject != null ? preferencesLoading : isLoading;

  if (showPrefsLoading) {
    return (
      <Box
        className={
          agentSubject != null
            ? "flex flex-1 items-center justify-center"
            : "bg-background-base flex min-h-screen items-center justify-center"
        }
      >
        <Loading message="Loading your preferences..." />
      </Box>
    );
  }

  const sectionPanels = (
    <ProfileFeatureSectionPanels
      agentSubject={agentSubject}
      isUltraSmallScreen={isUltraSmallScreen}
      showAgentPublicProfileShare={showAgentPublicProfileShare}
      agentPublicProfileUserId={agentPublicProfileUserId}
      agentPublicProfileDisplayName={agentPublicProfileDisplayName}
      steps={STEPS}
      formData={formData}
      isEditMode={isEditMode}
      updateFormData={updateFormData}
      patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
      scriptsReady={scriptsReady}
      loadError={loadError}
    />
  );

  if (agentSubject != null) {
    return <Box className="bg-background-base w-full min-w-0 flex-1">{sectionPanels}</Box>;
  }

  return (
    <Box className="bg-background-base min-h-screen">
      <Box className="mx-auto max-w-7xl pb-1 sm:px-6 lg:px-8">
        <Box className="flex flex-row gap-6 lg:gap-8">
          <SettingsSidebar
            items={convertStepsToNavItems(STEPS)}
            activeSection={activeSection}
            isEditMode={isEditMode}
            isSaving={isSaving}
            onEdit={() => setIsEditMode(true)}
            onSave={handleSaveChanges}
            onCancel={handleCancel}
            onScrollToSection={scrollToSection}
          />
          {sectionPanels}
        </Box>
      </Box>
    </Box>
  );
}
