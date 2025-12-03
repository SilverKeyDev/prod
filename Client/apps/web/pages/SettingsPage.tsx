// React imports
import type { DragEndEvent } from "@dnd-kit/core";
import React, { useState, useEffect, useCallback } from "react";

// Google Maps types
/// <reference types="google.maps" />

// Components
import AlignedRow from "../components/layout/AlignedRow";
import Card from "../components/layout/Card";
import {
  Loading,
  OliveCheckbox,
  Dropdown,
  Input,
  Title,
  Subtitle,
} from "../components/ui";

// Core
import { useGoogleMapsStore } from "../../../packages/store/googleMaps.slice";
import { showErrorToast } from "../../../packages/hooks/ui/useToast";
import { useUserPreferences } from "../../../packages/hooks/data/useUserData";
import useMobile from "../../../packages/hooks/ui/useMobile";

// Features
import OnPerDragDropPriorities from "../features/onboardpersonalize/DragDropPriorities";
import HomePriceEstimate from "../features/onboardpersonalize/HomePriceEstimate";
import ImportantLocationsInput from "../features/onboardpersonalize/ImportantLocationsInput";
import Label from "../features/onboardpersonalize/Label";
import {
  getPersonalizationSteps,
  SECTION_TITLES,
  FIELD_LABELS,
  CREDIT_SCORE_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  COMMUNICATION_FREQUENCY_OPTIONS,
  DEFAULT_REPORT_SECTIONS,
  type OnboardingData,
} from "../features/onboardpersonalize/lib/constants";
import { handleDragEnd as handleDragEndUtil } from "../features/onboardpersonalize/lib/dragEndHandler";
import {
  calculateAffordableHomePrice,
  type HomePriceResult,
} from "../features/onboardpersonalize/lib/homePriceCalculation";
import { handleSubmit as handleSubmitUtil } from "../features/onboardpersonalize/lib/submitHandler";
import { validateSettingsData } from "../features/onboardpersonalize/lib/validation";
import PersonalizationMobileHeader from "../features/onboardpersonalize/personalization/MobileHeader";
import PersonalizationSidebar from "../features/onboardpersonalize/personalization/Sidebar";
import PriceRangeSlider from "../features/onboardpersonalize/PriceRangeSlider";
import BudgetRangeSlider from "../features/onboardpersonalize/BudgetRangeSlider";
import OnPerTagInput from "../features/onboardpersonalize/TagInput";

// Google Maps types are handled by the global declaration in packages/services/googleMaps.ts

type PersonalizationPageProps = {
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};

const STEPS = getPersonalizationSteps();

