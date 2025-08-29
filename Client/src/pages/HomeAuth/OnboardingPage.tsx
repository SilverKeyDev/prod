import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleMaps } from "../../context";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Plus,
  X,
  Check,
} from "lucide-react";
import KeyLogo from "/logo.png";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ImportantLocationsInput from "../../components/ui/onboardpersonalize/ImportantLocationsInput";
import Loading from "../../components/ui/base/Loading";
import OliveCheckbox from "../../components/ui/base/OliveCheckbox";
import PriceRangeSlider from "../../components/ui/onboardpersonalize/PriceRangeSlider";
import ValidationWarning from "../../components/feedback/ValidationWarning";
import OnboardPersonalizeInput from "../../components/ui/onboardpersonalize/OnboardPersonalizeInput";
import OnboardPersonalizeDropdown from "../../components/ui/onboardpersonalize/OnboardPersonalizeDropdown";
import { RequiredLabel, OptionalLabel } from "../../components/ui/onboardpersonalize/OnboardPersonalizeLabel";
import OnboardingHeader from "../../components/ui/onboardpersonalize/OnboardingHeader";
import HomePriceEstimate from "../../components/ui/onboardpersonalize/HomePriceEstimate";
import { estimateAffordableHomePrice } from "../../lib/affordabilityCalculator";
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
  BUYERS_AGENT_OPTIONS,
  HOME_AGE_OPTIONS,
  RENOVATION_PREFERENCE_OPTIONS,
  PROPERTY_USE_OPTIONS,
  validateFormData,
  SECTION_TITLES,
  FIELD_LABELS
} from "../../lib/onboard";

// Extend window interface for Google Maps
declare global {
  interface Window {
    google?: any;
  }
}


const STEPS = ONBOARDING_STEPS;

const REPORT_SECTIONS = DEFAULT_REPORT_SECTIONS;


// Sortable Report Section Component
interface SortableReportSectionProps {
  id: string;
  label: string;
  checked: boolean;
  priority?: number;
  onToggle: (checked: boolean) => void;
}

