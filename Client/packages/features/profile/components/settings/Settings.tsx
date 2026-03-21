// React imports
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PersonalizationMobileHeader from "packages/features/profile/components/account/MobileHeader";
// Hooks and utilities
import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import {
  useUserData,
  useUserPreferences,
} from "packages/hooks/data/auth/useUserData";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { useResponsive } from "packages/hooks/ui";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { log, LOG_CATEGORIES } from "packages/logger";
// Core
import { useGoogleMapsStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";
import { getDocument, getWindow } from "packages/utils/platform";

// Google Maps types
/// <reference types="google.maps" />
// Components
import { Loading } from "@/components/ui";
import SettingsSidebar from "@/components/ui/sidebar/SettingsSidebar";
import {
  convertStepsToNavItems,
  getPersonalizationStepsUi,
} from "@/features/profile/components/profilePicture/profileStepsUi";
// Features
import {
  AgentBrokerageSection,
  AgentLicensingSection,
  AgentProfileServiceSection,
  DemographicsSection,
  getPreservedImportantLocations,
  HousingSection,
  LocationSection,
} from "@/features/profile/components/sections/index.web";
import {
  handleSubmit as handleSubmitUtil,
  type OnboardingData,
  userPreferencesToOnboardingData,
  validateProfileSave,
} from "@/features/profile/utils";

// Settings sections
import FinancialSection from "./sections/FinancialSection";
// Google Maps types are handled by the global declaration in packages/services/googleMaps.ts

type SettingsProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};

