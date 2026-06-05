import React, { useCallback, useEffect, useMemo, useState } from "react";

import PersonalizationMobileHeader from "packages/features/profile/components/account/MobileHeader";
import {
  convertStepsToNavItems,
  getPersonalizationStepsUi,
} from "packages/features/profile/components/profilePicture/profileStepsUi";
import { ProfileHousingEssentialsSection } from "packages/features/profile/components/profileScreen/sections/housing/ProfileHousingEssentialsSection";
import { ProfileHousingRangesSection } from "packages/features/profile/components/profileScreen/sections/housing/ProfileHousingRangesSection";
import { AccountPrivacyDataSection } from "packages/features/profile/components/profileScreen/sections/privacy/AccountPrivacyDataSection";
import { ProfileSearchPropertySection } from "packages/features/profile/components/profileScreen/sections/search/ProfileSearchPropertySection";
import {
  AgentBrokerageSection,
  AgentLicensingSection,
  AgentProfileServiceSection,
  AvailabilitySection,
  DemographicsSection,
  LocationSection,
} from "packages/features/profile/components/sections/index.web";
import { SettingsFinancialSection } from "packages/features/profile/components/sections/SettingsFinancialSection";
import {
  useGoogleMapsPlacesReady,
  usePersonalizationScrollActiveSection,
} from "packages/features/profile/hooks";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import {
  handleSubmit as handleSubmitUtil,
  validateSettingsData,
} from "packages/features/profile/utils";
import { scrollToPersonalizationSection } from "packages/features/profile/utils/personalization/personalizationScrollActiveSection";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { useResponsive } from "packages/hooks/ui";
import { showErrorToast } from "packages/hooks/ui/toast";
import { log } from "packages/logger";
import { Loading } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import SettingsSidebar from "packages/ui/components/structure/sidebar/SettingsSidebar";
import { TwoColumnInsetPageLayout } from "packages/ui/components/structure/sidebar/TwoColumnInsetPageLayout";

export type PersonalizationSettingsScreenProps = {
  setMobileHeaderActions: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

export function PersonalizationSettingsScreen({
  setMobileHeaderActions,
}: PersonalizationSettingsScreenProps) {
  const isAgent = useIsAgent();
  const STEPS = useMemo(() => getPersonalizationStepsUi(isAgent), [isAgent]);
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(STEPS[0]?.id ?? "demographics");
  const { scriptsReady, loadError } = useGoogleMapsPlacesReady();

  useEffect(() => {
    return () => {
      setMobileHeaderActions(null);
    };
  }, [setMobileHeaderActions]);

  const loadUserPreferencesFromContext = useCallback(() => {
    try {
      setIsLoading(true);

      if (userPreferences) {
        setFormData(userPreferences as OnboardingData);
        setOriginalData(userPreferences as OnboardingData);
      }
    } catch (error: unknown) {
      log.error("ERRORS", "Failed to load user preferences from context", error);
    } finally {
      setIsLoading(false);
    }
  }, [userPreferences]);

  useEffect(() => {
    void refreshUserPreferences();
  }, [refreshUserPreferences]);

  useEffect(() => {
    if (userPreferences) {
      void loadUserPreferencesFromContext();
    } else {
      setFormData({});
      setOriginalData({});
      setIsLoading(false);
    }
  }, [userPreferences, loadUserPreferencesFromContext]);

  useEffect(() => {
    if (STEPS.length > 0 && !STEPS.some((s) => s.id === activeSection)) {
      setActiveSection(STEPS[0]?.id ?? "demographics");
    }
  }, [STEPS, activeSection]);

  const sectionIds = useMemo(() => STEPS.map((step) => step.id), [STEPS]);
  usePersonalizationScrollActiveSection(sectionIds, setActiveSection);

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

  const handleSaveChanges = useCallback(async () => {
    const currentVersion = formData.preferences_version ?? "1.0";
    const versionParts = currentVersion.split(".");
    const majorVersion = parseInt(versionParts[0]) ?? 1;
    const minorVersion = parseInt(versionParts[1]) ?? 0;
    const newVersion = `${majorVersion}.${minorVersion + 1}`;

    const dataToSave = {
      ...formData,
      preferences_version: newVersion,
    };

    await handleSubmitUtil({
      formData: dataToSave,
      setLoading: setIsSaving,
      validateFunction: validateSettingsData,
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
  }, [formData]);

  const handleCancel = useCallback(() => {
    setFormData(originalData);
    setIsEditMode(false);
  }, [originalData]);

  const { isMdDown } = useResponsive();
  const isMobile = isMdDown;
  const isUltraSmallScreen = isMdDown;

  useEffect(() => {
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
  }, [isMobile, isEditMode, isSaving, setMobileHeaderActions, handleCancel, handleSaveChanges]);

  const handleScrollToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    scrollToPersonalizationSection(sectionId);
  }, []);

  if (isLoading) {
    return (
      <Box className="bg-background-base flex min-h-screen items-center justify-center">
        <Loading message="Loading your preferences..." />
      </Box>
    );
  }

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case "agent_brokerage":
        return (
          <AgentBrokerageSection
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
          />
        );
      case "agent_licensing":
        return (
          <AgentLicensingSection
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
          />
        );
      case "agent_profile":
        return (
          <AgentProfileServiceSection
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
          />
        );
      case "availability":
        if (!isAgent) return null;
        return (
          <AvailabilitySection
            formData={formData}
            isEditMode={isEditMode}
            patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
          />
        );
      case "demographics":
        return (
          <DemographicsSection
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
          />
        );
      case "financial":
        return (
          <SettingsFinancialSection
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
            patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
          />
        );
      case "housing_essentials":
        return (
          <ProfileHousingEssentialsSection
            formData={formData}
            isEditMode={isEditMode}
            updateField={(field, value) => updateFormData(field, value)}
          />
        );
      case "housing_ranges":
        return (
          <ProfileHousingRangesSection
            formData={formData}
            isEditMode={isEditMode}
            updateField={(field, value) => updateFormData(field, value)}
          />
        );
      case "location":
        return (
          <LocationSection
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
            scriptsReady={scriptsReady}
            loadError={loadError}
            patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
          />
        );
      case "search_property":
        return (
          <ProfileSearchPropertySection
            formData={formData}
            isEditMode={isEditMode}
            updateField={(field, value) => updateFormData(field, value)}
            patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
          />
        );
      case "privacy_data":
        return <AccountPrivacyDataSection />;
      default:
        return null;
    }
  };

  return (
    <TwoColumnInsetPageLayout
      maxWidthClassName="max-w-7xl"
      regionClassName={`w-full flex-1 space-y-8 ${!isUltraSmallScreen ? "lg:ml-0" : ""}`}
      sidebar={
        <SettingsSidebar
          items={convertStepsToNavItems(STEPS)}
          activeSection={activeSection}
          isEditMode={isEditMode}
          isSaving={isSaving}
          onEdit={() => setIsEditMode(true)}
          onSave={handleSaveChanges}
          onCancel={handleCancel}
          onScrollToSection={handleScrollToSection}
        />
      }
    >
      {STEPS.map((step) => (
        <section id={step.id} key={step.id}>
          {renderSectionContent(step.id)}
        </section>
      ))}
    </TwoColumnInsetPageLayout>
  );
}
