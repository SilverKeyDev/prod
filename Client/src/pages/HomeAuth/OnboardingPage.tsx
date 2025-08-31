import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, ChevronDown } from "lucide-react";
import Card from "../../components/ui/base/Card";
import { useGoogleMaps } from "../../context/GoogleMapsContext";
import KeyLogo from "/logo.png";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import ImportantLocationsInput from "../../components/ui/onboardpersonalize/ImportantLocationsInput";
import Loading from "../../components/ui/base/Loading";
import PriceRangeSlider from "../../components/ui/onboardpersonalize/PriceRangeSlider";
import ValidationWarning from "../../components/feedback/ValidationWarning";
import Input from "../../components/ui/base/Input";
import Dropdown from "../../components/ui/base/Dropdown";
import { Title, Subtitle } from "../../components/ui/base";
import OnPerTagInput from "../../components/ui/onboardpersonalize/OnPerTagInput";
import {
  RequiredLabel,
  OptionalLabel,
} from "../../components/ui/onboardpersonalize/OnPerLabel";
import OnboardingHeader from "../../components/ui/onboardpersonalize/OnboardingHeader";
import OnPerDragDropPriorities from "../../components/ui/onboardpersonalize/OnPerDragDropPriorities";
import OnPerBuyersAgent from "../../components/ui/onboardpersonalize/OnPerBuyersAgent";
import { calculateAffordableHomePrice } from "../../lib/onboard/homePriceCalculation";
import {
  OnboardingData,
  ONBOARDING_STEPS,
  DEFAULT_REPORT_SECTIONS,
  GENDER_OPTIONS,
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
  validateFormData,
  SECTION_TITLES,
  FIELD_LABELS,
} from "../../lib/onboard";

