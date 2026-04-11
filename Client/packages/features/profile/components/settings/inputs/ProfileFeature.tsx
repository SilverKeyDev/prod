import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PersonalizationMobileHeader from "packages/features/profile/components/account/MobileHeader";
import {
  PersonalizationSectionLayoutProvider,
  PersonalizationSectionPanel,
} from "packages/features/profile/components/layout";
import {
  convertStepsToNavItems,
  getPersonalizationStepsUi,
} from "packages/features/profile/components/profilePicture/profileStepsUi";
import { ProfileHousingEssentialsSection } from "packages/features/profile/components/profileScreen/ProfileHousingEssentialsSection";
import { ProfileHousingRangesSection } from "packages/features/profile/components/profileScreen/ProfileHousingRangesSection";
import { ProfileSearchPropertySection } from "packages/features/profile/components/profileScreen/ProfileSearchPropertySection";
import {
  AgentBrokerageSection,
  AgentLicensingSection,
  AgentProfileServiceSection,
  DemographicsSection,
  LocationSection,
  SettingsFinancialSection,
} from "packages/features/profile/components/sections/index.web";
import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import {
  useUserData,
  useUserPreferences,
} from "packages/hooks/data/auth/useUserData";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { useResponsive } from "packages/hooks/ui";
import {
  showErrorToast,
  showSuccessToast,
} from "packages/hooks/ui/toast/useToast";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation/hooks/useNavigation";
import { useGoogleMapsStore } from "packages/store";
/// <reference types="google.maps" />
import { Loading } from "packages/ui/components/asset/loading/Loading";
import { Box } from "packages/ui/components/primitives";
import SettingsSidebar from "packages/ui/components/sidebar/SettingsSidebar";
import { getDocument, getWindow } from "packages/utils/platform";

import {
  handleSubmit as handleSubmitUtil,
  nextPreferencesVersion,
  type OnboardingData,
  userPreferencesToOnboardingData,
} from "@/features/profile/utils";

import type { ProfileFeatureProps } from "./profileFeatureTypes";

export default function ProfileFeature({
  setMobileHeaderActions,
}: ProfileFeatureProps) {
  const navigation = useNavigation();
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

  useEffect(() => {
    return () => {
      setMobileHeaderActions(null);
    };
  }, [setMobileHeaderActions]);

  useEffect(() => {
    const { pathname } = navigation.getCurrentRoute();
    if (!pathname.startsWith("/profile/docusign")) return;

    const searchParams = navigation.getSearchParams();
    const connected = searchParams.get("connected") === "true";
    const hasError = searchParams.get("error") === "true";

    if (!connected && !hasError) return;

    if (connected) {
      showSuccessToast("DocuSign connected successfully.");
    } else if (hasError) {
      showErrorToast("DocuSign connection failed. Please try again.");
    }

    navigation.navigateToPath("/profile", { replace: true });
  }, [navigation]);

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
      const scrollPosition = win.scrollY + 200;
      const documentHeight = doc.documentElement.scrollHeight;
      const windowHeight = win.innerHeight;
      const scrollBottom = scrollPosition + windowHeight;

      if (win.scrollY <= 5) {
        setActiveSection(sections[0] ?? "");
        return;
      }
      if (scrollBottom >= documentHeight - 100) {
        setActiveSection(sections[sections.length - 1] ?? "");
        return;
      }
      for (let i = sections.length - 1; i >= 0; i--) {
        const id = sections[i];
        const element = id ? doc.getElementById(id) : null;
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(id ?? "");
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
        setActiveSection(sections[0] ?? "");
        return;
      }
      if (scrollBottom >= documentHeight - 100) {
        setActiveSection(sections[sections.length - 1] ?? "");
        return;
      }
      for (let i = sections.length - 1; i >= 0; i--) {
        const id = sections[i];
        const element = id ? doc.getElementById(id) : null;
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(id ?? "");
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
      void setLoadError("Failed to load Google Maps script.");
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
    (field: keyof OnboardingData, value: unknown) => {
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
          <PersonalizationSectionLayoutProvider>
            <main
              className={`w-full flex-1 space-y-8 ${
                !isUltraSmallScreen ? "lg:ml-0" : ""
              }`}
            >
              {STEPS.map((step) => (
                <PersonalizationSectionPanel
                  key={step.id}
                  sectionId={step.id}
                  screenReaderHeading={step.title}
                >
                  {renderSectionContent(step.id)}
                </PersonalizationSectionPanel>
              ))}
            </main>
          </PersonalizationSectionLayoutProvider>
        </Box>
      </Box>
    </Box>
  );
}
