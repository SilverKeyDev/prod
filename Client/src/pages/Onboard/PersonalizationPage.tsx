import { useState, useEffect, useRef } from "react";
import { useGoogleMaps } from "../../context";
import {
  Edit,
  Save,
  X,
  User,
  Building,
  Home,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { apiRequest } from "../../lib/api";
import { usePreferences } from "../../context";
import Card from "../../components/ui/base/Card";
import PriceRangeSlider from "../../components/ui/onboardpersonalize/PriceRangeSlider";
import ImportantLocationsInput from "../../components/ui/onboardpersonalize/ImportantLocationsInput";
import HomePriceEstimate from "../../components/ui/onboardpersonalize/HomePriceEstimate";
import { calculateAffordableHomePrice } from "../../lib/onboard/homePriceCalculation";
import PageHeader from "../../components/ui/base/PageHeader";
import Loading from "../../components/ui/base/Loading";
import OliveCheckbox from "../../components/ui/base/OliveCheckbox";
import OnPerDragDropPriorities from "../../components/ui/onboardpersonalize/OnPerDragDropPriorities";
import OnPerTagInput from "../../components/ui/onboardpersonalize/OnPerTagInput";
import Dropdown from "../../components/ui/base/Dropdown";
import Input from "../../components/ui/base/Input";
import { Title, Subtitle } from "../../components/ui/base";
import {
  OnboardingData,
  SECTION_TITLES,
  FIELD_LABELS,
  CREDIT_SCORE_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  COMMUNICATION_FREQUENCY_OPTIONS,
} from "../../lib/onboard";

// Extend window interface for Google Maps
declare global {
  interface Window {
    google?: any;
  }
}

const STEPS = [
  {
    id: "reportcustomization",
    title: SECTION_TITLES.REPORT_CUSTOMIZATION,
    icon: Building,
  },
  { id: "demographics", title: SECTION_TITLES.DEMOGRAPHICS, icon: User },
  { id: "financial", title: SECTION_TITLES.FINANCIAL_PROFILE, icon: Building },
  { id: "housing", title: SECTION_TITLES.HOUSING_PREFERENCES, icon: Home },
  { id: "location", title: SECTION_TITLES.LOCATION_PREFERENCES, icon: MapPin },
  {
    id: "communication",
    title: SECTION_TITLES.COMMUNICATION_PREFERENCES,
    icon: MessageSquare,
  },
];

export default function PersonalizationPage() {
  const { userPreferences, refreshUserPreferences } = usePreferences();
  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("demographics");
  // Modal state variables removed - modals not currently implemented
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [homePriceResult, setHomePriceResult] = useState<any>(null);
  const [homePriceLoading, setHomePriceLoading] = useState(false);
  const [homePriceError, setHomePriceError] = useState<string | null>(null);
  const [showStickyButtons, setShowStickyButtons] = useState(false);
  const saveButtonRef = useRef<HTMLDivElement>(null);

  // Generate explanation text for the home price calculation
  const generateExplanation = (result: any, data: OnboardingData) => {
    // Calculate down payment percent for display
    const downPaymentPercent =
      result.maxHomePrice > 0
        ? ((result.downPayment / result.maxHomePrice) * 100).toFixed(1)
        : "-";

    return `Based on your gross annual income of $${data.gross_income?.toLocaleString()}, credit score range, and a down payment of $${data.down_payment?.toLocaleString()} (${downPaymentPercent}% of home price), we estimate you can afford a home up to $${result.maxHomePrice.toLocaleString()}.

This estimate is calculated using a debt-to-income (DTI) approach: your maximum allowable monthly housing cost is determined as a percentage of your gross monthly income, in line with common DTI limits. We then backsolve for the highest home price you can afford, factoring in principal, interest, property taxes, homeowner's insurance, and any required PMI.

Key assumptions used:
- **Interest Rate:** ${
      typeof result.interestRate === "number"
        ? (result.interestRate * 100).toFixed(2)
        : "-"
    }%
- **Property Tax Rate:** ${
      typeof result.propertyTaxRate === "number"
        ? result.propertyTaxRate.toFixed(2)
        : "-"
    }%
- **DTI Used:** ${
      typeof result.dtiUsed === "number"
        ? (result.dtiUsed * 100).toFixed(0)
        : "-"
    }%

Your estimated monthly payment of $${result.totalMonthlyHousingCost.toLocaleString()} includes principal, interest, property taxes, homeowner's insurance, and PMI (if applicable). This approach gives you a realistic maximum home price based on your income and debts—not just a budget cap.`;
  };

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
        setHomePriceResult({
          ...result,
          explanation: generateExplanation(result, formData),
        });
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

  // Default report sections with their labels
  const defaultReportSections = [
    { key: "neighborhood_overview", label: "Neighborhood Overview" },
    { key: "safety", label: "Safety & Crime" },
    { key: "culture_and_events", label: "Culture & Events" },
    { key: "social_character", label: "Social Character" },
    { key: "local_amenities", label: "Local Amenities" },
    { key: "commute", label: "Commute & Transportation" },
    { key: "family_friendly", label: "Family-Friendly Features" },
    { key: "nightlife_and_dating", label: "Nightlife & Dating" },
    { key: "development", label: "Development & Growth" },
    { key: "environment_utilities", label: "Environment & Utilities" },
    { key: "financial_information", label: "Cost of Living & Finances" },
    { key: "schools", label: "Schools & Education" },
    { key: "extra_tips", label: "Extra Tips & Insights" },
  ];

  // Get ordered report sections based on user preferences
  const getOrderedReportSections = () => {
    try {
      if (!formData || !defaultReportSections) {
        return [];
      }

      const priorities = formData.report_section_priorities || [];
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
    } catch (error) {
      console.error("Error in getOrderedReportSections:", error);
      return [];
    }
  };

  // Trigger home price calculation when relevant form data changes
  useEffect(() => {
    // Only calculate if we're on the financial section
    if (activeSection !== "financial") return;

    // Only calculate if we have the minimum required data
    if (formData.gross_income && formData.ideal_zip_code) {
      calculateHomePrice();
    }
  }, [
    formData.gross_income,
    formData.credit_score_range,
    formData.ideal_zip_code,
    formData.down_payment,
    activeSection,
  ]);

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

  // Refresh data when page loads to ensure latest updates
  useEffect(() => {
    refreshUserPreferences();
  }, [refreshUserPreferences]);

  // Load user preferences from centralized context
  useEffect(() => {
    if (userPreferences) {
      loadUserPreferencesFromContext();
    } else {
      setFormData({});
      setOriginalData({});
      setIsLoading(false);
    }
  }, [userPreferences]);

  // Track scroll position to update active section and sticky buttons
  useEffect(() => {
    const handleScroll = () => {
      const sections = STEPS.map((step) => step.id);
      const scrollPosition = window.scrollY + 200; // Offset for header

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }

      // Check if original save button is visible on mobile
      if (saveButtonRef.current && window.innerWidth < 640) {
        const rect = saveButtonRef.current.getBoundingClientRect();
        const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
        setShowStickyButtons(!isVisible && isEditMode);
      } else {
        setShowStickyButtons(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isEditMode]);

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

  const loadUserPreferencesFromContext = () => {
    try {
      setIsLoading(true);

      if (userPreferences) {
        setFormData(userPreferences as OnboardingData);
        setOriginalData(userPreferences as OnboardingData);
      }
    } catch (error) {
      console.error("Failed to load user preferences from context:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validation function to check if all required fields are filled
  const validateFormData = (): {
    isValid: boolean;
    missingFields: string[];
    errors: string[];
  } => {
    const missingFields: string[] = [];
    const errors: string[] = [];

    // Demographics - Required fields
    if (!formData.age || formData.age <= 0) {
      missingFields.push("Age");
    }
    if (!formData.gender || formData.gender.trim() === "") {
      missingFields.push("Gender");
    }
    if (!formData.occupation || formData.occupation.trim() === "") {
      missingFields.push("Occupation");
    }
    if (!formData.pets || formData.pets.trim() === "") {
      missingFields.push("Pet ownership status");
    }

    // Financial - Required fields
    if (!formData.gross_income || formData.gross_income <= 0) {
      missingFields.push("Gross income");
    }
    if (!formData.home_budget || formData.home_budget <= 0) {
      missingFields.push("Home budget");
    }
    if (
      !formData.credit_score_range ||
      formData.credit_score_range.trim() === ""
    ) {
      missingFields.push("Credit score range");
    }
    if (!formData.down_payment || formData.down_payment < 0) {
      missingFields.push("Down payment");
    }

    // Housing - Required fields
    if (
      !formData.preferred_housing_type ||
      formData.preferred_housing_type.trim() === ""
    ) {
      missingFields.push("Preferred housing type");
    }
    if (!formData.preferred_bedrooms || formData.preferred_bedrooms <= 0) {
      missingFields.push("Preferred bedrooms");
    }
    if (!formData.preferred_bathrooms || formData.preferred_bathrooms <= 0) {
      missingFields.push("Preferred bathrooms");
    }
    if (
      !formData.preferred_lot_size ||
      formData.preferred_lot_size.trim() === ""
    ) {
      missingFields.push("Preferred lot size");
    }
    if (
      !formData.preferred_home_age ||
      formData.preferred_home_age.trim() === ""
    ) {
      missingFields.push("Preferred home age");
    }
    if (
      !formData.renovation_preference ||
      formData.renovation_preference.trim() === ""
    ) {
      missingFields.push("Renovation preference");
    }
    if (
      !formData.intended_property_use ||
      formData.intended_property_use.trim() === ""
    ) {
      missingFields.push("Intended property use");
    }

    // Location - Required fields
    if (
      !formData.important_locations ||
      formData.important_locations.length === 0
    ) {
      missingFields.push("At least one important location");
    } else {
      // Validate each important location has required fields
      formData.important_locations.forEach((location, index) => {
        if (!location.name || location.name.trim() === "") {
          missingFields.push(`Important location ${index + 1} name`);
        }
        if (!location.address || location.address.trim() === "") {
          missingFields.push(`Important location ${index + 1} address`);
        }
        if (!location.commute_tolerance || location.commute_tolerance <= 0) {
          missingFields.push(
            `Important location ${index + 1} commute tolerance`
          );
        }
      });
    }

    if (
      !formData.walkability_importance ||
      formData.walkability_importance.trim() === ""
    ) {
      missingFields.push("Walkability importance");
    }

    // Communication - Required fields
    if (
      !formData.communication_frequency ||
      formData.communication_frequency.trim() === ""
    ) {
      missingFields.push("Communication frequency");
    }
    if (
      !formData.information_detail_level ||
      formData.information_detail_level.trim() === ""
    ) {
      missingFields.push("Information detail level");
    }
    if (!formData.has_buyers_agent || formData.has_buyers_agent.trim() === "") {
      missingFields.push("Buyers agent status");
    }

    // Report Customization - At least one section must be selected
    if (
      !formData.report_section_priorities ||
      formData.report_section_priorities.length === 0
    ) {
      missingFields.push("At least one report section");
    }

    // Additional validation rules
    if (
      formData.down_payment &&
      formData.home_budget &&
      formData.down_payment > formData.home_budget
    ) {
      errors.push("Down payment cannot be higher than home budget.");
    }

    return {
      isValid: missingFields.length === 0 && errors.length === 0,
      missingFields,
      errors,
    };
  };

  const handleSaveChanges = async () => {
    // Validate form data before saving
    const validation = validateFormData();

    if (!validation.isValid) {
      // Show the custom validation warning component
      // Validation warning would be shown here
      console.warn(
        "Validation failed:",
        validation.missingFields,
        validation.errors
      );
      return;
    }

    try {
      setIsSaving(true);

      // Increment version for this update
      const currentVersion = formData.preferences_version || "1.0";
      const versionParts = currentVersion.split(".");
      const majorVersion = parseInt(versionParts[0]) || 1;
      const minorVersion = parseInt(versionParts[1]) || 0;
      const newVersion = `${majorVersion}.${minorVersion + 1}`;

      const dataToSave = {
        ...formData,
        preferences_version: newVersion,
      };

      await apiRequest("/api/v1/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      // Update local state with new version
      const updatedFormData = { ...formData, preferences_version: newVersion };
      setFormData(updatedFormData);
      setOriginalData(updatedFormData);
      setIsEditMode(false);
      // Success dialog would be shown here
      console.log("Preferences saved successfully");
    } catch (error) {
      console.error("Failed to update preferences:", error);
      alert("Failed to update preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditMode(false);
  };

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
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <Loading message="Loading your preferences..." />
      </div>
    );
  }

  const renderSectionContent = (sectionId: string) => {
    // Render content for each section based on sectionId
    switch (sectionId) {
      case "demographics":
        return (
          <Card className="space-y-6">
            <Title size="md" className="mb-6">
              Tell us about yourself
            </Title>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Age
                </label>
                {isEditMode ? (
                  <Input
                    type="number"
                    value={formData.age?.toString() || ""}
                    onChange={(e) =>
                      updateFormData(
                        "age",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    placeholder="Enter your age"
                  />
                ) : (
                  <div className="mobile-input bg-gray-50">
                    {formData.age || "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Gender
                </label>
                {isEditMode ? (
                  <Dropdown
                    value={formData.gender || ""}
                    onChange={(value) => updateFormData("gender", value)}
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "non-binary", label: "Non-binary" },
                      {
                        value: "prefer_not_to_say",
                        label: "Prefer not to say",
                      },
                    ]}
                    placeholder="Select..."
                  />
                ) : (
                  <div className="mobile-input bg-gray-50">
                    {formData.gender
                      ? [
                          { value: "male", label: "Male" },
                          { value: "female", label: "Female" },
                          { value: "non-binary", label: "Non-binary" },
                          {
                            value: "prefer_not_to_say",
                            label: "Prefer not to say",
                          },
                        ].find((opt) => opt.value === formData.gender)?.label
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Do you have pets?
                </label>
                {isEditMode ? (
                  <Dropdown
                    value={formData.pets || ""}
                    onChange={(value) => updateFormData("pets", value)}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      {
                        value: "prefer_not_to_say",
                        label: "Prefer not to say",
                      },
                    ]}
                    placeholder="Select..."
                  />
                ) : (
                  <div className="mobile-input bg-gray-50">
                    {formData.pets
                      ? [
                          { value: "yes", label: "Yes" },
                          { value: "no", label: "No" },
                          {
                            value: "prefer_not_to_say",
                            label: "Prefer not to say",
                          },
                        ].find((opt) => opt.value === formData.pets)?.label
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Occupation
                </label>
                {isEditMode ? (
                  <Input
                    type="text"
                    value={formData.occupation || ""}
                    onChange={(e) =>
                      updateFormData("occupation", e.target.value)
                    }
                    placeholder="Your job title"
                  />
                ) : (
                  <div className="mobile-input bg-gray-50">
                    {formData.occupation || "Not specified"}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );

      case "financial":
        return (
          <Card className="space-y-6">
            <Title size="md" className="mb-6">
              Financial Information
            </Title>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Gross Annual Income (after debts)
                </label>
                {isEditMode ? (
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
                ) : (
                  <div className="mobile-input bg-gray-50 text-center">
                    {formData.gross_income
                      ? `$${formData.gross_income.toLocaleString()}`
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Down Payment
                </label>
                {isEditMode ? (
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
                ) : (
                  <div className="mobile-input bg-gray-50 text-center">
                    {formData.down_payment
                      ? `$${formData.down_payment.toLocaleString()}`
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2 text-center">
                  Ideal Zip Code
                </label>
                {isEditMode ? (
                  <Input
                    type="text"
                    value={formData.ideal_zip_code || ""}
                    onChange={(e) =>
                      updateFormData("ideal_zip_code", e.target.value)
                    }
                    placeholder="Enter zip code"
                  />
                ) : (
                  <div className="mobile-input bg-gray-50 text-center">
                    {formData.ideal_zip_code || "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2 text-center">
                  {FIELD_LABELS.CREDIT_SCORE_RANGE}
                </label>
                {isEditMode ? (
                  <Dropdown
                    value={formData.credit_score_range || ""}
                    onChange={(value) =>
                      updateFormData("credit_score_range", value)
                    }
                    options={[
                      { value: "poor", label: "Poor (300-579)" },
                      { value: "fair", label: "Fair (580-669)" },
                      { value: "good", label: "Good (670-739)" },
                      { value: "very_good", label: "Very Good (740-799)" },
                      { value: "excellent", label: "Excellent (800-850)" },
                    ]}
                    placeholder="Select..."
                  />
                ) : (
                  <div className="mobile-input bg-gray-50 text-center">
                    {formData.credit_score_range
                      ? CREDIT_SCORE_OPTIONS.find(
                          (option) =>
                            option.value === formData.credit_score_range
                        )?.label || "Not specified"
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div className="col-span-1 md:col-span-2 flex flex-col items-center">
                <Title size="md" className="mb-2 text-center w-full font-bold">
                  Home Budget
                </Title>
                {isEditMode ? (
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
                ) : (
                  <div className="mobile-input bg-gray-50 text-center mt-2">
                    <Title size="md" className="font-bold">
                      ${(formData.home_budget || 0).toLocaleString()}
                    </Title>
                  </div>
                )}
              </div>

              {/* Home Price Calculation Results */}
              <div className="col-span-1 md:col-span-2 mt-6">
                <HomePriceEstimate
                  homePriceLoading={homePriceLoading}
                  homePriceError={homePriceError}
                  homePriceResult={homePriceResult}
                />
              </div>
            </div>
          </Card>
        );

      case "housing":
        return (
          <Card className="space-y-6">
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
                <label className="block text-sm font-medium text-black mb-2">
                  {FIELD_LABELS.PREFERRED_HOUSING_TYPE}
                </label>
                {isEditMode ? (
                  <Dropdown
                    value={formData.preferred_housing_type || ""}
                    onChange={(value) =>
                      updateFormData("preferred_housing_type", value)
                    }
                    options={HOUSING_TYPE_OPTIONS}
                    placeholder="Select..."
                  />
                ) : (
                  <div className="mobile-input bg-gray-50">
                    {formData.preferred_housing_type
                      ? HOUSING_TYPE_OPTIONS.find(
                          (option) =>
                            option.value === formData.preferred_housing_type
                        )?.label || "Not specified"
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Bedrooms
                </label>
                {isEditMode ? (
                  <Input
                    type="number"
                    value={formData.preferred_bedrooms?.toString() || ""}
                    onChange={(e) =>
                      updateFormData(
                        "preferred_bedrooms",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    placeholder="Number of bedrooms"
                  />
                ) : (
                  <div className="mobile-input bg-gray-50">
                    {formData.preferred_bedrooms || "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Bathrooms
                </label>
                {isEditMode ? (
                  <Input
                    type="number"
                    value={formData.preferred_bathrooms?.toString() || ""}
                    onChange={(e) =>
                      updateFormData(
                        "preferred_bathrooms",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    placeholder="Number of bathrooms"
                  />
                ) : (
                  <div className="mobile-input bg-gray-50">
                    {formData.preferred_bathrooms || "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Lot Size
                </label>
                {isEditMode ? (
                  <Dropdown
                    value={formData.preferred_lot_size || ""}
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
                          { value: "small", label: "Small (under 0.25 acres)" },
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
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Home Age
                </label>
                {isEditMode ? (
                  <Dropdown
                    value={formData.preferred_home_age || ""}
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
                          { value: "historic", label: "Historic (50+ years)" },
                        ].find(
                          (opt) => opt.value === formData.preferred_home_age
                        )?.label
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Architectural Style
                </label>
                {isEditMode ? (
                  <Dropdown
                    value={formData.preferred_architectural_style || ""}
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
                            opt.value === formData.preferred_architectural_style
                        )?.label
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Renovation Willingness
                </label>
                {isEditMode ? (
                  <Dropdown
                    value={formData.renovation_preference || ""}
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
                          (opt) => opt.value === formData.renovation_preference
                        )?.label
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Intended Property Use
                </label>
                {isEditMode ? (
                  <Dropdown
                    value={formData.intended_property_use || ""}
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
                          { value: "investment", label: "Investment Property" },
                          { value: "vacation", label: "Vacation Home" },
                          { value: "rental", label: "Rental Property" },
                        ].find(
                          (opt) => opt.value === formData.intended_property_use
                        )?.label
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="mb-[5px]">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Preferred Home Features
                    </label>
                    <OnPerTagInput
                      value={
                        (formData.preferred_home_features as string[]) || []
                      }
                      onChange={(value: string[]) =>
                        updateFormData("preferred_home_features", value)
                      }
                      placeholder="e.g., garage, pool, fireplace"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Deal Breakers
                    </label>
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
            </div>
          </Card>
        );

      case "location":
        return (
          <Card className="space-y-6">
            <Title size="md" className="mb-6">
              Location Preferences
            </Title>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Walkability Importance
                </label>
                {isEditMode ? (
                  <Dropdown
                    value={formData.walkability_importance || ""}
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
                          { value: "very_important", label: "Very Important" },
                          {
                            value: "somewhat_important",
                            label: "Somewhat Important",
                          },
                          { value: "not_important", label: "Not Important" },
                        ].find(
                          (opt) => opt.value === formData.walkability_importance
                        )?.label
                      : "Not specified"}
                  </div>
                )}
              </div>
            </div>

            {/* Important Locations for Commute */}
            <div className="flex flex-col md:flex-row gap-6 w-full">
              <div className="flex-1">
                <label className="block text-sm font-medium text-black mb-2">
                  Important Locations
                </label>
                <p className="text-xs text-black/60 mb-4">
                  Add locations important to you (workplace, gym, family, etc.).
                  We use these to create travel time maps and find properties
                  within your commute tolerance. Each location helps our AI
                  match you with homes that fit your lifestyle and daily
                  routines.
                </p>
                <ImportantLocationsInput
                  locations={formData.important_locations || []}
                  onChange={(locations) =>
                    updateFormData("important_locations", locations)
                  }
                  scriptsReady={scriptsReady}
                  isEditMode={isEditMode}
                />
                {loadError && (
                  <p className="text-red-500 text-xs mt-2">{loadError}</p>
                )}
              </div>
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
              <label className="block text-sm font-medium text-black mb-2">
                {FIELD_LABELS.COMMUNICATION_FREQUENCY}
              </label>
              {isEditMode ? (
                <Dropdown
                  value={formData.communication_frequency || ""}
                  onChange={(value) =>
                    updateFormData("communication_frequency", value)
                  }
                  options={COMMUNICATION_FREQUENCY_OPTIONS}
                  placeholder="Select..."
                />
              ) : (
                <div className="mobile-input bg-gray-50">
                  {formData.communication_frequency
                    ? COMMUNICATION_FREQUENCY_OPTIONS.find(
                        (option) =>
                          option.value === formData.communication_frequency
                      )?.label || "Not specified"
                    : "Not specified"}
                </div>
              )}
            </div>

            {/* Information Detail Level */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Information Detail Level
              </label>
              {isEditMode ? (
                <Dropdown
                  value={formData.information_detail_level || ""}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buyer's Agent Dropdown */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Do you currently have a buyer's agent?
                </label>
                {isEditMode ? (
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
                        ].find((opt) => opt.value === formData.has_buyers_agent)
                          ?.label
                      : "Not specified"}
                  </div>
                )}
              </div>

              {/* Show checkbox if user does NOT have a buyer's agent */}
              {formData.has_buyers_agent === "no" && (
                <div className="flex flex-col justify-center items-center h-full w-full md:mt-2">
                  <label
                    htmlFor="looking-buyers-agent"
                    className="flex items-center gap-3 text-sm font-medium text-black cursor-pointer"
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
                        className={`h-5 w-5 rounded border flex items-center justify-center ${
                          formData.looking_for_buyers_agent
                            ? "bg-olive border-olive"
                            : "border-gray-300 bg-gray-50"
                        }`}
                      >
                        {formData.looking_for_buyers_agent && (
                          <svg
                            className="w-4 h-4 text-gray-600"
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
              )}
            </div>
          </Card>
        );

      case "reportcustomization":
        if (isLoading) {
          return (
            <Card className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
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
              <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
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
  };

  return (
    <div className="min-h-screen bg-off-white">
      {/* Mobile Header - Only visible on mobile */}
      <div className="sm:hidden">
        <PageHeader
          title="Personalization"
          subtitle="Customize your preferences"
        />
      </div>

      <div className="mobile-padding">
        {/* Header with action buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="w-[90%] sm:w-auto mx-auto sm:mx-0 text-center sm:text-left">
            <Title size="lg" className="mb-2">
              <span className="hidden sm:inline">Personalization Settings</span>
            </Title>
            <Subtitle size="sm" muted className="hidden sm:block">
              Customize your preferences to get more personalized reports and
              recommendations.
            </Subtitle>
          </div>

          {/* Desktop Action Buttons - Removed as requested */}
        </div>

        {/* Mobile Action Buttons - Only visible on mobile */}
        <div ref={saveButtonRef} className="sm:hidden w-[90%] mx-auto mb-6">
          {!isEditMode ? (
            <button
              onClick={() => setIsEditMode(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-olive text-white rounded-lg hover:bg-olive/80 transition-colors touch-friendly text-sm"
            >
              <Edit size={16} />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors touch-friendly text-sm"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-olive text-white rounded-lg hover:bg-olive/80 transition-colors disabled:opacity-50 touch-friendly text-sm"
              >
                <Save size={14} />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        {/* Sticky Mobile Buttons - Show when scrolled past original buttons */}
        {showStickyButtons && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 p-3 sm:hidden">
            <div className="flex gap-2 max-w-sm mx-auto">
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors touch-friendly text-sm"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-olive text-white rounded-lg hover:bg-olive/80 transition-colors disabled:opacity-50 touch-friendly text-sm"
              >
                <Save size={14} />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Sidebar and Content Layout */}
        <div className="flex gap-8">
          {/* Sidebar Navigation - Hidden on mobile */}
          <div className="w-64 flex-shrink-0 hidden sm:block">
            <div className="sticky top-4">
              <Card className="space-y-responsive-sm">
                <h3 className="text-lg font-semibold text-black mb-4">
                  Sections
                </h3>

                {/* Action Buttons */}
                <div className="mb-6 space-y-2">
                  {!isEditMode ? (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="w-full flex items-center justify-center gap-2 px-8 py-6 bg-olive text-white rounded-lg hover:bg-olive/80 transition-colors touch-friendly text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Preferences
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 px-8 py-6 bg-olive text-white rounded-lg hover:bg-olive/80 transition-colors touch-friendly text-sm disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="w-full flex items-center justify-center gap-2 px-8 py-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors touch-friendly text-sm"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="space-y-1">
                  {STEPS.map((step, index) => (
                    <div key={step.id}>
                      <button
                        onClick={() => scrollToSection(step.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm ${
                          activeSection === step.id
                            ? "bg-gold/20 text-brown border border-gold/30"
                            : "text-black hover:bg-gold/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <step.icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{step.title}</span>
                        </div>
                      </button>
                      {index < STEPS.length - 1 && (
                        <div className="border-b border-gray-200 my-1"></div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full">
            <div className="space-y-8">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  id={step.id}
                  className="w-[90%] sm:w-full mx-auto sm:mx-0"
                >
                  {renderSectionContent(step.id)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
