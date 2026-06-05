// React imports
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PersonalizationMobileHeader from "packages/features/profile/components/account/MobileHeader";
import { PersonalizationSectionPanel } from "packages/features/profile/components/layout";
import { convertStepsToNavItems } from "packages/features/profile/components/profilePicture/profileStepsUi";
import { getPersonalizationStepsUi } from "packages/features/profile/components/profilePicture/profileStepsUi";
import { SettingsSectionContent } from "packages/features/profile/components/settings/SettingsSectionContent";
import { useGoogleMapsPlacesReady } from "packages/features/profile/hooks/useGoogleMapsPlacesReady";
import { usePersonalizationScrollActiveSection } from "packages/features/profile/hooks/usePersonalizationScrollActiveSection";
import { scrollToPersonalizationSection } from "packages/features/profile/utils/personalization/personalizationScrollActiveSection";
import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import { useUserData, useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { useResponsive } from "packages/hooks/ui";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { log } from "packages/logger";
import { Box } from "packages/ui/components/structure/primitives";

// Google Maps types
/// <reference types="google.maps" />
// Components
import { Loading } from "@/components/ui";
import SettingsSidebar from "@/components/ui/sidebar/SettingsSidebar";
// Features
import {
  handleSubmit as handleSubmitUtil,
  nextPreferencesVersion,
  type OnboardingData,
  userPreferencesToOnboardingData,
} from "@/features/profile/utils";

import type { SettingsProps } from "./settingsTypes";

// Google Maps types: see `packages/features/search/utils/googleMaps` and ambient typings as needed.

export default function Settings({ setMobileHeaderActions }: SettingsProps) {
  const { userProfile } = useUserData();
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const submitPreferences = usePreferencesSubmit();
  const isAgent = useIsAgent();
  const STEPS = useMemo(() => getPersonalizationStepsUi(isAgent), [isAgent]);
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
    return () => {
      if (setMobileHeaderActions) {
        setMobileHeaderActions(null);
      }
    };
  }, [setMobileHeaderActions]);

  const loadUserPreferencesFromContext = useCallback(() => {
    try {
      setIsLoading(true);

      if (userPreferences) {
        const normalized = userPreferencesToOnboardingData(
          userPreferences as Record<string, unknown>,
          userProfile ?? undefined
        );
        setFormData(normalized);
        setOriginalData(normalized);
      }
    } catch (error: unknown) {
      log.error("ERRORS", "Failed to load user preferences from context", error);
    } finally {
      setIsLoading(false);
    }
  }, [userPreferences, userProfile]);

  useEffect(() => {
    void refreshUserPreferences();
  }, [refreshUserPreferences]);

  useEffect(() => {
    if (!userPreferences) return;
    if (hasInitializedFormRef.current) return;
    hasInitializedFormRef.current = true;
    void loadUserPreferencesFromContext();
  }, [userPreferences, loadUserPreferencesFromContext]);

  useEffect(() => {
    if (!hasInitializedFormRef.current) return;
    const nameFromProfile =
      userProfile != null && typeof userProfile.name === "string" && userProfile.name.trim() !== ""
        ? userProfile.name.trim()
        : undefined;
    if (!nameFromProfile) return;
    setFormData((prev) => (prev.name ? prev : { ...prev, name: nameFromProfile }));
    setOriginalData((prev) => (prev.name ? prev : { ...prev, name: nameFromProfile }));
  }, [userProfile]);

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
    if (isMobile && setMobileHeaderActions) {
      setMobileHeaderActions(
        <PersonalizationMobileHeader
          isEditMode={isEditMode}
          isSaving={isSaving}
          onEdit={() => setIsEditMode(true)}
          onCancel={handleCancel}
          onSave={handleSaveChanges}
        />
      );
    } else if (setMobileHeaderActions) {
      setMobileHeaderActions(null);
    }
  }, [isMobile, isEditMode, isSaving, setMobileHeaderActions, handleCancel, handleSaveChanges]);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    scrollToPersonalizationSection(sectionId);
  };

  if (isLoading) {
    return (
      <Box className="bg-background-base flex min-h-screen items-center justify-center">
        <Loading message="Loading your preferences..." />
      </Box>
    );
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

          <main className={`w-full flex-1 space-y-8 ${!isUltraSmallScreen ? "lg:ml-0" : ""}`}>
            {STEPS.map((step) => (
              <PersonalizationSectionPanel
                key={step.id}
                sectionId={step.id}
                screenReaderHeading={step.title}
                showVisibleHeading={step.id !== "location"}
              >
                <SettingsSectionContent
                  sectionId={step.id}
                  formData={formData}
                  isEditMode={isEditMode}
                  updateFormData={updateFormData}
                  patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
                  scriptsReady={scriptsReady}
                  loadError={loadError}
                />
              </PersonalizationSectionPanel>
            ))}
          </main>
        </Box>
      </Box>
    </Box>
  );
}
