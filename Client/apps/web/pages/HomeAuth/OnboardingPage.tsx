// React imports
import type { DragEndEvent } from "@dnd-kit/core";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Assets
import KeyLogo from "/logo.png?url";
// Components
import { ValidationWarning } from "../../components/feedback";
import Card from "../../components/layout/Card";
import {
  Loading,
  Input,
  Dropdown,
  Title,
  Subtitle,
  NavigationButtons,
} from "../../components/ui";
// Core
import { useGoogleMaps } from "../../../../packages/hooks/data/useGoogleMaps";
// Features
import OnPerBuyersAgent from "../../features/onboardpersonalize/BuyersAgent";
import OnPerDragDropPriorities from "../../features/onboardpersonalize/DragDropPriorities";
import HomePriceEstimate from "../../features/onboardpersonalize/HomePriceEstimate";
import type { HomePriceResult } from "../../features/onboardpersonalize/lib/homePriceCalculation";
import ImportantLocationsInput from "../../features/onboardpersonalize/ImportantLocationsInput";
import {
  ONBOARDING_STEPS,
  DEFAULT_REPORT_SECTIONS,
  GENDER_OPTIONS,
  type OnboardingData,
  PETS_OPTIONS,
  CREDIT_SCORE_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  LOT_SIZE_OPTIONS,
  WALKABILITY_OPTIONS,
  COMMUNICATION_FREQUENCY_OPTIONS,
  INFORMATION_DETAIL_OPTIONS,
  HOME_AGE_OPTIONS,
  RENOVATION_PREFERENCE_OPTIONS,
  PROPERTY_USE_OPTIONS,
  SECTION_TITLES,
  FIELD_LABELS,
} from "../../features/onboardpersonalize/lib/constants";
import { handleDragEnd as handleDragEndUtil } from "../../features/onboardpersonalize/lib/dragEndHandler";
import { calculateAffordableHomePrice } from "../../features/onboardpersonalize/lib/homePriceCalculation";
import { handleSubmit as handleSubmitUtil } from "../../features/onboardpersonalize/lib/submitHandler";
import OnboardingHeader from "../../features/onboardpersonalize/onboard/Header";
import {
  RequiredLabel,
  OptionalLabel,
} from "../../features/onboardpersonalize/OnPerLabel";
import PriceRangeSlider from "../../features/onboardpersonalize/PriceRangeSlider";
import OnPerTagInput from "../../features/onboardpersonalize/TagInput";

// Utility functions

// Google Maps types are declared in googleMaps.ts

const STEPS = ONBOARDING_STEPS;