export default function Settings({ setMobileHeaderActions }: SettingsProps) {
  const { userProfile } = useUserData();
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const submitPreferences = usePreferencesSubmit();
  const isAgent = useIsAgent();
  const STEPS = useMemo(() => getPersonalizationStepsUi(isAgent), [isAgent]);
  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(STEPS[0]?.id ?? "");
  // Modal state variables removed - modals not currently implemented
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasInitializedFormRef = useRef(false);

  // Trigger cleanup when component unmounts
  useEffect(() => {
    // Cleanup actions when component unmounts
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
          userProfile ?? undefined,
        );
        setFormData(normalized);
        setOriginalData(normalized);
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
  }, [userPreferences, userProfile]);

  // Refresh data when page loads to ensure latest updates
  useEffect(() => {
    void refreshUserPreferences();
  }, [refreshUserPreferences]); // Only run once on mount

  // Initialize form from server only once when preferences first become available.
  // Never reset hasInitializedFormRef or clear form when userPreferences is falsy, so
  // in-progress edits are not overwritten by refetch or cache updates.
  useEffect(() => {
    if (!userPreferences) return;
    if (hasInitializedFormRef.current) return;
    hasInitializedFormRef.current = true;
    void loadUserPreferencesFromContext();
  }, [userPreferences, loadUserPreferencesFromContext]);

  // When profile loads after form was already initialized, backfill name from user profile
  // (stored at sign-up) so it displays correctly even if preferences loaded first.
  useEffect(() => {
    if (!hasInitializedFormRef.current) return;
    const nameFromProfile =
      userProfile != null &&
      typeof userProfile.name === "string" &&
      userProfile.name.trim() !== ""
        ? userProfile.name.trim()
        : undefined;
    if (!nameFromProfile) return;
    setFormData((prev) =>
      prev.name ? prev : { ...prev, name: nameFromProfile },
    );
    setOriginalData((prev) =>
      prev.name ? prev : { ...prev, name: nameFromProfile },
    );
  }, [userProfile]);

  // Keep activeSection in sync when STEPS change (e.g. isAgent loads)
  useEffect(() => {
    if (STEPS.length > 0 && !STEPS.some((s) => s.id === activeSection)) {
      setActiveSection(STEPS[0]?.id ?? "");
    }
  }, [STEPS, activeSection]);

  // Initialize active section based on current scroll position (platform globals for RN parity)
  useEffect(() => {
    const win = getWindow();
    const doc = getDocument();
    const initializeActiveSection = () => {
      if (!win || !doc) return;
      const sections = STEPS.map((step) => step.id);
      const scrollPosition = win.scrollY + 200; // Offset for header
      const documentHeight = doc.documentElement.scrollHeight;
      const windowHeight = win.innerHeight;
      const scrollBottom = scrollPosition + windowHeight;

      if (win.scrollY <= 5) {
        setActiveSection(sections[0]);
        return;
      }
      if (scrollBottom >= documentHeight - 100) {
        setActiveSection(sections[sections.length - 1]);
        return;
      }
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = doc.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    initializeActiveSection();
  }, [STEPS]);

  // Track scroll position to update active section
  useEffect(() => {
    const win = getWindow();
    if (!win) return;
    const handleScroll = () => {
      const doc = getDocument();
      if (!doc) return;
      const sections = STEPS.map((step) => step.id);
      const scrollPosition = win.scrollY + 200;
      const documentHeight = doc.documentElement.scrollHeight;
      const windowHeight = win.innerHeight;
      const scrollBottom = scrollPosition + windowHeight;

      if (win.scrollY <= 5) {
        setActiveSection(sections[0]);
        return;
      }
      if (scrollBottom >= documentHeight - 100) {
        setActiveSection(sections[sections.length - 1]);
        return;
      }
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = doc.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    win.addEventListener("scroll", handleScroll);
    return () => win.removeEventListener("scroll", handleScroll);
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
      setLoadError("Failed to load Google Maps script.");
      return;
    }

    const win = getWindow();
    if (
      googleMapsLoaded &&
      (win as unknown as { google?: { maps?: { places?: unknown } } })?.google
        ?.maps?.places
    ) {
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
    const majorVersion = parseInt(versionParts[0]) ?? 1;
    const minorVersion = parseInt(versionParts[1]) ?? 0;
    const newVersion = `${majorVersion}.${minorVersion + 1}`;

    const currentLocations = Array.isArray(formData.important_locations)
      ? formData.important_locations
      : [];
    const originalLocations = Array.isArray(originalData.important_locations)
      ? originalData.important_locations
      : [];

    const preservedLocations = getPreservedImportantLocations(
      originalLocations,
      currentLocations,
    );

    const dataToSave = {
      ...formData,
      important_locations: preservedLocations ?? currentLocations,
      preferences_version: newVersion,
    };

    await handleSubmitUtil({
      formData: dataToSave,
      submitPreferences,
      setLoading: setIsSaving,
      validateFunction: validateProfileSave,
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
  }, [formData, originalData, submitPreferences]);

  const handleCancel = useCallback(() => {
    setFormData(originalData);
    setIsEditMode(false);
  }, [originalData]);

  // Handle mobile header actions based on screen size
  const { isMdDown, isMdUp } = useResponsive();
  const isMobile = isMdDown; // canonical: strictly < md
  const isUltraSmallScreen = isMdDown; // spacing adjustments (Tailwind-aligned)
  const isDesktop = isMdUp; // >= md

  useEffect(() => {
    if (isMobile && setMobileHeaderActions) {
      setMobileHeaderActions(
        <PersonalizationMobileHeader
          isEditMode={isEditMode}
          isSaving={isSaving}
          onEdit={() => setIsEditMode(true)}
          onCancel={handleCancel}
          onSave={handleSaveChanges}
        />,
      );
    } else if (setMobileHeaderActions) {
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
    const doc = getDocument();
    const element = doc?.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (isLoading) {
    return (
      <Box className="bg-background-base flex min-h-screen items-center justify-center">
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

      case "financial":
        return (
          <FinancialSection
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
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

      default:
        return null;
    }
  };

  return (
    <Box className="bg-background-base min-h-screen">
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
        </Box>
      </Box>
    </Box>
  );
}
