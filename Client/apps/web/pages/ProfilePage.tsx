// React imports
import React, { useCallback, useEffect, useState } from "react";

import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useResponsive } from "packages/hooks/ui";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { log, LOG_CATEGORIES } from "packages/logger";
// Core
import { useGoogleMapsStore } from "packages/store";
import {
  calculateAffordableHomePrice,
  handleSubmit as handleSubmitUtil,
  type HomePriceResult,
  type OnboardingData,
  validateSettingsData,
} from "packages/utils/domain/profile";

// Google Maps types
/// <reference types="google.maps" />
// Components
import { Loading } from "@/components/ui/index.web";
import SettingsSidebar from "@/components/ui/sidebar/SettingsSidebar";
import PersonalizationMobileHeader from "@/features/profile/account/MobileHeader";
import {
  convertStepsToNavItems,
  getPersonalizationStepsUi,
} from "@/features/profile/profileStepsUi";
// Features
import {
  DemographicsSection,
  HousingSection,
  LocationSection,
} from "@/features/profile/sections/index.web";
import { SettingsCommunicationSection } from "@/features/profile/sections/SettingsCommunicationSection";
import { SettingsFinancialSection } from "@/features/profile/sections/SettingsFinancialSection";

// Google Maps types are handled by the global declaration in packages/services/googleMaps.ts

// Export SettingsModal for use in other components
export { default as SettingsModal } from "@/features/agent/modals/SettingsModal";

type ProfilePageProps = {
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};

const STEPS = getPersonalizationStepsUi();

export default function ProfilePage({
  setMobileHeaderActions,
}: ProfilePageProps) {
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const submitPreferences = usePreferencesSubmit();
  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  // Modal state variables removed - modals not currently implemented
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [homePriceResult, setHomePriceResult] =
    useState<HomePriceResult | null>(null);
  const [homePriceLoading, setHomePriceLoading] = useState(false);
  const [homePriceError, setHomePriceError] = useState<string | null>(null);
  const [isAffordabilityCollapsed, setIsAffordabilityCollapsed] =
    useState(false);

  const calculateHomePrice = useCallback(() => {
    // Check if we have all required data
    if (!formData.gross_income || !formData.ideal_zip_code) {
      return;
    }

    try {
      setHomePriceLoading(true);
      setHomePriceError(null);

      const result = calculateAffordableHomePrice(formData);

      if ("error" in result) {
        setHomePriceError(result.error);
        setHomePriceResult(null);
      } else {
        setHomePriceResult(result);
      }
    } catch (error: unknown) {
      setHomePriceError(
        error instanceof Error
          ? error.message
          : "Failed to calculate home price",
      );
      setHomePriceResult(null);
    } finally {
      setHomePriceLoading(false);
    }
  }, [formData]);

  // Trigger home price calculation when relevant form data changes
  useEffect(() => {
    // Cleanup actions when component unmounts
    return () => {
      setMobileHeaderActions(null);
    };
  }, [setMobileHeaderActions]);

  useEffect(() => {
    // Only calculate if we're on the financial section
    if (activeSection !== "financial") return;

    // Only calculate if we have the minimum required data
    if (formData.gross_income && formData.ideal_zip_code) {
      void calculateHomePrice();
    }
  }, [
    formData.gross_income,
    formData.credit_score_range,
    formData.ideal_zip_code,
    formData.down_payment,
    activeSection,
    calculateHomePrice,
  ]);

  // Automatically collapse/expand affordability dropdown based on edit mode
  useEffect(() => {
    // When not in edit mode, collapse the dropdown (compact view)
    // When in edit mode, expand the dropdown by default
    setIsAffordabilityCollapsed(!isEditMode);
  }, [isEditMode]);

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
        setActiveSection(sections[0] ?? "");
        return;
      }

      // If user is near the bottom of the page, highlight the last section
      if (scrollBottom >= documentHeight - 100) {
        setActiveSection(sections[sections.length - 1] ?? "");
        return;
      }

      // Otherwise, use the normal logic
      for (let i = sections.length - 1; i >= 0; i--) {
        const id = sections[i];
        const element = id ? document.getElementById(id) : null;
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(id ?? "");
          break;
        }
      }
    };

    // Initialize on mount
    initializeActiveSection();
  }, []);

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
        setActiveSection(sections[0] ?? "");
        return;
      }

      // If user is near the bottom of the page, highlight the last section
      if (scrollBottom >= documentHeight - 100) {
        setActiveSection(sections[sections.length - 1] ?? "");
        return;
      }

      // Otherwise, use the normal logic
      for (let i = sections.length - 1; i >= 0; i--) {
        const id = sections[i];
        const element = id ? document.getElementById(id) : null;
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(id ?? "");
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

  const handleSaveChanges = useCallback(async () => {
    // Increment version for this update
    const currentVersion = formData.preferences_version ?? "1.0";
    const versionParts = currentVersion.split(".");
    const majorVersion = parseInt(versionParts[0] ?? "1", 10) || 1;
    const minorVersion = parseInt(versionParts[1] ?? "0", 10) || 0;
    const newVersion = `${majorVersion}.${minorVersion + 1}`;

    const dataToSave = {
      ...formData,
      preferences_version: newVersion,
    };

    await handleSubmitUtil({
      formData: dataToSave,
      submitPreferences,
      setLoading: setIsSaving,
      validateFunction: validateSettingsData,
      onShowError: showErrorToast,
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
  }, [formData, submitPreferences]);

  const handleCancel = useCallback(() => {
    setFormData(originalData);
    setIsEditMode(false);
  }, [originalData]);

  // Handle mobile header actions based on screen size
  const { isMdDown, isMdUp } = useResponsive();
  const isMobile = isMdDown; // canonical: strictly < md
  const isUltraSmallScreen = isMdDown; // used for spacing adjustments (Tailwind `md:*` aligned)
  const isDesktop = isMdUp; // >= md

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
      <div className="flex min-h-screen items-center justify-center bg-off-white">
        <Loading message="Loading your preferences..." />
      </div>
    );
  }

  const renderSectionContent = (sectionId: string) => {
    // Render content for each section based on sectionId
    switch (sectionId) {
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
            homePriceLoading={homePriceLoading}
            homePriceError={homePriceError}
            homePriceResult={homePriceResult}
            isAffordabilityCollapsed={isAffordabilityCollapsed}
            setIsAffordabilityCollapsed={setIsAffordabilityCollapsed}
          />
        );

      case "housing":
        return (
          <HousingSection
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
            isDesktop={isDesktop}
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
          />
        );

      case "communication":
        return (
          <SettingsCommunicationSection
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <div className="mx-auto max-w-7xl pb-1 sm:px-6 lg:px-8">
        <div className="flex flex-row gap-6 lg:gap-8">
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

          {/* Main Content Area */}
          <main
            className={`w-full flex-1 space-y-8 ${!isUltraSmallScreen ? "lg:ml-0" : ""}`}
          >
            {STEPS.map((step) => (
              <section id={step.id} key={step.id}>
                {renderSectionContent(step.id)}
              </section>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}