// Extend window interface for Google Maps
declare global {
  interface Window {
    google?: any;
  }
}

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
  const [homePriceResult, setHomePriceResult] = useState<any>(null);
  const [isAffordabilityCollapsed, setIsAffordabilityCollapsed] =
    useState(false);
  const navigate = useNavigate();

  const calculateHomePrice = async () => {
    // Check if we have all required data
    if (!formData.gross_income || !formData.ideal_zip_code) {
      return;
    }

    try {
      setHomePriceLoading(true);
      setHomePriceError(null);

      const result = await calculateAffordableHomePrice(formData);

      if ("error" in result) {
        setHomePriceError(result.error);
        setHomePriceResult(null);
      } else {
        setHomePriceResult(result);
      }
    } catch (error) {
      setHomePriceError(
        error instanceof Error
          ? error.message
          : "Failed to calculate home price"
      );
      setHomePriceResult(null);
    } finally {
      setHomePriceLoading(false);
    }
  };

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
      calculateHomePrice();
    }
  }, [
    formData.gross_income,
    formData.ideal_zip_code,
    formData.credit_score_range,
    formData.down_payment,
    currentStep,
  ]);

  // Get ordered report sections based on user preferences
  const getOrderedReportSections = () => {
    try {
      if (!formData || !REPORT_SECTIONS) {
        return [];
      }

      const priorities = formData.report_section_priorities || [];
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
    } catch (error) {
      console.error("Error in getOrderedReportSections:", error);
      return [];
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    try {
      const { active, over } = event;

      if (!active || !over || !active.id || !over.id || active.id === over.id)
        return;

      const sections = getOrderedReportSections();
      const oldIndex = sections.findIndex(
        (section) => section.key === active.id
      );
      const newIndex = sections.findIndex((section) => section.key === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const currentPriorities = formData.report_section_priorities || [];
      const reorderedSections = arrayMove(sections, oldIndex, newIndex);

      // Only include sections that were previously selected (in priorities)
      const newPriorities = reorderedSections
        .filter((section) => currentPriorities.includes(section.key))
        .map((section) => section.key);

      updateFormData("report_section_priorities", newPriorities);
    } catch (error) {
      console.error("Error in handleDragEnd:", error);
    }
  };

  // Handle checkbox toggle for report sections
  const handleReportSectionToggle = (sectionKey: string, checked: boolean) => {
    const currentPriorities = formData.report_section_priorities || [];

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

  // Load formData from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem("onboardingDraft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
      } catch (e) {
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
  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Use centralized Google Maps loading
  const { isLoaded: googleMapsLoaded, error: googleMapsError } =
    useGoogleMaps();

  // Update scriptsReady based on centralized Google Maps loading
  useEffect(() => {
    if (googleMapsError) {
      console.error("❌ Google Maps loading error:", googleMapsError);
      setLoadError("Failed to load Google Maps script.");
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
    // Validate form data before submission
    const validation = validateFormData(formData);

    if (!validation.isValid) {
      // Show the custom validation warning component
      setValidationResult({
        missingFields: validation.missingFields,
        errors: validation.errors,
      });
      setShowValidationWarning(true);
      return;
    }

    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      const requestUrl = `${apiBaseUrl}/api/v1/preferences`;

      const requestHeaders = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${idToken}`,
      };

      const response = await fetch(requestUrl, {
        method: "POST",
        mode: "cors",
        headers: requestHeaders,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorDetails = "No additional error details";
        try {
          const errorText = await response.text();
          errorDetails = errorText;
        } catch (e) {}

        const errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}. Details: ${errorDetails}`;
        console.error("[OnboardingPage] Request failed:", errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success || result.document_id) {
        localStorage.removeItem("onboardingDraft");
        navigate("/dashboard");
      } else {
        const errorMsg = result.error || "Failed to generate report";
        console.error(
          "[OnboardingPage] Server returned unsuccessful result:",
          result
        );
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("[OnboardingPage] Error in handleSubmit:", error);
      console.error(
        "[OnboardingPage] Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );

      // More user-friendly error message
      let userMessage = "Failed to generate report. Please try again.";
      if (error instanceof Error && error.message.includes("500")) {
        userMessage =
          "Server error occurred. Please check your information and try again.";
      } else if (error instanceof Error && error.message.includes("401")) {
        userMessage = "Authentication error. Please log in again.";
      } else if (error instanceof Error && error.message.includes("403")) {
        userMessage = "Access denied. Please check your permissions.";
      }

      alert(userMessage);
    } finally {
      setLoading(false);
    }
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
        firstMissingField.includes("Age") ||
        firstMissingField.includes("Gender") ||
        firstMissingField.includes("Occupation") ||
        firstMissingField.includes("Pet")
      ) {
        setCurrentStep(0); // Demographics
      } else if (
        firstMissingField.includes("income") ||
        firstMissingField.includes("budget") ||
        firstMissingField.includes("credit") ||
        firstMissingField.includes("payment")
      ) {
        setCurrentStep(1); // Financial
      } else if (
        firstMissingField.includes("housing") ||
        firstMissingField.includes("bedroom") ||
        firstMissingField.includes("bathroom") ||
        firstMissingField.includes("lot") ||
        firstMissingField.includes("home") ||
        firstMissingField.includes("renovation") ||
        firstMissingField.includes("property")
      ) {
        setCurrentStep(2); // Housing
      } else if (
        firstMissingField.includes("location") ||
        firstMissingField.includes("walkability")
      ) {
        setCurrentStep(3); // Location
      } else if (
        firstMissingField.includes("communication") ||
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <RequiredLabel>Age</RequiredLabel>
                <Input
                  variant="mobile"
                  type="number"
                  value={formData.age?.toString() || ""}
                  onChange={(e) =>
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
                  value={formData.gender || ""}
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
                  value={formData.occupation || ""}
                  onChange={(e) => updateFormData("occupation", e.target.value)}
                  placeholder="Your job title"
                />
              </div>

              <div>
                <OptionalLabel>Pet Ownership Status</OptionalLabel>
                <Dropdown
                  value={formData.pets || ""}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="w-4/5 mx-auto">
                <label className="block text-xs sm:text-sm md:text-base font-normal text-gray-700 mb-1 text-center w-full">
                  {FIELD_LABELS.GROSS_INCOME} (after debts)
                </label>
                <PriceRangeSlider
                  tickValues={[
                    50000, 100000, 200000, 300000, 500000, 750000, 1000000,
                  ]}
                  value={formData.gross_income || 100000}
                  onChange={(value) => {
                    // Round to nearest $5,000 increment
                    const roundedValue = Math.round(value / 5000) * 5000;
                    updateFormData("gross_income", roundedValue);
                  }}
                  formatPrefix="$"
                  className="mt-2"
                />
              </div>

              <div className="w-4/5 mx-auto">
                <label className="block text-xs sm:text-sm md:text-base font-normal text-gray-700 mb-1 text-center w-full">
                  {FIELD_LABELS.DOWN_PAYMENT}
                </label>
                <PriceRangeSlider
                  tickValues={[
                    100000, 250000, 500000, 1000000, 2000000, 5000000,
                  ]}
                  value={formData.down_payment || 100000}
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
                <OptionalLabel>
                  <span className="text-center block">
                    {FIELD_LABELS.IDEAL_ZIP_CODE}
                  </span>
                </OptionalLabel>
                <Input
                  variant="mobile"
                  type="text"
                  value={formData.ideal_zip_code || ""}
                  onChange={(e) =>
                    updateFormData("ideal_zip_code", e.target.value)
                  }
                  placeholder="Enter zip code"
                />
              </div>

              <div>
                <OptionalLabel>
                  <span className="text-center block">
                    {FIELD_LABELS.CREDIT_SCORE_RANGE}
                  </span>
                </OptionalLabel>
                <Dropdown
                  value={formData.credit_score_range || ""}
                  onChange={(value) =>
                    updateFormData("credit_score_range", value)
                  }
                  options={CREDIT_SCORE_OPTIONS}
                  placeholder="Select credit score range"
                />
              </div>

              <div className="col-span-1 md:col-span-2 flex flex-col items-center">
                <label className="block text-responsive-xl font-bold text-gray-700 space-y-responsive-xs text-center w-full">
                  {FIELD_LABELS.HOME_BUDGET}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <PriceRangeSlider
                  tickValues={[
                    200000, 500000, 1000000, 2000000, 5000000, 10000000,
                  ]}
                  value={formData.home_budget || 500000}
                  onChange={(value) => {
                    // Round to nearest $25,000 increment
                    const roundedValue = Math.round(value / 25000) * 25000;
                    updateFormData("home_budget", roundedValue);
                  }}
                  formatPrefix="$"
                  className="mt-2"
                />
              </div>

              {/* Home Price Calculation Results */}
              <div
                className={`col-span-1 md:col-span-2 mt-6 p-4 bg-white rounded-lg border border-olive ${
                  isAffordabilityCollapsed ? "pb-6" : ""
                }`}
              >
                <div
                  className={`flex items-center justify-between cursor-pointer p-2 -m-2 rounded-lg hover:bg-olive/5 transition-colors duration-150 ${
                    isAffordabilityCollapsed ? "mb-2" : "mb-2"
                  }`}
                  onClick={() =>
                    setIsAffordabilityCollapsed(!isAffordabilityCollapsed)
                  }
                >
                  <h3 className="text-lg font-medium text-olive">
                    Estimated Home Affordability
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-olive transition-transform duration-300 ease-in-out ${
                      isAffordabilityCollapsed ? "rotate-180" : ""
                    }`}
                  />
                </div>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isAffordabilityCollapsed
                      ? "max-h-0 opacity-0"
                      : "max-h-[2000px] opacity-100"
                  }`}
                >
                  <div className="pt-2">
                    {homePriceLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-olive"></div>
                        <span className="ml-2 text-xs sm:text-sm text-black">
                          Calculating affordability...
                        </span>
                      </div>
                    ) : homePriceError ? (
                      <div className="text-black text-xs sm:text-sm py-2">
                        <p className="font-medium">
                          Unable to calculate affordability:
                        </p>
                        <p>{homePriceError}</p>
                        <p className="mt-2">
                          Please ensure you've entered your income, zip code,
                          and other financial details.
                        </p>
                      </div>
                    ) : homePriceResult ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-center p-4 sm:p-6">
                              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-olive mb-2">
                                ${homePriceResult.maxHomePrice.toLocaleString()}
                              </div>
                              <div className="text-xs sm:text-sm md:text-base text-gray-600 mb-4">
                                Maximum recommended home price
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-black">
                              Monthly Payment
                            </p>
                            <p className="text-lg sm:text-xl font-bold text-olive">
                              $
                              {homePriceResult.totalMonthlyHousingCost.toLocaleString()}
                              /mo
                            </p>
                          </div>
                        </div>

                        <div className="text-xs sm:text-sm text-black bg-white p-3 rounded border border-olive/30">
                          <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4">
                            Based on your income and financial profile, here's
                            what you might afford:
                          </p>
                          <div className="bg-[#EAD9B3] bg-opacity-20 p-2 sm:p-3 rounded font-mono text-xs sm:text-sm text-black space-y-1">
                            <p>
                              1. <strong>Monthly Income</strong> = Gross Annual
                              Income ÷ 12
                            </p>
                            <p className="ml-4">
                              = $
                              {homePriceResult.netAnnualIncome.toLocaleString()}{" "}
                              ÷ 12 ={" "}
                              <strong>
                                $
                                {(
                                  homePriceResult.netAnnualIncome / 12
                                ).toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                              </strong>
                            </p>

                            <p>
                              2. <strong>Max Monthly Housing Cost</strong> =
                              Monthly Income × DTI Ratio
                            </p>
                            <p className="ml-4">
                              = $
                              {(
                                homePriceResult.netAnnualIncome / 12
                              ).toLocaleString()}{" "}
                              × {(homePriceResult.dtiUsed / 100).toFixed(2)} ={" "}
                              <strong>
                                $
                                {Math.round(
                                  (homePriceResult.netAnnualIncome / 12) *
                                    (homePriceResult.dtiUsed / 100)
                                ).toLocaleString()}
                              </strong>
                            </p>

                            <p>
                              3. <strong>Mortgage Payment</strong> = P × r × (1
                              + r)
                              <sup>n</sup> ÷ ((1 + r)<sup>n</sup> - 1)
                            </p>
                            <p className="ml-4">Where:</p>
                            <p className="ml-8">
                              P = $
                              {Math.round(
                                homePriceResult.loanAmount
                              ).toLocaleString()}
                            </p>
                            <p className="ml-8">
                              r ={" "}
                              {(
                                homePriceResult.interestRate /
                                100 /
                                12
                              ).toFixed(4)}{" "}
                              (monthly interest)
                            </p>
                            <p className="ml-8">
                              n = {30 * 12} months (30-year loan)
                            </p>
                            <p className="ml-4">
                              →{" "}
                              <strong>
                                Monthly Mortgage = $
                                {homePriceResult.monthlyMortgage.toLocaleString()}
                              </strong>
                            </p>

                            <p>
                              4. <strong>Property Tax</strong> = Home Price ×
                              Tax Rate ÷ 12
                            </p>
                            <p className="ml-4">
                              = ${homePriceResult.maxHomePrice.toLocaleString()}{" "}
                              ×{" "}
                              {(homePriceResult.propertyTaxRate * 100).toFixed(
                                2
                              )}
                              % ÷ 12
                            </p>

                            <p>
                              5. <strong>Home Insurance</strong> = Home Price ×
                              0.50% ÷ 12
                            </p>
                            <p className="ml-4">
                              = ${homePriceResult.maxHomePrice.toLocaleString()}{" "}
                              × 0.005 ÷ 12
                            </p>

                            {homePriceResult.monthlyPMI > 0 && (
                              <>
                                <p>
                                  6.{" "}
                                  <strong>
                                    PMI (Private Mortgage Insurance)
                                  </strong>{" "}
                                  = Loan × PMI Rate ÷ 12
                                </p>
                                <p className="ml-4">
                                  PMI Rate ≈{" "}
                                  {(
                                    ((homePriceResult.monthlyPMI * 12) /
                                      homePriceResult.loanAmount) *
                                    100
                                  ).toFixed(2)}
                                  %
                                </p>
                                <p className="ml-4">
                                  →{" "}
                                  <strong>
                                    Monthly PMI = $
                                    {homePriceResult.monthlyPMI.toLocaleString()}
                                  </strong>
                                </p>
                              </>
                            )}
                          </div>

                          <p className="mt-4 font-medium">
                            Why This Formula Matters:
                          </p>
                          <p>
                            This estimate uses a{" "}
                            <strong>Debt-to-Income (DTI)</strong> ratio of{" "}
                            <strong>
                              {homePriceResult.dtiUsed.toFixed(1)}%
                            </strong>
                            , which reflects current lending guidelines. It
                            ensures your total monthly housing cost—including
                            mortgage, taxes, insurance, and PMI—stays within
                            what lenders generally approve based on your income
                            and debt load.
                          </p>
                          <p>
                            We include estimated <strong>property taxes</strong>{" "}
                            (based on ZIP code{" "}
                            <strong>{formData.ideal_zip_code}</strong>),{" "}
                            <strong>insurance</strong> costs, and{" "}
                            <strong>PMI</strong> if your down payment is under
                            20%. These are factored into your maximum affordable
                            home price using smart search logic.
                          </p>
                        </div>

                        {homePriceResult.warnings?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs sm:text-sm font-medium text-olive mt-2">
                              Important Notes:
                            </p>
                            <ul className="text-xs sm:text-sm text-black list-disc list-inside mt-1 space-y-1">
                              {homePriceResult.warnings.map(
                                (warning: string, index: number) => (
                                  <li key={index}>{warning}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs sm:text-sm text-black py-2">
                        <p>
                          Enter your income, zip code, and other financial
                          details to see your estimated home affordability.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <RequiredLabel>
                  {FIELD_LABELS.PREFERRED_HOUSING_TYPE}
                </RequiredLabel>
                <Dropdown
                  value={formData.preferred_housing_type || ""}
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
                  value={formData.preferred_bedrooms?.toString() || ""}
                  onChange={(e) =>
                    updateFormData(
                      "preferred_bedrooms",
                      parseInt(e.target.value) || undefined
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
                  value={formData.preferred_bathrooms?.toString() || ""}
                  onChange={(e) =>
                    updateFormData(
                      "preferred_bathrooms",
                      parseFloat(e.target.value) || undefined
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
                  value={formData.preferred_lot_size || ""}
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
                  value={formData.preferred_home_age || ""}
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
                  value={formData.preferred_architectural_style || ""}
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
                  value={formData.renovation_preference || ""}
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
                  value={formData.intended_property_use || ""}
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
                  value={(formData.preferred_home_features as string[]) || []}
                  onChange={(value: string[]) =>
                    updateFormData("preferred_home_features", value)
                  }
                  placeholder="e.g., garage, pool, fireplace"
                />
              </div>

              <div>
                <OptionalLabel>Deal Breakers</OptionalLabel>
                <OnPerTagInput
                  value={(formData.deal_breakers as string[]) || []}
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
                <p className="text-xs sm:text-sm md:text-base text-black/60 mb-4">
                  How important is it to walk to nearby amenities? Used to
                  filter neighborhoods in search results.
                </p>
                <Dropdown
                  value={formData.walkability_importance || ""}
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
              <p className="text-xs sm:text-sm md:text-base text-black/60 mb-4">
                Add work, family, or frequently visited places. We'll find homes
                with reasonable commute times to these locations.
              </p>
              <ImportantLocationsInput
                locations={formData.important_locations || []}
                onChange={(
                  locations: {
                    name: string;
                    address: string;
                    commute_tolerance?: number;
                  }[]
                ) => {
                  updateFormData("important_locations", locations);
                }}
                scriptsReady={scriptsReady}
              />
              {loadError && (
                <p className="text-red-500 text-xs mt-2">{loadError}</p>
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
                value={formData.communication_frequency || ""}
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
                value={formData.information_detail_level || ""}
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

      case "reportcustomization":
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

      default:
        return <div>Step content for {step.title} coming soon...</div>;
    }
  };

  return (
    <div className="w-full max-w-[90vw] mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mt-4 sm:mt-6 mb-3 sm:mb-4">
        <div className="flex items-center">
          <img
            src={KeyLogo}
            alt="SilverKey Logo"
            className="h-6 sm:h-8 md:h-10"
          />
        </div>
        <div className="flex items-center">
          <span className="text-xs sm:text-sm md:text-base text-black/60 whitespace-nowrap">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <OnboardingHeader
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={goToStep}
      />

      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-sm mx-auto max-w-[85vw] overflow-hidden">
        <Card className="pb-8 sm:pb-12">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="relative mt-8 sm:mt-10 pt-6 sm:pt-8 pb-1 sm:pb-2 border-t border-beige/30 px-4 sm:px-6">
            <div className="flex items-center justify-between w-full">
              {/* Previous Button - anchored at 25% width */}
              <div className="absolute left-1/4 transform -translate-x-1/2">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-3 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm w-[100px] sm:w-[110px] ${
                    currentStep === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <ChevronLeft
                    className={`w-4 h-4 sm:w-5 sm:h-5 mr-1 ${
                      currentStep === 0 ? "text-gray-500" : "text-gray-800"
                    }`}
                  />
                  <span>Previous</span>
                </button>
              </div>

              {/* Next/Complete Button - anchored at 75% width */}
              <div className="absolute left-3/4 transform -translate-x-1/2">
                {currentStep === STEPS.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-3 bg-olive text-white rounded-lg hover:bg-olive/80 disabled:opacity-50 font-bold transition-all duration-200 text-xs sm:text-sm w-[100px] sm:w-[110px]"
                  >
                    <span>{loading ? "Saving..." : "Complete"}</span>
                    {!loading && (
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-3 bg-olive/60 text-white rounded-lg hover:bg-olive/70 font-bold transition-all duration-200 text-xs sm:text-sm w-[100px] sm:w-[110px]"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  </button>
                )}
              </div>
            </div>
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