const SortableReportSection: React.FC<SortableReportSectionProps> = ({
  id,
  label,
  checked,
  priority,
  onToggle,
}) => {
  // Safety checks for props
  if (
    !id ||
    !label ||
    typeof checked !== "boolean" ||
    typeof onToggle !== "function"
  ) {
    console.warn("SortableReportSection received invalid props:", {
      id,
      label,
      checked,
      onToggle,
    });
    return null;
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    zIndex: isDragging ? 1000 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-responsive-sm space-responsive-sm border rounded-lg transition-all duration-200 border-beige hover:bg-beige/10 hover:border-brown/30 ${
        !checked ? "opacity-60" : ""
      } ${isDragging ? "shadow-lg bg-white border-brown/50" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 space-responsive-xs rounded hover:bg-gray-100 transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="mobile-icon-sm" />
      </div>

      <div className="flex items-center space-x-responsive-sm flex-1">
        <div className="flex items-center space-x-responsive-xs">
          {priority && (
            <span className="text-responsive-xs font-medium text-gray-500 bg-gray-100 px-responsive-xs py-responsive-xs rounded">
              {priority}
            </span>
          )}

          <label
            htmlFor={id}
            className="flex items-center space-x-responsive-sm cursor-pointer flex-1"
          >
            <div className="relative">
              <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onToggle(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`mobile-icon-sm rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  checked
                    ? "bg-brown border-brown text-white shadow-sm"
                    : "border-beige hover:border-brown/50 bg-white"
                }`}
              >
                {checked && (
                  <svg
                    className="mobile-icon-xs"
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
            </div>
            <span className="text-responsive-sm font-medium text-gray-700 flex-1">
              {label}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

// Custom dropdown component matching PastReports implementation
interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  isOpen,
  onToggle,
  dropdownRef,
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="mobile-input text-xs sm:text-sm md:text-base text-gray-700 flex items-center justify-between cursor-pointer hover:border-brown focus:border-brown focus:ring-brown/20 w-full touch-friendly"
      >
        <span className="text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`mobile-icon-xs transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-beige rounded-lg shadow-lg z-50">
          {options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                onToggle();
              }}
              className={`w-full px-responsive-sm py-responsive-xs text-left text-xs sm:text-sm md:text-base hover:bg-brown/5 transition-colors duration-150 touch-friendly ${
                index === 0 ? "first:rounded-t-lg" : ""
              } ${index === options.length - 1 ? "last:rounded-b-lg" : ""} ${
                value === option.value
                  ? "bg-brown/10 text-brown font-medium"
                  : "text-gray-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    // Initialize report customization with only Neighborhood Overview checked by default
    report_section_priorities: ["neighborhood_overview"],
    important_locations: [],
  });
  const [loading, setLoading] = useState(false);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {}
  );
  const dropdownRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>(
    {}
  );
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    missingFields: string[];
    errors: string[];
  }>({ missingFields: [], errors: [] });
  
  // Home price calculation state
  const [homePriceLoading, setHomePriceLoading] = useState(false);
  const [homePriceError, setHomePriceError] = useState<string | null>(null);
  const [homePriceResult, setHomePriceResult] = useState<any>(null);
  const [showHomePriceDetails, setShowHomePriceDetails] = useState(false);
  const [isAffordabilityCollapsed, setIsAffordabilityCollapsed] = useState(false);
  const navigate = useNavigate();

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
        ? (result.propertyTaxRate * 100).toFixed(2)
        : "-"
    }%
- **PMI Rate:** ${
      typeof result.pmiRate === "number"
        ? (result.pmiRate * 100).toFixed(2)
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

      // Map credit score range to a numeric value
      let creditScore = 700; // Default to good credit
      switch (formData.credit_score_range) {
        case "poor":
          creditScore = 550;
          break;
        case "fair":
          creditScore = 630;
          break;
        case "good":
          creditScore = 700;
          break;
        case "very_good":
          creditScore = 770;
          break;
        case "excellent":
          creditScore = 800;
          break;
      }

      // Calculate down payment percentage based on savings
      const downPaymentAmount = formData.down_payment || 50000;

      const result = await estimateAffordableHomePrice({
        grossAnnualIncome: formData.gross_income || 0,
        creditScore,
        zipCode: formData.ideal_zip_code || "",
        downPayment: downPaymentAmount,
      });

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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Start dragging after 3px movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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



  // Dropdown utility functions
  const toggleDropdown = (fieldName: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const getDropdownRef = (fieldName: string) => {
    if (!dropdownRefs.current[fieldName]) {
      dropdownRefs.current[fieldName] = React.createRef<HTMLDivElement>();
    }
    return dropdownRefs.current[fieldName];
  };

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      let shouldClose = true;

      Object.entries(dropdownRefs.current).forEach(([_fieldName, ref]) => {
        if (ref.current && ref.current.contains(target)) {
          shouldClose = false;
        }
      });

      if (
        shouldClose &&
        Object.keys(openDropdowns).some((key) => openDropdowns[key])
      ) {
        setOpenDropdowns({});
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openDropdowns]);

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
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif text-black mb-4 sm:mb-6">
              Tell us about yourself
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <RequiredLabel>Age</RequiredLabel>
                <OnboardPersonalizeInput
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
                <OnboardPersonalizeDropdown
                  value={formData.gender || ""}
                  onChange={(value) => updateFormData("gender", value)}
                  options={GENDER_OPTIONS}
                  placeholder="Select gender"
                  isOpen={openDropdowns.gender || false}
                  onToggle={() => toggleDropdown("gender")}
                  dropdownRef={getDropdownRef("gender")}
                />
              </div>

              <div>
                <RequiredLabel>Occupation</RequiredLabel>
                <OnboardPersonalizeInput
                  type="text"
                  value={formData.occupation || ""}
                  onChange={(e) => updateFormData("occupation", e.target.value)}
                  placeholder="Your job title"
                />
              </div>

              <div>
                <OptionalLabel>Pet Ownership Status</OptionalLabel>
                <OnboardPersonalizeDropdown
                  value={formData.pets || ""}
                  onChange={(value) => updateFormData("pets", value)}
                  options={PETS_OPTIONS}
                  placeholder="Select pet status"
                  isOpen={openDropdowns.pets || false}
                  onToggle={() => toggleDropdown("pets")}
                  dropdownRef={getDropdownRef("pets")}
                />
              </div>
            </div>
          </div>
        );

      case "financial":
        return (
          <div className="space-y-6">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif text-black mb-4 sm:mb-6">
              {SECTION_TITLES.FINANCIAL_PROFILE}
            </h2>

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
                  <span className="text-center block">{FIELD_LABELS.IDEAL_ZIP_CODE}</span>
                </OptionalLabel>
                <OnboardPersonalizeInput
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
                  <span className="text-center block">{FIELD_LABELS.CREDIT_SCORE_RANGE}</span>
                </OptionalLabel>
                <OnboardPersonalizeDropdown
                  value={formData.credit_score_range || ""}
                  onChange={(value) =>
                    updateFormData("credit_score_range", value)
                  }
                  options={CREDIT_SCORE_OPTIONS}
                  placeholder="Select credit score range"
                  isOpen={openDropdowns.credit_score_range || false}
                  onToggle={() => toggleDropdown("credit_score_range")}
                  dropdownRef={getDropdownRef("credit_score_range")}
                />
              </div>

              <div className="col-span-1 md:col-span-2 flex flex-col items-center">
                <label className="block text-responsive-xl font-bold text-gray-700 space-y-responsive-xs text-center w-full">
                  {FIELD_LABELS.HOME_BUDGET} <span className="text-rose-500">*</span>
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
              <div className={`col-span-1 md:col-span-2 mt-6 p-4 bg-white rounded-lg border border-olive ${
                isAffordabilityCollapsed ? "pb-6" : ""
              }`}>
                <div 
                  className={`flex items-center justify-between cursor-pointer p-2 -m-2 rounded-lg hover:bg-olive/5 transition-colors duration-150 ${
                    isAffordabilityCollapsed ? "mb-2" : "mb-2"
                  }`}
                  onClick={() => setIsAffordabilityCollapsed(!isAffordabilityCollapsed)}
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

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isAffordabilityCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
                }`}>
                  <div className="pt-2">
                    {homePriceLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-olive"></div>
                    <span className="ml-2 text-sm text-black">
                      Calculating affordability...
                    </span>
                  </div>
                ) : homePriceError ? (
                  <div className="text-black text-sm py-2">
                    <p className="font-medium">
                      Unable to calculate affordability:
                    </p>
                    <p>{homePriceError}</p>
                    <p className="mt-2">
                      Please ensure you've entered your income, zip code, and
                      other financial details.
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
                        <p className="text-sm text-black">Monthly Payment</p>
                        <p className="text-xl font-bold text-olive">
                          $
                          {homePriceResult.totalMonthlyHousingCost.toLocaleString()}
                          /mo
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-black bg-white p-3 rounded border border-olive/30">
                      <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4">
                        Based on your income and financial profile, here's what you
                        might afford:
                      </p>
                      <div className="bg-[#EAD9B3] bg-opacity-20 p-3 rounded font-mono text-black space-y-1">
                        <p>
                          1. <strong>Monthly Income</strong> = Gross Annual
                          Income ÷ 12
                        </p>
                        <p className="ml-4">
                          = ${homePriceResult.netAnnualIncome.toLocaleString()}{" "}
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
                          2. <strong>Max Monthly Housing Cost</strong> = Monthly
                          Income × DTI Ratio
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
                          3. <strong>Mortgage Payment</strong> = P × r × (1 + r)
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
                          {(homePriceResult.interestRate / 100 / 12).toFixed(4)}{" "}
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
                          4. <strong>Property Tax</strong> = Home Price × Tax
                          Rate ÷ 12
                        </p>
                        <p className="ml-4">
                          = ${homePriceResult.maxHomePrice.toLocaleString()} ×{" "}
                          {(homePriceResult.propertyTaxRate * 100).toFixed(2)}%
                          ÷ 12
                        </p>

                        <p>
                          5. <strong>Home Insurance</strong> = Home Price ×
                          0.50% ÷ 12
                        </p>
                        <p className="ml-4">
                          = ${homePriceResult.maxHomePrice.toLocaleString()} ×
                          0.005 ÷ 12
                        </p>

                        {homePriceResult.monthlyPMI > 0 && (
                          <>
                            <p>
                              6.{" "}
                              <strong>PMI (Private Mortgage Insurance)</strong>{" "}
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
                        <strong>{homePriceResult.dtiUsed.toFixed(1)}%</strong>,
                        which reflects current lending guidelines. It ensures
                        your total monthly housing cost—including mortgage,
                        taxes, insurance, and PMI—stays within what lenders
                        generally approve based on your income and debt load.
                      </p>
                      <p>
                        We include estimated <strong>property taxes</strong>{" "}
                        (based on ZIP code{" "}
                        <strong>{formData.ideal_zip_code}</strong>),{" "}
                        <strong>insurance</strong> costs, and{" "}
                        <strong>PMI</strong> if your down payment is under 20%.
                        These are factored into your maximum affordable home
                        price using smart search logic.
                      </p>
                    </div>

                    {homePriceResult.warnings?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-olive mt-2">
                          Important Notes:
                        </p>
                        <ul className="text-sm text-black list-disc list-inside mt-1 space-y-1">
                          {homePriceResult.warnings.map((warning: string, index: number) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-black py-2">
                    <p>
                      Enter your income, zip code, and other financial details
                      to see your estimated home affordability.
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
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-2">
              {SECTION_TITLES.HOUSING_PREFERENCES}
            </h2>
            <p className="text-sm text-black/60 mb-6">
              Tell us about your ideal home. These preferences help our AI
              understand what features and characteristics matter most to you
              when matching properties to your lifestyle and needs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <RequiredLabel>{FIELD_LABELS.PREFERRED_HOUSING_TYPE}</RequiredLabel>
                <OnboardPersonalizeDropdown
                  value={formData.preferred_housing_type || ""}
                  onChange={(value) =>
                    updateFormData("preferred_housing_type", value)
                  }
                  options={HOUSING_TYPE_OPTIONS}
                  placeholder="Select..."
                  isOpen={openDropdowns.desired_housing_type || false}
                  onToggle={() => toggleDropdown("desired_housing_type")}
                  dropdownRef={getDropdownRef("desired_housing_type")}
                />
              </div>

              <div>
                <RequiredLabel>{FIELD_LABELS.PREFERRED_BEDROOMS}</RequiredLabel>
                <OnboardPersonalizeInput
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
                <RequiredLabel>{FIELD_LABELS.PREFERRED_BATHROOMS}</RequiredLabel>
                <OnboardPersonalizeInput
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
                <OnboardPersonalizeDropdown
                  value={formData.preferred_lot_size || ""}
                  onChange={(value) =>
                    updateFormData("preferred_lot_size", value)
                  }
                  options={LOT_SIZE_OPTIONS}
                  placeholder="Select..."
                  isOpen={openDropdowns.preferred_lot_size || false}
                  onToggle={() => toggleDropdown("preferred_lot_size")}
                  dropdownRef={getDropdownRef("preferred_lot_size")}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-2">
                  Preferred Home Age
                </label>
                <CustomDropdown
                  value={formData.preferred_home_age || ""}
                  onChange={(value) =>
                    updateFormData("preferred_home_age", value)
                  }
                  options={HOME_AGE_OPTIONS}
                  placeholder="Select..."
                  isOpen={openDropdowns.preferred_home_age || false}
                  onToggle={() => toggleDropdown("preferred_home_age")}
                  dropdownRef={getDropdownRef("preferred_home_age")}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-2">
                  Preferred Architectural Style
                </label>
                <CustomDropdown
                  value={formData.preferred_architectural_style || ""}
                  onChange={(value) =>
                    updateFormData("preferred_architectural_style", value)
                  }
                  options={COMMUNICATION_FREQUENCY_OPTIONS}
                  placeholder="Select..."
                  isOpen={openDropdowns.preferred_architectural_style || false}
                  onToggle={() =>
                    toggleDropdown("preferred_architectural_style")
                  }
                  dropdownRef={getDropdownRef("preferred_architectural_style")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Renovation Willingness
                </label>
                <CustomDropdown
                  value={formData.renovation_preference || ""}
                  onChange={(value) =>
                    updateFormData("renovation_preference", value)
                  }
                  options={RENOVATION_PREFERENCE_OPTIONS}
                  placeholder="Select..."
                  isOpen={openDropdowns.renovation_preference || false}
                  onToggle={() => toggleDropdown("renovation_preference")}
                  dropdownRef={getDropdownRef("renovation_preference")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Intended Property Use
                </label>
                <CustomDropdown
                  value={formData.intended_property_use || ""}
                  onChange={(value) =>
                    updateFormData("intended_property_use", value)
                  }
                  options={PROPERTY_USE_OPTIONS}
                  placeholder="Select..."
                  isOpen={openDropdowns.intended_property_use || false}
                  onToggle={() => toggleDropdown("intended_property_use")}
                  dropdownRef={getDropdownRef("intended_property_use")}
                />
              </div>

              <div className="md:col-span-2">
                <TagInput
                  key="preferred_home_features"
                  field="preferred_home_features"
                  label="Preferred Home Features"
                  placeholder="Enter feature and click + to add (e.g., garage, pool, fireplace)"
                />
                <div className="md:col-span-2">
                  <TagInput
                    key="deal_breakers"
                    field="deal_breakers"
                    label="Deal Breakers"
                    placeholder="Add deal breakers (e.g., No parking, Busy road, Old plumbing)"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Location Preferences
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div>
                <RequiredLabel>Walkability Importance</RequiredLabel>
                <OnboardPersonalizeDropdown
                  value={formData.walkability_importance || ""}
                  onChange={(value) =>
                    updateFormData("walkability_importance", value)
                  }
                  options={WALKABILITY_OPTIONS}
                  placeholder="Select..."
                  isOpen={openDropdowns.walkability_importance || false}
                  onToggle={() => toggleDropdown("walkability_importance")}
                  dropdownRef={getDropdownRef("walkability_importance")}
                />
              </div>
            </div>

            {/* Home Price Estimate Section */}
            <HomePriceEstimate
              homePriceLoading={homePriceLoading}
              homePriceError={homePriceError}
              homePriceResult={homePriceResult}
              showHomePriceDetails={showHomePriceDetails}
              setShowHomePriceDetails={setShowHomePriceDetails}
              formData={formData}
            />
          </div>
        );

      case "location":
        return (
          <div className="space-y-6">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif text-black mb-4 sm:mb-6">
              {SECTION_TITLES.LOCATION_PREFERENCES}
            </h2>

            <div className="space-y-6">
              <div>
                <OptionalLabel>
                  <span className="text-center block">
                    Tell us about important places in your life and daily
                    routines.
                  </span>
                </OptionalLabel>
                <p className="text-xs sm:text-sm md:text-base text-black/60 mb-4">
                  Add locations like work, family, or places you visit regularly.
                  We'll help you find homes with reasonable commute times to
                  these important places in your daily routines.
                </p>
                <ImportantLocationsInput
                  locations={formData.important_locations || []}
                  onChange={(locations: { name: string; address: string; commute_tolerance?: number }[]) => {
                    updateFormData("important_locations", locations);
                  }}
                  scriptsReady={scriptsReady}
                />
                {loadError && (
                  <p className="text-red-500 text-xs mt-2">{loadError}</p>
                )}
              </div>
            </div>
          </div>
        );

      case "communication":
        return (
          <div className="space-y-6">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif text-black mb-4 sm:mb-6">
              {SECTION_TITLES.COMMUNICATION_PREFERENCES}
            </h2>

            {/* Communication Preference */}
            <div>
              <RequiredLabel>{FIELD_LABELS.COMMUNICATION_FREQUENCY}</RequiredLabel>
              <OnboardPersonalizeDropdown
                value={formData.communication_frequency || ""}
                onChange={(value) =>
                  updateFormData("communication_frequency", value)
                }
                options={COMMUNICATION_FREQUENCY_OPTIONS}
                placeholder="Select..."
                isOpen={openDropdowns.communication_frequency || false}
                onToggle={() => toggleDropdown("communication_frequency")}
                dropdownRef={getDropdownRef("communication_frequency")}
              />
            </div>

            {/* Information Detail Level */}
            <div>
              <RequiredLabel>Information Detail Level</RequiredLabel>
              <OnboardPersonalizeDropdown
                value={formData.information_detail_level || ""}
                onChange={(value) =>
                  updateFormData("information_detail_level", value)
                }
                options={INFORMATION_DETAIL_OPTIONS}
                placeholder="Select..."
                isOpen={openDropdowns.information_detail_level || false}
                onToggle={() => toggleDropdown("information_detail_level")}
                dropdownRef={getDropdownRef("information_detail_level")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buyer's Agent Dropdown */}
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-black mb-2">
                  Do you currently have a buyer's agent?
                </label>
                <CustomDropdown
                  value={formData.has_buyers_agent ?? ""}
                  onChange={(value) =>
                    updateFormData("has_buyers_agent", value)
                  }
                  options={BUYERS_AGENT_OPTIONS}
                  placeholder="Select..."
                  isOpen={openDropdowns.has_buyers_agent || false}
                  onToggle={() => toggleDropdown("has_buyers_agent")}
                  dropdownRef={getDropdownRef("has_buyers_agent")}
                />
              </div>

              {/* Show checkbox if user does NOT have a buyer's agent */}
              {formData.has_buyers_agent === "no" && (
                <div className="flex flex-col justify-center items-center h-full w-full md:mt-2">
                  <label
                    htmlFor="onboard-looking-buyers-agent"
                    className="flex items-center gap-3 text-sm font-medium text-black cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="onboard-looking-buyers-agent"
                      className="sr-only peer"
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
                    <span className="select-none">
                      I am looking for a buyer's agent
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        );

      case "reportcustomization":
        if (loading) {
          return (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif text-black mb-4 sm:mb-6">
                Priorities
              </h2>
              <Loading message="Loading report customization options..." />
            </div>
          );
        }

        const orderedSections = getOrderedReportSections();

        if (!orderedSections || orderedSections.length === 0) {
          return (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif text-black mb-4 sm:mb-6">
                Priorities
              </h2>
              <Loading message="Loading report customization options..." />
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif text-black mb-4 sm:mb-6">
              Priorities
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4">
              Customize your report sections below:
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={
                  orderedSections
                    ?.map((section) => section?.key)
                    .filter(Boolean) || []
                }
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {orderedSections?.map((section) => {
                    if (!section || !section.key || !section.label)
                      return null;

                    const priorities =
                      formData.report_section_priorities || [];
                    const priorityIndex = priorities.indexOf(section.key);
                    const isChecked = priorityIndex !== -1;
                    const priority = isChecked
                      ? priorityIndex + 1
                      : undefined;

                    return (
                      <SortableReportSection
                        key={section.key}
                        id={section.key}
                        label={section.label}
                        checked={isChecked}
                        onToggle={(checked) => {
                          handleReportSectionToggle(section.key, checked);
                        }}
                        priority={priority}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        );

      default:
        return <div>Step content for {step.title} coming soon...</div>;
    }
  };

  // Self-contained TagInput component that manages its own state
  const TagInput = React.memo(
    ({
      field,
      label,
      placeholder,
    }: {
      field: keyof OnboardingData;
      label: string;
      placeholder: string;
    }) => {
      const [draftText, setDraftText] = React.useState("");
      const currentTags = (formData[field] as string[]) || [];

      const handleAddTag = (value: string) => {
        if (!value.trim()) return;
        const currentArray = (formData[field] as string[]) || [];
        if (!currentArray.includes(value.trim())) {
          updateFormData(field, [...currentArray, value.trim()]);
        }
        setDraftText("");
      };

      const handleRemoveTag = (valueToRemove: string) => {
        const currentArray = (formData[field] as string[]) || [];
        updateFormData(
          field,
          currentArray.filter((item) => item !== valueToRemove)
        );
      };

      const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAddTag(draftText);
        }
      };

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDraftText(e.target.value);
      };

      return (
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            {label}
          </label>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={draftText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="mobile-input flex-1"
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => handleAddTag(draftText)}
              className="px-4 py-2 bg-brown text-white rounded-lg hover:bg-brown/80 transition-colors touch-friendly flex items-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {currentTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-beige text-black"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-black/60 hover:text-black"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }
  );

  return (
    <div className="w-full max-w-[90vw] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mt-4 sm:mt-6 mb-3 sm:mb-4">
        <div className="flex items-center">
          <img src={KeyLogo} alt="SilverKey Logo" className="h-6 sm:h-8 md:h-10" />
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
      <div className="mobile-card">
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-beige/30">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center justify-center px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
              currentStep === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-white border border-brown text-black hover:bg-brown hover:text-white"
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Previous</span>
          </button>

          {currentStep === STEPS.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center justify-center px-3 py-2 bg-olive text-white rounded-lg hover:bg-olive/80 disabled:opacity-50 font-medium transition-all duration-200 text-sm"
            >
              <span>{loading ? "Saving..." : "Complete Setup"}</span>
              {!loading && (
                <Check className="w-4 h-4 ml-1" />
              )}
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center justify-center px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-medium transition-all duration-200 text-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
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