export default function PersonalizationPage({
  setMobileHeaderActions,
}: PersonalizationPageProps) {
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
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
          : "Failed to calculate home price"
      );
      setHomePriceResult(null);
    } finally {
      setHomePriceLoading(false);
    }
  }, [formData]);

  // Use the default report sections from constants
  const defaultReportSections = DEFAULT_REPORT_SECTIONS;

  // Get ordered report sections based on user preferences
  const getOrderedReportSections = () => {
    try {
      if (!formData || !defaultReportSections) {
        return [];
      }

      const priorities = formData.report_section_priorities ?? [];
      const sections = [...defaultReportSections];

      // Sort sections based on priorities - included items first in priority order, excluded items at end
      const orderedSections = sections.sort((a, b) => {
        if (!a || !b || !a.key || !b.key) return 0;

        const aIncluded = priorities.includes(a.key);
        const bIncluded = priorities.includes(b.key);

        // Excluded items go to the end
        if (aIncluded !== bIncluded) {
          return aIncluded ? -1 : 1;
        }

        // For included items, use priority order
        const aPriority = priorities.indexOf(a.key);
        const bPriority = priorities.indexOf(b.key);

        // Items not in priorities should come after items in priorities
        if (aPriority === -1 && bPriority === -1) return 0;
        if (aPriority === -1) return 1; // A comes after B
        if (bPriority === -1) return -1; // B comes after A

        return aPriority - bPriority;
      });

      return orderedSections;
    } catch (error: unknown) {
      console.error("Error in getOrderedReportSections:", error);
      return [];
    }
  };

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

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    handleDragEndUtil({
      event,
      getOrderedReportSections,
      formData,
      updateFormData,
    });
  };

  // Handle checkbox toggle for report sections
  const handleReportSectionToggle = (sectionKey: string, checked: boolean) => {
    const currentPriorities = formData.report_section_priorities ?? [];

    if (!checked) {
      // Remove from priorities when unchecked
      const newPriorities = currentPriorities.filter(
        (key) => key !== sectionKey
      );
      updateFormData("report_section_priorities", newPriorities);
    } else {
      // Add to last priority (bottom of list) when checked (if not already there)
      if (!currentPriorities.includes(sectionKey)) {
        // Add to the end of the list (last priority)
        updateFormData("report_section_priorities", [
          ...currentPriorities,
          sectionKey,
        ]);
      }
    }
  };

  const loadUserPreferencesFromContext = useCallback(() => {
    try {
      setIsLoading(true);

      if (userPreferences) {
        setFormData(userPreferences as OnboardingData);
        setOriginalData(userPreferences as OnboardingData);
      }
    } catch (error: unknown) {
      console.error("Failed to load user preferences from context:", error);
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
      void void loadUserPreferencesFromContext();
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
  }, []);

  // Use centralized Google Maps loading
  const { isLoaded: googleMapsLoaded, error: googleMapsError } =
    useGoogleMapsStore();

  // Update scriptsReady based on centralized Google Maps loading
  useEffect(() => {
    if (googleMapsError) {
      console.error("❌ Google Maps loading error:", googleMapsError);
      void void setLoadError("Failed to load Google Maps script.");
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
    []
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
        console.log("Preferences saved successfully");
      },
      onError: (error) => {
        console.error("Failed to update preferences:", error);
        showErrorToast("Failed to update preferences. Please try again.");
      },
    });
  }, [formData]);

  const handleCancel = useCallback(() => {
    setFormData(originalData);
    setIsEditMode(false);
  }, [originalData]);

  // Handle mobile header actions based on screen size
  const isMobile = useMobile();
  const isUltraSmallScreen = useMobile("(max-width: 768px)"); // Hide sidebar on ultra small screens
  const isDesktop = useMobile("(min-width: 768px)"); // Check if we're at or above md breakpoint

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
      case "financial":
        return (
          <Card className="space-y-6">
            <Title size="md" className="mb-6">
              Financial Information
            </Title>
            <div className="col-span-1 flex flex-col items-center md:col-span-2">
              <Title size="sm" className="mb-2 w-full text-center">
                {FIELD_LABELS.HOME_BUDGET}
              </Title>
              {isEditMode ? (
                <BudgetRangeSlider
                  tickValues={[
                    200000, 400000, 600000, 1000000, 1500000, 2500000, 4000000,
                    6000000, 10000000,
                  ]}
                  minValue={formData.home_budget_min ?? 200000}
                  maxValue={formData.home_budget_max ?? 1000000}
                  onChange={(minValue, maxValue) => {
                    // Round to nearest $25,000 increment
                    const roundedMin = Math.round(minValue / 25000) * 25000;
                    const roundedMax = Math.round(maxValue / 25000) * 25000;
                    updateFormData("home_budget_min", roundedMin);
                    updateFormData("home_budget_max", roundedMax);
                  }}
                  formatPrefix="$"
                  className="mt-2"
                />
              ) : (
                <div className="mobile-input mt-2 bg-gray-50 text-center">
                  <div className="text-lg font-normal">
                    ${(formData.home_budget_min ?? 0).toLocaleString()} - $
                    {(formData.home_budget_max ?? 0).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <AlignedRow
              breakIntoRows="md"
              gap="lg"
              justify="start"
              items={[
                {
                  title: <Label>Gross Annual Income (after debts)</Label>,
                  content: isEditMode ? (
                    <PriceRangeSlider
                      tickValues={[
                        50000, 100000, 200000, 300000, 500000, 750000, 1000000,
                      ]}
                      value={formData.gross_income ?? 100000}
                      onChange={(value) => {
                        // Round to nearest $5,000 increment
                        const roundedValue = Math.round(value / 5000) * 5000;
                        updateFormData("gross_income", roundedValue);
                      }}
                      formatPrefix="$"
                      className="mt-2"
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50 text-left">
                      {formData.gross_income
                        ? `$${formData.gross_income.toLocaleString()}`
                        : "Not specified"}
                    </div>
                  ),
                },
                {
                  title: <Label>Down Payment</Label>,
                  content: isEditMode ? (
                    <PriceRangeSlider
                      tickValues={[
                        100000, 250000, 500000, 1000000, 2000000, 5000000,
                      ]}
                      value={formData.down_payment ?? 100000}
                      onChange={(value) => {
                        // Round to nearest $5,000 increment
                        const roundedValue = Math.round(value / 5000) * 5000;
                        updateFormData("down_payment", roundedValue);
                      }}
                      formatPrefix="$"
                      className="mt-2"
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50 text-left">
                      {formData.down_payment
                        ? `$${formData.down_payment.toLocaleString()}`
                        : "Not specified"}
                    </div>
                  ),
                },
              ]}
            />

            <AlignedRow
              breakIntoRows="md"
              gap="lg"
              justify="evenly"
              items={[
                {
                  title: <Label>Ideal Zip Code</Label>,
                  content: isEditMode ? (
                    <Input
                      type="text"
                      value={formData.ideal_zip_code ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateFormData("ideal_zip_code", e.target.value)
                      }
                      placeholder="Enter zip code"
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50">
                      {formData.ideal_zip_code ?? "Not specified"}
                    </div>
                  ),
                },
                {
                  title: <Label>{FIELD_LABELS.CREDIT_SCORE_RANGE}</Label>,
                  content: isEditMode ? (
                    <Dropdown
                      value={formData.credit_score_range ?? ""}
                      onChange={(value) =>
                        updateFormData("credit_score_range", value)
                      }
                      options={CREDIT_SCORE_OPTIONS}
                      placeholder="Select..."
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50">
                      {formData.credit_score_range
                        ? (CREDIT_SCORE_OPTIONS.find(
                            (option) =>
                              option.value === formData.credit_score_range
                          )?.label ?? "Not specified")
                        : "Not specified"}
                    </div>
                  ),
                },
              ]}
            />

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <HomePriceEstimate
                homePriceLoading={homePriceLoading}
                homePriceError={homePriceError}
                homePriceResult={homePriceResult}
                isAffordabilityCollapsed={isAffordabilityCollapsed}
                setIsAffordabilityCollapsed={setIsAffordabilityCollapsed}
                idealZipCode={formData.ideal_zip_code}
              />
            </div>
          </Card>
        );

      case "housing":
        return (
          <Card className="space-y-6">
            <Title size="md" className="mb-2">
              {SECTION_TITLES.HOUSING_PREFERENCES}
            </Title>

            <AlignedRow
              breakIntoRows="md"
              gap="lg"
              justify="start"
              items={[
                {
                  title: <Label>{FIELD_LABELS.PREFERRED_HOUSING_TYPE}</Label>,
                  content: isEditMode ? (
                    <Dropdown
                      value={formData.preferred_housing_type ?? ""}
                      onChange={(value) =>
                        updateFormData("preferred_housing_type", value)
                      }
                      options={HOUSING_TYPE_OPTIONS}
                      placeholder="Select..."
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50">
                      {formData.preferred_housing_type
                        ? (HOUSING_TYPE_OPTIONS.find(
                            (option) =>
                              option.value === formData.preferred_housing_type
                          )?.label ?? "Not specified")
                        : "Not specified"}
                    </div>
                  ),
                },
                {
                  title: <Label>{FIELD_LABELS.PREFERRED_BEDROOMS}</Label>,
                  content: isEditMode ? (
                    <Input
                      type="number"
                      value={formData.preferred_bedrooms?.toString() ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateFormData(
                          "preferred_bedrooms",
                          parseInt(e.target.value) || undefined
                        )
                      }
                      placeholder="Number of bedrooms"
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50">
                      {formData.preferred_bedrooms ?? "Not specified"}
                    </div>
                  ),
                },
              ]}
            />

            <AlignedRow
              breakIntoRows="md"
              gap="lg"
              justify="start"
              items={[
                {
                  title: <Label>{FIELD_LABELS.PREFERRED_BATHROOMS}</Label>,
                  content: isEditMode ? (
                    <Input
                      type="number"
                      value={formData.preferred_bathrooms?.toString() ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateFormData(
                          "preferred_bathrooms",
                          parseInt(e.target.value) || undefined
                        )
                      }
                      placeholder="Number of bathrooms"
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50">
                      {formData.preferred_bathrooms ?? "Not specified"}
                    </div>
                  ),
                },
                {
                  title: <Label>{FIELD_LABELS.PREFERRED_LOT_SIZE}</Label>,
                  content: isEditMode ? (
                    <Dropdown
                      value={formData.preferred_lot_size ?? ""}
                      onChange={(value) =>
                        updateFormData("preferred_lot_size", value)
                      }
                      options={[
                        { value: "small", label: "Small (under 0.25 acres)" },
                        { value: "medium", label: "Medium (0.25 - 0.5 acres)" },
                        { value: "large", label: "Large (0.5 - 1 acre)" },
                        { value: "very_large", label: "Very Large (1+ acres)" },
                      ]}
                      placeholder="Select..."
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50">
                      {formData.preferred_lot_size
                        ? [
                            {
                              value: "small",
                              label: "Small (under 0.25 acres)",
                            },
                            {
                              value: "medium",
                              label: "Medium (0.25 - 0.5 acres)",
                            },
                            { value: "large", label: "Large (0.5 - 1 acre)" },
                            {
                              value: "very_large",
                              label: "Very Large (1+ acres)",
                            },
                          ].find(
                            (opt) => opt.value === formData.preferred_lot_size
                          )?.label
                        : "Not specified"}
                    </div>
                  ),
                },
              ]}
            />

            <AlignedRow
              breakIntoRows="md"
              gap="lg"
              justify="start"
              items={[
                {
                  title: <Label>{FIELD_LABELS.PREFERRED_HOME_AGE}</Label>,
                  content: isEditMode ? (
                    <Dropdown
                      value={formData.preferred_home_age ?? ""}
                      onChange={(value) =>
                        updateFormData("preferred_home_age", value)
                      }
                      options={[
                        { value: "new", label: "New (0-5 years)" },
                        { value: "recent", label: "Recent (5-15 years)" },
                        {
                          value: "established",
                          label: "Established (15-30 years)",
                        },
                        { value: "mature", label: "Mature (30-50 years)" },
                        { value: "historic", label: "Historic (50+ years)" },
                      ]}
                      placeholder="Select..."
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50">
                      {formData.preferred_home_age
                        ? [
                            { value: "new", label: "New (0-5 years)" },
                            { value: "recent", label: "Recent (5-15 years)" },
                            {
                              value: "established",
                              label: "Established (15-30 years)",
                            },
                            { value: "mature", label: "Mature (30-50 years)" },
                            {
                              value: "historic",
                              label: "Historic (50+ years)",
                            },
                          ].find(
                            (opt) => opt.value === formData.preferred_home_age
                          )?.label
                        : "Not specified"}
                    </div>
                  ),
                },
                {
                  title: (
                    <Label>{FIELD_LABELS.PREFERRED_ARCHITECTURAL_STYLE}</Label>
                  ),
                  content: isEditMode ? (
                    <Dropdown
                      value={formData.preferred_architectural_style ?? ""}
                      onChange={(value) =>
                        updateFormData("preferred_architectural_style", value)
                      }
                      options={[
                        { value: "modern", label: "Modern" },
                        { value: "traditional", label: "Traditional" },
                        { value: "colonial", label: "Colonial" },
                        { value: "ranch", label: "Ranch" },
                        { value: "craftsman", label: "Craftsman" },
                        { value: "victorian", label: "Victorian" },
                        { value: "mediterranean", label: "Mediterranean" },
                        { value: "contemporary", label: "Contemporary" },
                      ]}
                      placeholder="Select..."
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50">
                      {formData.preferred_architectural_style
                        ? [
                            { value: "modern", label: "Modern" },
                            { value: "traditional", label: "Traditional" },
                            { value: "colonial", label: "Colonial" },
                            { value: "ranch", label: "Ranch" },
                            { value: "craftsman", label: "Craftsman" },
                            { value: "victorian", label: "Victorian" },
                            { value: "mediterranean", label: "Mediterranean" },
                            { value: "contemporary", label: "Contemporary" },
                          ].find(
                            (opt) =>
                              opt.value ===
                              formData.preferred_architectural_style
                          )?.label
                        : "Not specified"}
                    </div>
                  ),
                },
              ]}
            />

            <AlignedRow
              breakIntoRows="md"
              gap="lg"
              justify="start"
              items={[
                {
                  title: <Label>{FIELD_LABELS.RENOVATION_PREFERENCE}</Label>,
                  content: isEditMode ? (
                    <Dropdown
                      value={formData.renovation_preference ?? ""}
                      onChange={(value) =>
                        updateFormData("renovation_preference", value)
                      }
                      options={[
                        { value: "none", label: "None - Move-in Ready" },
                        { value: "minor", label: "Minor Cosmetic Updates" },
                        { value: "major", label: "Major Renovations" },
                        { value: "complete", label: "Complete Renovation" },
                      ]}
                      placeholder="Select..."
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50">
                      {formData.renovation_preference
                        ? [
                            { value: "none", label: "None - Move-in Ready" },
                            { value: "minor", label: "Minor Cosmetic Updates" },
                            { value: "major", label: "Major Renovations" },
                            { value: "complete", label: "Complete Renovation" },
                          ].find(
                            (opt) =>
                              opt.value === formData.renovation_preference
                          )?.label
                        : "Not specified"}
                    </div>
                  ),
                },
                {
                  title: <Label>{FIELD_LABELS.INTENDED_PROPERTY_USE}</Label>,
                  content: isEditMode ? (
                    <Dropdown
                      value={formData.intended_property_use ?? ""}
                      onChange={(value) =>
                        updateFormData("intended_property_use", value)
                      }
                      options={[
                        { value: "primary", label: "Primary Residence" },
                        { value: "investment", label: "Investment Property" },
                        { value: "vacation", label: "Vacation Home" },
                        { value: "rental", label: "Rental Property" },
                      ]}
                      placeholder="Select..."
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50">
                      {formData.intended_property_use
                        ? [
                            { value: "primary", label: "Primary Residence" },
                            {
                              value: "investment",
                              label: "Investment Property",
                            },
                            { value: "vacation", label: "Vacation Home" },
                            { value: "rental", label: "Rental Property" },
                          ].find(
                            (opt) =>
                              opt.value === formData.intended_property_use
                          )?.label
                        : "Not specified"}
                    </div>
                  ),
                },
              ]}
            />

            <AlignedRow
              breakIntoRows="md"
              gap="lg"
              justify="start"
              items={[
                {
                  title: <Label>{FIELD_LABELS.WALKABILITY_IMPORTANCE}</Label>,
                  content: isEditMode ? (
                    <Dropdown
                      value={formData.walkability_importance ?? ""}
                      onChange={(value) =>
                        updateFormData("walkability_importance", value)
                      }
                      options={[
                        { value: "very_important", label: "Very Important" },
                        {
                          value: "somewhat_important",
                          label: "Somewhat Important",
                        },
                        { value: "not_important", label: "Not Important" },
                      ]}
                      placeholder="Select..."
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50">
                      {formData.walkability_importance
                        ? [
                            {
                              value: "very_important",
                              label: "Very Important",
                            },
                            {
                              value: "somewhat_important",
                              label: "Somewhat Important",
                            },
                            { value: "not_important", label: "Not Important" },
                          ].find(
                            (opt) =>
                              opt.value === formData.walkability_importance
                          )?.label
                        : "Not specified"}
                    </div>
                  ),
                },
                // Only include spacer on desktop (above md breakpoint) to avoid gap in single column
                ...(isDesktop
                  ? [
                      {
                        title: (
                          <div className="mb-2 block text-sm font-medium text-transparent">
                            &nbsp;
                          </div>
                        ),
                        content: (
                          <div className="mobile-input bg-gray-50 opacity-0">
                            &nbsp;
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />

            <div className="space-y-6">
              <div>
                <Label>{FIELD_LABELS.PREFERRED_HOME_FEATURES}</Label>
                <OnPerTagInput
                  value={(formData.preferred_home_features as string[]) ?? []}
                  onChange={(value: string[]) =>
                    updateFormData("preferred_home_features", value)
                  }
                  placeholder="e.g., garage, pool, fireplace"
                  isEditMode={isEditMode}
                />
              </div>

              <div>
                <Label>{FIELD_LABELS.DEAL_BREAKERS}</Label>
                <OnPerTagInput
                  value={(formData.deal_breakers as string[]) ?? []}
                  onChange={(value: string[]) =>
                    updateFormData("deal_breakers", value)
                  }
                  placeholder="e.g., No parking, Busy road, Old plumbing"
                  isEditMode={isEditMode}
                />
              </div>
            </div>
          </Card>
        );

      case "location":
        return (
          <Card className="space-y-2 mb-64">
            <Title size="md">Location Preferences</Title>

            {/* Important Locations for Commute */}
            <div className="flex w-full flex-col">
              <Subtitle size="xs" muted className="mb-4">
                Locations set an exact search range; give work, family, or
                frequently visited places.
              </Subtitle>
              <ImportantLocationsInput
                locations={formData.important_locations ?? []}
                onChange={(locations) =>
                  updateFormData("important_locations", locations)
                }
                scriptsReady={scriptsReady}
                isEditMode={isEditMode}
              />
              {loadError && (
                <p className="mt-2 text-xs text-red-500">{loadError}</p>
              )}
            </div>
          </Card>
        );

      case "communication":
        return (
          <Card className="space-y-6">
            <Title size="md" className="mb-6">
              {SECTION_TITLES.COMMUNICATION_PREFERENCES}
            </Title>

            {/* Communication Preference */}
            <div>
              <Label>{FIELD_LABELS.COMMUNICATION_FREQUENCY}</Label>
              {isEditMode ? (
                <Dropdown
                  value={formData.communication_frequency ?? ""}
                  onChange={(value) =>
                    updateFormData("communication_frequency", value)
                  }
                  options={COMMUNICATION_FREQUENCY_OPTIONS}
                  placeholder="Select..."
                />
              ) : (
                <div className="mobile-input bg-gray-50">
                  {formData.communication_frequency
                    ? (COMMUNICATION_FREQUENCY_OPTIONS.find(
                        (option) =>
                          option.value === formData.communication_frequency
                      )?.label ?? "Not specified")
                    : "Not specified"}
                </div>
              )}
            </div>

            {/* Information Detail Level */}
            <div>
              <Label>{FIELD_LABELS.INFORMATION_DETAIL_LEVEL}</Label>
              {isEditMode ? (
                <Dropdown
                  value={formData.information_detail_level ?? ""}
                  onChange={(value) =>
                    updateFormData("information_detail_level", value)
                  }
                  options={[
                    { value: "brief", label: "Brief" },
                    { value: "moderate", label: "Moderate" },
                    { value: "detailed", label: "Detailed" },
                    { value: "comprehensive", label: "Comprehensive" },
                  ]}
                  placeholder="Select..."
                />
              ) : (
                <div className="mobile-input bg-gray-50">
                  {formData.information_detail_level
                    ? [
                        { value: "brief", label: "Brief" },
                        { value: "moderate", label: "Moderate" },
                        { value: "detailed", label: "Detailed" },
                        { value: "comprehensive", label: "Comprehensive" },
                      ].find(
                        (opt) => opt.value === formData.information_detail_level
                      )?.label
                    : "Not specified"}
                </div>
              )}
            </div>

            <AlignedRow
              breakIntoRows="md"
              gap="lg"
              justify="start"
              items={[
                {
                  title: <Label>{FIELD_LABELS.HAS_BUYERS_AGENT}</Label>,
                  content: isEditMode ? (
                    <Dropdown
                      value={formData.has_buyers_agent ?? ""}
                      onChange={(value) =>
                        updateFormData("has_buyers_agent", value)
                      }
                      options={[
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                      ]}
                      placeholder="Select..."
                    />
                  ) : (
                    <div className="mobile-input bg-gray-50">
                      {formData.has_buyers_agent
                        ? [
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                          ].find(
                            (opt) => opt.value === formData.has_buyers_agent
                          )?.label
                        : "Not specified"}
                    </div>
                  ),
                },
                {
                  title:
                    formData.has_buyers_agent === "no" ? (
                      <Label>Looking for Agent?</Label>
                    ) : (
                      <div className="mb-2 block text-sm font-medium text-transparent">
                        &nbsp;
                      </div>
                    ),
                  content:
                    formData.has_buyers_agent === "no" ? (
                      <div className="flex h-full items-center">
                        <label
                          htmlFor="looking-buyers-agent"
                          className="flex cursor-pointer items-center gap-3 text-sm font-medium text-black"
                        >
                          {isEditMode ? (
                            <>
                              <input
                                type="checkbox"
                                id="looking-buyers-agent"
                                className="sr-only"
                                checked={!!formData.looking_for_buyers_agent}
                                onChange={() =>
                                  updateFormData(
                                    "looking_for_buyers_agent",
                                    !formData.looking_for_buyers_agent
                                  )
                                }
                                aria-label="I am looking for a buyer's agent"
                              />
                              <OliveCheckbox
                                checked={!!formData.looking_for_buyers_agent}
                                onToggle={() =>
                                  updateFormData(
                                    "looking_for_buyers_agent",
                                    !formData.looking_for_buyers_agent
                                  )
                                }
                              />
                            </>
                          ) : (
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded border ${
                                formData.looking_for_buyers_agent
                                  ? "border-olive bg-olive"
                                  : "border-gray-300 bg-gray-50"
                              }`}
                            >
                              {formData.looking_for_buyers_agent && (
                                <svg
                                  className="h-4 w-4 text-gray-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                          )}
                          <span className="select-none">
                            I am looking for a buyer's agent
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="mobile-input bg-gray-50 opacity-0">
                        &nbsp;
                      </div>
                    ),
                },
              ]}
            />
          </Card>
        );

      case "reportcustomization": {
        if (isLoading) {
          return (
            <Card className="space-y-6">
              <h2 className="mb-6 font-serif text-xl text-black sm:text-2xl">
                Priorities
              </h2>
              <Loading message="Loading report customization options..." />
            </Card>
          );
        }

        const orderedSections = getOrderedReportSections();

        if (!orderedSections || orderedSections.length === 0) {
          return (
            <Card className="space-y-6">
              <h2 className="mb-6 font-serif text-xl text-black sm:text-2xl">
                Priorities
              </h2>
              <Loading message="Loading report customization options..." />
            </Card>
          );
        }

        return (
          <Card className="space-y-6">
            <OnPerDragDropPriorities
              isEditMode={isEditMode}
              isLoading={false}
              orderedSections={orderedSections}
              formData={formData}
              onDragEnd={handleDragEnd}
              onToggle={handleReportSectionToggle}
            />
          </Card>
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <div className="mx-auto max-w-7xl pb-1 sm:px-6 lg:px-8">
        <div className="flex flex-row gap-6 lg:gap-8">
          {/* Sidebar - Hidden below lg, completely hidden on ultra small screens */}
          {!isUltraSmallScreen && (
            <PersonalizationSidebar
              activeSection={activeSection}
              isEditMode={isEditMode}
              isSaving={isSaving}
              onEdit={() => setIsEditMode(true)}
              onSave={handleSaveChanges}
              onCancel={handleCancel}
              onScrollToSection={scrollToSection}
            />
          )}

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