const REPORT_SECTIONS = DEFAULT_REPORT_SECTIONS;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    // Initialize report customization with empty array - users will select their own priorities
    report_section_priorities: [],
    important_locations: [],
  });
  const [loading, setLoading] = useState(false);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    missingFields: string[];
    errors: string[];
  }>({ missingFields: [], errors: [] });

  // Home price calculation state
  const [homePriceLoading, setHomePriceLoading] = useState(false);
  const [homePriceError, setHomePriceError] = useState<string | null>(null);
  const [homePriceResult, setHomePriceResult] =
    useState<HomePriceResult | null>(null);
  const [isAffordabilityCollapsed, setIsAffordabilityCollapsed] =
    useState(false);
  const navigate = useNavigate();

  const calculateHomePrice = useCallback(() => {
    // Check if we have all required data
    if (!formData.gross_income || !formData.ideal_zip_code) {
      return;
    }

    try {
      setHomePriceLoading(true);
      setHomePriceError(null);

      const result = calculateAffordableHomePrice(formData);

      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        typeof result.error === "string"
      ) {
        setHomePriceError(result.error);
        setHomePriceResult(null);
      } else {
        setHomePriceResult(result as HomePriceResult);
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
    // Only calculate if we're on the financial section
    if (currentStep !== 1) return;

    // Check if we have the required data
    if (
      formData.gross_income &&
      formData.ideal_zip_code &&
      formData.credit_score_range &&
      formData.down_payment
    ) {
      void calculateHomePrice();
    }
  }, [
    formData.gross_income,
    formData.ideal_zip_code,
    formData.credit_score_range,
    formData.down_payment,
    currentStep,
    calculateHomePrice,
  ]);

  // Get ordered report sections based on user preferences
  const getOrderedReportSections = () => {
    try {
      if (!formData || !REPORT_SECTIONS) {
        return [];
      }

      const priorities = formData.report_section_priorities ?? [];
      const sections = [...REPORT_SECTIONS];

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
        (key) => key !== sectionKey,
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

  // Load formData from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem("onboardingDraft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as Record<string, unknown>;
        // Type-safe parsing with proper type guards
        if (parsed && typeof parsed === "object") {
          setFormData(parsed as OnboardingData);
        }
      } catch {
        console.warn("Invalid onboarding draft data");
      }
    }
  }, []);

  // Save formData to localStorage on change
  useEffect(() => {
    localStorage.setItem("onboardingDraft", JSON.stringify(formData));
  }, [formData]);

  // Trigger home price calculation when relevant form data changes

  // Update form data with new value
  const updateFormData = (field: string | number | symbol, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Use centralized Google Maps loading
  const { isLoaded: googleMapsLoaded, error: googleMapsError } =
    useGoogleMaps();

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

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleSubmit = async () => {
    await handleSubmitUtil({
      formData,
      setLoading,
      setValidationResult,
      setShowValidationWarning,
      navigate,
    });
  };

  // Handler for closing the validation warning
  const handleCloseValidationWarning = () => {
    setShowValidationWarning(false);
  };

  // Handler for reviewing information from validation warning
  const handleReviewInformation = () => {
    setShowValidationWarning(false);

    // Navigate to the first missing field's section if possible
    const firstMissingField = validationResult.missingFields[0];
    if (firstMissingField) {
      // Try to determine which step contains the missing field and navigate there
      if (
        firstMissingField.includes("Age") ??
        firstMissingField.includes("Gender") ??
        firstMissingField.includes("Occupation") ??
        firstMissingField.includes("Pet")
      ) {
        setCurrentStep(0); // Demographics
      } else if (
        firstMissingField.includes("income") ??
        firstMissingField.includes("budget") ??
        firstMissingField.includes("credit") ??
        firstMissingField.includes("payment")
      ) {
        setCurrentStep(1); // Financial
      } else if (
        firstMissingField.includes("housing") ??
        firstMissingField.includes("bedroom") ??
        firstMissingField.includes("bathroom") ??
        firstMissingField.includes("lot") ??
        firstMissingField.includes("home") ??
        firstMissingField.includes("renovation") ??
        firstMissingField.includes("property")
      ) {
        setCurrentStep(2); // Housing
      } else if (
        firstMissingField.includes("location") ??
        firstMissingField.includes("walkability")
      ) {
        setCurrentStep(3); // Location
      } else if (
        firstMissingField.includes("communication") ??
        firstMissingField.includes("agent")
      ) {
        setCurrentStep(4); // Communication
      } else if (firstMissingField.includes("report")) {
        setCurrentStep(5); // Report Customization
      }
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case "demographics":
        return (
          <div className="space-y-6">
            <Title size="lg" className="mb-4 sm:mb-6">
              Tell us about yourself
            </Title>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <RequiredLabel>Age</RequiredLabel>
                <Input
                  variant="mobile"
                  type="number"
                  value={formData.age?.toString() ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateFormData("age", parseInt(e.target.value) || undefined)
                  }
                  placeholder="Enter your age"
                  min={18}
                  max={100}
                />
              </div>

              <div>
                <RequiredLabel>Gender</RequiredLabel>
                <Dropdown
                  value={formData.gender ?? ""}
                  onChange={(value) => updateFormData("gender", value)}
                  options={GENDER_OPTIONS}
                  placeholder="Select gender"
                />
              </div>

              <div>
                <RequiredLabel>Occupation</RequiredLabel>
                <Input
                  variant="mobile"
                  type="text"
                  value={formData.occupation ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateFormData("occupation", e.target.value)
                  }
                  placeholder="Your job title"
                />
              </div>

              <div>
                <OptionalLabel>Pet Ownership Status</OptionalLabel>
                <Dropdown
                  value={formData.pets ?? ""}
                  onChange={(value) => updateFormData("pets", value)}
                  options={PETS_OPTIONS}
                  placeholder="Select pet status"
                />
              </div>
            </div>
          </div>
        );

      case "financial":
        return (
          <div className="space-y-6">
            <Title size="lg" className="mb-4 sm:mb-6">
              {SECTION_TITLES.FINANCIAL_PROFILE}
            </Title>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="mx-auto w-4/5">
                <label className="mb-1 block w-full text-center text-xs font-normal text-gray-700 sm:text-sm md:text-base">
                  {FIELD_LABELS.GROSS_INCOME} (after debts)
                </label>
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
              </div>

              <div className="mx-auto w-4/5">
                <label className="mb-1 block w-full text-center text-xs font-normal text-gray-700 sm:text-sm md:text-base">
                  {FIELD_LABELS.DOWN_PAYMENT}
                </label>
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
              </div>

              <div>
                <OptionalLabel>{FIELD_LABELS.IDEAL_ZIP_CODE}</OptionalLabel>
                <Input
                  variant="mobile"
                  type="text"
                  value={formData.ideal_zip_code ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateFormData("ideal_zip_code", e.target.value)
                  }
                  placeholder="Enter zip code"
                />
              </div>

              <div>
                <OptionalLabel>{FIELD_LABELS.CREDIT_SCORE_RANGE}</OptionalLabel>
                <Dropdown
                  value={formData.credit_score_range ?? ""}
                  onChange={(value) =>
                    updateFormData("credit_score_range", value)
                  }
                  options={CREDIT_SCORE_OPTIONS}
                  placeholder="Select credit score range"
                />
              </div>

              <div className="col-span-1 flex flex-col items-center md:col-span-2">
                <label className="text-responsive-xl space-y-responsive-xs block w-full text-center font-bold text-gray-700">
                  {FIELD_LABELS.HOME_BUDGET} *
                </label>
                <PriceRangeSlider
                  tickValues={[
                    200000, 500000, 1000000, 2000000, 5000000, 10000000,
                  ]}
                  value={formData.home_budget ?? 500000}
                  onChange={(value) => {
                    // Round to nearest $25,000 increment
                    const roundedValue = Math.round(value / 25000) * 25000;
                    updateFormData("home_budget", roundedValue);
                  }}
                  formatPrefix="$"
                  className="mt-2"
                />
              </div>

              <HomePriceEstimate
                homePriceLoading={homePriceLoading}
                homePriceError={homePriceError}
                homePriceResult={homePriceResult}
                isAffordabilityCollapsed={isAffordabilityCollapsed}
                setIsAffordabilityCollapsed={setIsAffordabilityCollapsed}
                idealZipCode={formData.ideal_zip_code}
              />
            </div>
          </div>
        );

      case "housing":
        return (
          <div className="space-y-6">
            <Title size="md" className="mb-2">
              {SECTION_TITLES.HOUSING_PREFERENCES}
            </Title>
            <Subtitle size="sm" muted className="mb-6">
              Tell us about your ideal home. These preferences help our AI
              understand what features and characteristics matter most to you
              when matching properties to your lifestyle and needs.
            </Subtitle>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <RequiredLabel>
                  {FIELD_LABELS.PREFERRED_HOUSING_TYPE}
                </RequiredLabel>
                <Dropdown
                  value={formData.preferred_housing_type ?? ""}
                  onChange={(value) =>
                    updateFormData("preferred_housing_type", value)
                  }
                  options={HOUSING_TYPE_OPTIONS}
                  placeholder="Select..."
                />
              </div>

              <div>
                <RequiredLabel>{FIELD_LABELS.PREFERRED_BEDROOMS}</RequiredLabel>
                <Input
                  variant="mobile"
                  type="number"
                  value={formData.preferred_bedrooms?.toString() ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateFormData(
                      "preferred_bedrooms",
                      parseInt(e.target.value) || undefined,
                    )
                  }
                  min={1}
                  max={10}
                  placeholder="Number of bedrooms"
                />
              </div>

              <div>
                <RequiredLabel>
                  {FIELD_LABELS.PREFERRED_BATHROOMS}
                </RequiredLabel>
                <Input
                  variant="mobile"
                  type="number"
                  value={formData.preferred_bathrooms?.toString() ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateFormData(
                      "preferred_bathrooms",
                      parseFloat(e.target.value) || undefined,
                    )
                  }
                  min={1}
                  max={10}
                  step={0.5}
                  placeholder="Number of bathrooms"
                />
              </div>

              <div>
                <OptionalLabel>Preferred Lot Size</OptionalLabel>
                <Dropdown
                  value={formData.preferred_lot_size ?? ""}
                  onChange={(value) =>
                    updateFormData("preferred_lot_size", value)
                  }
                  options={LOT_SIZE_OPTIONS}
                  placeholder="Select..."
                />
              </div>

              <div>
                <OptionalLabel>Preferred Home Age</OptionalLabel>
                <Dropdown
                  value={formData.preferred_home_age ?? ""}
                  onChange={(value) =>
                    updateFormData("preferred_home_age", value)
                  }
                  options={HOME_AGE_OPTIONS}
                  placeholder="Select..."
                />
              </div>

              <div>
                <OptionalLabel>Preferred Architectural Style</OptionalLabel>
                <Dropdown
                  value={formData.preferred_architectural_style ?? ""}
                  onChange={(value) =>
                    updateFormData("preferred_architectural_style", value)
                  }
                  options={COMMUNICATION_FREQUENCY_OPTIONS}
                  placeholder="Select..."
                />
              </div>

              <div>
                <OptionalLabel>Renovation Willingness</OptionalLabel>
                <Dropdown
                  value={formData.renovation_preference ?? ""}
                  onChange={(value) =>
                    updateFormData("renovation_preference", value)
                  }
                  options={RENOVATION_PREFERENCE_OPTIONS}
                  placeholder="Select..."
                />
              </div>

              <div>
                <OptionalLabel>Intended Property Use</OptionalLabel>
                <Dropdown
                  value={formData.intended_property_use ?? ""}
                  onChange={(value) =>
                    updateFormData("intended_property_use", value)
                  }
                  options={PROPERTY_USE_OPTIONS}
                  placeholder="Select..."
                />
              </div>

              <div>
                <OptionalLabel>Preferred Home Features</OptionalLabel>
                <OnPerTagInput
                  value={(formData.preferred_home_features as string[]) ?? []}
                  onChange={(value: string[]) =>
                    updateFormData("preferred_home_features", value)
                  }
                  placeholder="e.g., garage, pool, fireplace"
                />
              </div>

              <div>
                <OptionalLabel>Deal Breakers</OptionalLabel>
                <OnPerTagInput
                  value={(formData.deal_breakers as string[]) ?? []}
                  onChange={(value: string[]) =>
                    updateFormData("deal_breakers", value)
                  }
                  placeholder="e.g., No parking, Busy road, Old plumbing"
                />
              </div>
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-6">
            <Title size="md" className="mb-6">
              Location Preferences
            </Title>

            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div>
                <OptionalLabel>Walkability Importance</OptionalLabel>
                <p className="mb-4 text-xs text-black/60 sm:text-sm md:text-base">
                  How important is it to walk to nearby amenities? Used to
                  filter neighborhoods in search results.
                </p>
                <Dropdown
                  value={formData.walkability_importance ?? ""}
                  onChange={(value) =>
                    updateFormData("walkability_importance", value)
                  }
                  options={WALKABILITY_OPTIONS}
                  placeholder="Select..."
                />
              </div>
            </div>

            {/* Important Locations Section */}
            <div>
              <RequiredLabel>Important Locations</RequiredLabel>
              <p className="mb-4 text-xs text-black/60 sm:text-sm md:text-base">
                Add work, family, or frequently visited places. We'll find homes
                with reasonable commute times to these locations.
              </p>
              <ImportantLocationsInput
                locations={formData.important_locations ?? []}
                onChange={(
                  locations: {
                    name: string;
                    address: string;
                    commute_tolerance?: number;
                  }[],
                ) => {
                  updateFormData("important_locations", locations);
                }}
                scriptsReady={scriptsReady}
              />
              {loadError && (
                <p className="mt-2 text-xs text-red-500">{loadError}</p>
              )}
            </div>
          </div>
        );

      case "communication":
        return (
          <div className="space-y-6">
            <Title size="lg" className="mb-4 sm:mb-6">
              {SECTION_TITLES.COMMUNICATION_PREFERENCES}
            </Title>

            {/* Communication Preference */}
            <div>
              <RequiredLabel>
                {FIELD_LABELS.COMMUNICATION_FREQUENCY}
              </RequiredLabel>
              <Dropdown
                value={formData.communication_frequency ?? ""}
                onChange={(value) =>
                  updateFormData("communication_frequency", value)
                }
                options={COMMUNICATION_FREQUENCY_OPTIONS}
                placeholder="Select..."
              />
            </div>

            {/* Information Detail Level */}
            <div>
              <RequiredLabel>Information Detail Level</RequiredLabel>
              <Dropdown
                value={formData.information_detail_level ?? ""}
                onChange={(value) =>
                  updateFormData("information_detail_level", value)
                }
                options={INFORMATION_DETAIL_OPTIONS}
                placeholder="Select..."
              />
            </div>

            <OnPerBuyersAgent
              hasBuyersAgent={formData.has_buyers_agent ?? ""}
              lookingForBuyersAgent={!!formData.looking_for_buyers_agent}
              onHasBuyersAgentChange={(value: string) =>
                updateFormData("has_buyers_agent", value)
              }
              onLookingForBuyersAgentChange={(value: boolean) =>
                updateFormData("looking_for_buyers_agent", value)
              }
            />
          </div>
        );

      case "reportcustomization": {
        if (loading) {
          return (
            <div className="space-y-6">
              <Title size="lg" className="mb-4 sm:mb-6">
                Priorities
              </Title>
              <Loading message="Loading report customization options..." />
            </div>
          );
        }

        const orderedSections = getOrderedReportSections();

        if (!orderedSections || orderedSections.length === 0) {
          return (
            <div className="space-y-6">
              <Title size="lg" className="mb-4 sm:mb-6">
                Priorities
              </Title>
              <Loading message="Loading report customization options..." />
            </div>
          );
        }

        return (
          <OnPerDragDropPriorities
            isEditMode={true}
            isLoading={false}
            orderedSections={orderedSections}
            formData={formData}
            onDragEnd={handleDragEnd}
            onToggle={handleReportSectionToggle}
          />
        );
      }

      default:
        return <div>Step content for {step.title} coming soon...</div>;
    }
  };

  return (
    <div className="mx-auto w-full max-w-[90vw] px-4 pb-20 sm:px-6 sm:pb-8 lg:px-8">
      {/* Header */}
      <div className="mb-3 mt-4 flex items-center justify-between sm:mb-4 sm:mt-6">
        <div className="flex items-center">
          <img
            src={KeyLogo}
            alt="SilverKey Logo"
            className="h-6 sm:h-8 md:h-10"
          />
        </div>
        <div className="flex items-center">
          Step {currentStep + 1} of {STEPS.length}
        </div>
      </div>

      {/* Progress Bar */}
      <OnboardingHeader
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={goToStep}
      />

      {/* Step Content */}
      <div className="mx-auto max-w-[85vw] overflow-hidden rounded-2xl bg-white shadow-sm">
        <Card className="pb-8 sm:pb-12">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="mt-8 border-t border-beige/30 px-4 pb-1 pt-6 sm:mt-10 sm:px-6 sm:pb-2 sm:pt-8">
            <NavigationButtons
              currentStep={currentStep}
              totalSteps={STEPS.length}
              onPrevious={prevStep}
              onNext={nextStep}
              onSubmit={handleSubmit}
              loading={loading}
              layout="centered"
              size="md"
            />
          </div>
        </Card>
      </div>

      {/* Validation Warning Modal */}
      <ValidationWarning
        isVisible={showValidationWarning}
        onClose={handleCloseValidationWarning}
        onReview={handleReviewInformation}
        missingFields={validationResult.missingFields}
        errors={validationResult.errors}
      />
    </div>
  );
}
