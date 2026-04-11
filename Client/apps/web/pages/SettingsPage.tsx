// React imports
import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  handleSubmit as handleSubmitUtil,
  type OnboardingData,
  validateSettingsData,
} from "packages/features/profile";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { useResponsive } from "packages/hooks/ui";
import { showErrorToast } from "packages/hooks/ui/toast";
import { log, LOG_CATEGORIES } from "packages/logger";
// Core
import { useGoogleMapsStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";
import SettingsSidebar from "packages/ui/components/sidebar/SettingsSidebar";

// Google Maps types
/// <reference types="google.maps" />
// Components
import { Loading } from "@/components/ui";
import PersonalizationMobileHeader from "@/features/profile/components/account/MobileHeader";
import {
  convertStepsToNavItems,
  getPersonalizationStepsUi,
} from "@/features/profile/components/profilePicture/profileStepsUi";
import { ProfileHousingEssentialsSection } from "@/features/profile/components/profileScreen/ProfileHousingEssentialsSection";
import { ProfileHousingRangesSection } from "@/features/profile/components/profileScreen/ProfileHousingRangesSection";
import { ProfileSearchPropertySection } from "@/features/profile/components/profileScreen/ProfileSearchPropertySection";
// Features
import {
  AgentBrokerageSection,
  AgentLicensingSection,
  AgentProfileServiceSection,
  DemographicsSection,
  LocationSection,
} from "@/features/profile/components/sections/index.web";
import { SettingsFinancialSection } from "@/features/profile/components/sections/SettingsFinancialSection";

// Google Maps types are handled by the global declaration in packages/services/googleMaps.ts

// Export SettingsModal for use in other components
export { default as SettingsModal } from "packages/features/agent/components/modals/SettingsModal";

type PersonalizationPageProps = {
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};

export default function PersonalizationPage({
  setMobileHeaderActions,
}: PersonalizationPageProps) {
  const isAgent = useIsAgent();
  const STEPS = useMemo(() => getPersonalizationStepsUi(isAgent), [isAgent]);
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(
    STEPS[0]?.id ?? "demographics",
  );
  // Modal state variables removed - modals not currently implemented
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      log.error(
        LOG_CATEGORIES.ERRORS,
        "Failed to load user preferences from context",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  }, [userPreferences]);

  // Refresh data when page loads to ensure latest updates
  useEffect(() => {
    void refreshUserPreferences();
  }, [refreshUserPreferences]); // Only run once on mount

  // Load user preferences from centralized context
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

  // Initialize active section based on current scroll position
  useEffect(() => {
    const initializeActiveSection = () => {
      const sections = STEPS.map((step) => step.id);
      const scrollPosition = window.scrollY + 200; // Offset for header
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollBottom = scrollPosition + windowHeight;

      // If we're at the very top on initial load, select the first section
      if (window.scrollY <= 5) {
        setActiveSection(sections[0]);
        return;
      }

      // If user is near the bottom of the page, highlight the last section
      if (scrollBottom >= documentHeight - 100) {
        setActiveSection(sections[sections.length - 1]);
        return;
      }

      // Otherwise, use the normal logic
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    // Initialize on mount
    initializeActiveSection();
  }, [STEPS]);

  // Track scroll position to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = STEPS.map((step) => step.id);
      const scrollPosition = window.scrollY + 200; // Offset for header
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollBottom = scrollPosition + windowHeight;

      // If we're at the top, prefer the first section
      if (window.scrollY <= 5) {
        setActiveSection(sections[0]);
        return;
      }

      // If user is near the bottom of the page, highlight the last section
      if (scrollBottom >= documentHeight - 100) {
        setActiveSection(sections[sections.length - 1]);
        return;
      }

      // Otherwise, use the normal logic
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [STEPS]);

  // Use centralized Google Maps loading
  const { isLoaded: googleMapsLoaded, error: googleMapsError } =
    useGoogleMapsStore();

  // Update scriptsReady based on centralized Google Maps loading
  useEffect(() => {
    if (googleMapsError) {
      log.error(
        LOG_CATEGORIES.ERRORS,
        "Google Maps loading error",
        googleMapsError,
      );
      void setLoadError("Failed to load Google Maps script.");
      return;
    }

    if (googleMapsLoaded && window.google?.maps?.places) {
      setScriptsReady(true);
    }
  }, [googleMapsLoaded, googleMapsError]);

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

  const handleSaveChanges = useCallback(async () => {
    // Increment version for this update
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
        // Update local state with new version
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
  }, [formData]);

  const handleCancel = useCallback(() => {
    setFormData(originalData);
    setIsEditMode(false);
  }, [originalData]);

  // Handle mobile header actions based on screen size
  const { isMdDown } = useResponsive();
  const isMobile = isMdDown; // canonical: strictly < md
  const isUltraSmallScreen = isMdDown; // used for spacing adjustments (Tailwind `md:*` aligned)

  useEffect(() => {
    if (isMobile) {
      setMobileHeaderActions(
        <PersonalizationMobileHeader
          isEditMode={isEditMode}
          isSaving={isSaving}
          onEdit={() => setIsEditMode(true)}
          onCancel={handleCancel}
          onSave={handleSaveChanges}
        />,
      );
    } else {
      setMobileHeaderActions(null);
    }
  }, [
    isMobile,
    isEditMode,
    isSaving,
    setMobileHeaderActions,
    handleCancel,
    handleSaveChanges,
  ]);

  // Modal handlers removed - modals not currently implemented

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (isLoading) {
    return (
      <Box className="flex min-h-screen items-center justify-center bg-background-base">
        <Loading message="Loading your preferences..." />
      </Box>
    );
  }

  const renderSectionContent = (sectionId: string) => {
    // Render content for each section based on sectionId
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

      case "demographics":
        // Agent status is immutable; choice only shown during onboarding
        return (
          <DemographicsSection
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
            showAgentChoice={false}
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

      default:
        return null;
    }
  };

  return (
    <Box className="min-h-screen bg-background-base">
      <Box className="mx-auto max-w-7xl pb-1 sm:px-6 lg:px-8">
        <Box className="flex flex-row gap-6 lg:gap-8">
          {/* Sidebar - Always visible */}
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

          {/* Content area: use Box with region role to avoid duplicate main landmark (top-level main is in DashboardLayout). */}
          <Box
            role="region"
            className={`w-full flex-1 space-y-8 ${
              !isUltraSmallScreen ? "lg:ml-0" : ""
            }`}
          >
            {STEPS.map((step) => (
              <section id={step.id} key={step.id}>
                {renderSectionContent(step.id)}
              </section>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
