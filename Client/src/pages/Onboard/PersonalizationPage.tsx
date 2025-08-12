import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Edit,
  Save,
  X,
  User,
  Building,
  Home,
  MapPin,
  MessageSquare,
  ChevronDown,
  Plus,
  GripVertical,
} from "lucide-react";
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
import { apiRequest } from "../../lib/api";
import { useData } from "../../contexts/DataContext";
import ImportantLocationsInput from "../../components/ImportantLocationsInput";
import Loading from "../../components/Loading";
import MiniLogo from "../../components/MiniLogo";
import OliveCheckbox from "../../components/OliveCheckbox";
import PreferredRegionsInput from "../../components/PreferredRegionsInput";
import PriceRangeSlider from "../../components/PriceRangeSlider";
import { estimateAffordableHomePrice } from "../../hooks/getHomePrice";

// Extend window interface for Google Maps
declare global {
  interface Window {
    google?: any;
  }
}

interface OnboardingData {
  // Demographics
  pets?: string;
  age?: number;
  gender?: string;
  occupation?: string;

  // Financial
  gross_income?: number;
  home_budget?: number;
  credit_score_range?: string;
  down_payment?: number;
  ideal_zip_code?: string;

  // Home Buying Process
  preferred_housing_type?: string;
  preferred_bathrooms?: number;
  preferred_bedrooms?: number;
  preferred_lot_size?: string;
  preferred_home_age?: string;
  preferred_architectural_style?: string;
  preferred_home_features?: string[];
  renovation_preference?: string;
  intended_property_use?: string;
  architectural_style_preference?: string;
  deal_breakers?: string[];

  // Location & Housing
  preferred_regions?: { name: string; address: string }[];
  important_locations?: { name: string; address: string; commute_tolerance?: number }[];
  walkability_importance?: string;

  // Communication
  communication_frequency?: string;
  information_detail_level?: string;
  has_buyers_agent?: string; // 'yes' | 'no'
  looking_for_buyers_agent?: boolean;

  // Report Customization
  report_section_priorities?: string[];
}

const STEPS = [
  { id: "reportcustomization", title: "Report Customization", icon: Building },
  { id: "demographics", title: "About You", icon: User },
  { id: "financial", title: "Financial Profile", icon: Building },
  { id: "housing", title: "Housing Preferences", icon: Home },
  { id: "location", title: "Location Preferences", icon: MapPin },
  { id: "communication", title: "Communication", icon: MessageSquare },
];

// Custom dropdown component matching PastReports implementation
interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  isOpen,
  onToggle,
  dropdownRef,
  disabled = false,
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={disabled ? undefined : onToggle}
        className={`mobile-input text-sm flex items-center justify-between w-full ${
          disabled
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer hover:border-brown focus:border-brown focus:ring-brown/20"
        }`}
        disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
      >
        <span className="text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-beige rounded-lg shadow-lg z-50">
          {options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => {
                if (!disabled) {
                  onChange(option.value);
                  onToggle();
                }
              }}
              disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              className={`w-full px-3 py-2 text-left text-sm transition-colors duration-150 ${
                index === 0 ? "first:rounded-t-lg" : ""
              } ${index === options.length - 1 ? "last:rounded-b-lg" : ""} ${
                value === option.value
                  ? "bg-brown/10 text-brown font-medium"
                  : "text-black"
              } ${
                disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-brown/5"
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

// Sortable Report Section Component
interface SortableReportSectionProps {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  priority?: number;
}

const SortableReportSection: React.FC<SortableReportSectionProps> = ({
  id,
  label,
  checked,
  onToggle,
  priority,
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
      className={`flex items-center space-x-3 p-3 border rounded-lg transition-all duration-200 border-beige hover:bg-beige/10 hover:border-brown/30 ${
        !checked ? "opacity-60" : ""
      } ${isDragging ? "shadow-lg bg-white border-brown/50" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex items-center space-x-3 flex-1">
        <div className="flex items-center space-x-2">
          {priority && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {priority}
            </span>
          )}

          <label
            htmlFor={id}
            className="flex items-center space-x-3 cursor-pointer flex-1"
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
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  checked
                    ? "bg-brown border-brown text-white shadow-sm"
                    : "border-beige hover:border-brown/50 bg-white"
                }`}
              >
                {checked && (
                  <svg
                    className="w-3 h-3"
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
            <span className="text-sm font-medium text-gray-700 flex-1">
              {label}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default function PersonalizationPage() {
  const { userPreferences, refreshUserPreferences } = useData();
  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("demographics");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: boolean;
  }>({});
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [homePriceResult, setHomePriceResult] = useState<any>(null);
  const [homePriceLoading, setHomePriceLoading] = useState(false);
  const [homePriceError, setHomePriceError] = useState<string | null>(null);

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

  // Refs for dropdown management
  const dropdownRefs = useRef<{
    [key: string]: React.RefObject<HTMLDivElement>;
  }>({});

  // Helper function to get or create dropdown ref
  const getDropdownRef = (fieldName: string) => {
    if (!dropdownRefs.current[fieldName]) {
      dropdownRefs.current[fieldName] = React.createRef<HTMLDivElement>();
    }
    return dropdownRefs.current[fieldName];
  };

  // Helper function to toggle dropdown
  const toggleDropdown = (fieldName: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
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
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdowns]);

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

  // Track scroll position to update active section
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
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load Google Places API script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setLoadError("Missing Google Maps API key.");
      return;
    }

    if (window.google?.maps?.places?.AutocompleteSuggestion) {
      setScriptsReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptsReady(true);
    script.onerror = () =>
      setLoadError(
        "Failed to load Google Maps script. Please check your API key or internet."
      );

    document.head.appendChild(script);

    return () => {
      // Clean up script if component unmounts
      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com"]`
      );
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const loadUserPreferencesFromContext = () => {
    try {
      setIsLoading(true);

      console.log(
        "🔍 Loading from context - userPreferences:",
        userPreferences
      );
      console.log(
        "🔍 Report customization from context:",
        userPreferences?.report_section_priorities
      );

      if (userPreferences) {
        setFormData(userPreferences as OnboardingData);
        setOriginalData(userPreferences as OnboardingData);
      } else {
        console.log("❌ No preferences found in context");
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

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      // Debug: Log the data being saved
      console.log("💾 Saving formData:", formData);
      console.log(
        "💾 Report section priorities being saved:",
        formData.report_section_priorities
      );

      await apiRequest("/api/v1/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      setIsEditMode(false);
      setOriginalData(formData);
      setShowSuccessDialog(true);
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

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const TagInput = ({
    field,
    label,
    placeholder,
    value,
    onChange,
  }: {
    field: keyof OnboardingData;
    label: string;
    placeholder: string;
    value?: string;
    onChange?: (value: string) => void;
  }) => {
    const [inputValue, setInputValue] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (onChange) {
        onChange(newValue);
      } else {
        setInputValue(newValue);
      }
    };

    const handleAddTag = (valueToAdd: string) => {
      if (!valueToAdd.trim()) return;
      const currentArray = (formData[field] as string[]) || [];
      if (!currentArray.includes(valueToAdd.trim())) {
        updateFormData(field, [...currentArray, valueToAdd.trim()]);
      }
      if (onChange) {
        onChange("");
      } else {
        setInputValue("");
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const currentInputValue =
          onChange && value !== undefined ? value : inputValue;
        handleAddTag(currentInputValue);
      }
    };

    const removeTag = (indexToRemove: number) => {
      const currentArray = (formData[field] as string[]) || [];
      const newArray = currentArray.filter(
        (_, index) => index !== indexToRemove
      );
      updateFormData(field, newArray);
    };

    const currentTags = (formData[field] as string[]) || [];

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-black mb-2">
          {label}
        </label>
        {isEditMode ? (
          <>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={onChange && value !== undefined ? value : inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                className="mobile-input flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const currentInputValue =
                    onChange && value !== undefined ? value : inputValue;
                  handleAddTag(currentInputValue);
                }}
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
                      onClick={() => removeTag(index)}
                      className="ml-2 text-black/60 hover:text-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="p-3 min-h-[48px]">
            {currentTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-beige text-black"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">Not specified</span>
            )}
          </div>
        )}
      </div>
    );
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
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Tell us about yourself
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Age
                </label>
                {isEditMode ? (
                  <input
                    type="number"
                    value={formData.age || ""}
                    onChange={(e) =>
                      updateFormData(
                        "age",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    className="mobile-input"
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
                  <CustomDropdown
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
                    isOpen={openDropdowns.gender || false}
                    onToggle={() => toggleDropdown("gender")}
                    dropdownRef={getDropdownRef("gender")}
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
                  <CustomDropdown
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
                    isOpen={openDropdowns.pets || false}
                    onToggle={() => toggleDropdown("pets")}
                    dropdownRef={getDropdownRef("pets")}
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
                  <input
                    type="text"
                    value={formData.occupation || ""}
                    onChange={(e) =>
                      updateFormData("occupation", e.target.value)
                    }
                    className="mobile-input"
                    placeholder="Your job title"
                  />
                ) : (
                  <div className="mobile-input bg-gray-50">
                    {formData.occupation || "Not specified"}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "financial":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Financial Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="w-4/5 mx-auto">
                <label className="block text-xs font-normal text-black mb-1 text-center w-full">
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
                  <div className="mobile-input bg-gray-50 text-center mt-2">
                    ${(formData.gross_income || 0).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="w-4/5 mx-auto">
                <label className="block text-xs font-normal text-black mb-1 text-center w-full">
                  Down Payment
                </label>
                {isEditMode ? (
                  <PriceRangeSlider
                    tickValues={[
                      50000, 100000, 200000, 300000, 500000, 750000, 1000000,
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
                  <div className="mobile-input bg-gray-50 text-center mt-2">
                    ${(formData.down_payment || 0).toLocaleString()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2 text-center">
                  Ideal Zip Code
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={formData.ideal_zip_code || ""}
                    onChange={(e) =>
                      updateFormData("ideal_zip_code", e.target.value)
                    }
                    className="mobile-input"
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
                  Credit Score Range
                </label>
                {isEditMode ? (
                  <CustomDropdown
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
                    isOpen={openDropdowns.credit_score_range || false}
                    onToggle={() => toggleDropdown("credit_score_range")}
                    dropdownRef={getDropdownRef("credit_score_range")}
                  />
                ) : (
                  <div className="mobile-input bg-gray-50 text-center">
                    {formData.credit_score_range
                      ? [
                          { value: "poor", label: "Poor (300-579)" },
                          { value: "fair", label: "Fair (580-669)" },
                          { value: "good", label: "Good (670-739)" },
                          { value: "very_good", label: "Very Good (740-799)" },
                          { value: "excellent", label: "Excellent (800-850)" },
                        ].find(
                          (opt) => opt.value === formData.credit_score_range
                        )?.label
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div className="col-span-1 md:col-span-2 flex flex-col items-center">
                <label className="block text-2xl font-bold text-black mb-2 text-center w-full">
                  Home Budget
                </label>
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
                  <div className="mobile-input bg-gray-50 text-center mt-2 text-2xl font-bold">
                    ${(formData.home_budget || 0).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Home Price Calculation Results */}
              <div className="col-span-1 md:col-span-2 mt-6 p-4 bg-white rounded-lg border border-olive">
                <h3 className="text-lg font-medium text-olive mb-2">
                  Estimated Home Affordability
                </h3>

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
                        <p className="text-sm text-black">Maximum Home Price</p>
                        <p className="text-xl font-bold text-olive">
                          ${homePriceResult.maxHomePrice.toLocaleString()}
                        </p>
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
                      <p className="font-medium mb-2">
                        How We Calculated This:
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
                          Important Considerations:
                        </p>
                        <ul className="list-disc list-inside text-sm text-black pl-2">
                          {homePriceResult.warnings.map(
                            (warning: string, i: number) => (
                              <li key={i}>{warning}</li>
                            )
                          )}
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
        );

      case "housing":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Housing Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Desired Housing Type
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.preferred_housing_type || ""}
                    onChange={(value) =>
                      updateFormData("preferred_housing_type", value)
                    }
                    options={[
                      { value: "single_family", label: "Single Family Home" },
                      { value: "condo", label: "Condominium" },
                      { value: "townhouse", label: "Townhouse" },
                      { value: "apartment", label: "Apartment" },
                      { value: "duplex", label: "Duplex" },
                    ]}
                    placeholder="Select..."
                    isOpen={openDropdowns.desired_housing_type || false}
                    onToggle={() => toggleDropdown("desired_housing_type")}
                    dropdownRef={getDropdownRef("desired_housing_type")}
                  />
                ) : (
                  <div className="mobile-input bg-gray-50">
                    {formData.preferred_housing_type
                      ? [
                          {
                            value: "single_family",
                            label: "Single Family Home",
                          },
                          { value: "condo", label: "Condominium" },
                          { value: "townhouse", label: "Townhouse" },
                          { value: "apartment", label: "Apartment" },
                          { value: "duplex", label: "Duplex" },
                        ].find(
                          (opt) => opt.value === formData.preferred_housing_type
                        )?.label
                      : "Not specified"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Bedrooms
                </label>
                {isEditMode ? (
                  <input
                    type="number"
                    value={formData.preferred_bedrooms || ""}
                    onChange={(e) =>
                      updateFormData(
                        "preferred_bedrooms",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    className="mobile-input"
                    min="1"
                    max="10"
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
                  <input
                    type="number"
                    value={formData.preferred_bathrooms || ""}
                    onChange={(e) =>
                      updateFormData(
                        "preferred_bathrooms",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    className="mobile-input"
                    min="1"
                    max="10"
                    step="0.5"
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
                  <CustomDropdown
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
                    isOpen={openDropdowns.preferred_lot_size || false}
                    onToggle={() => toggleDropdown("preferred_lot_size")}
                    dropdownRef={getDropdownRef("preferred_lot_size")}
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
                  <CustomDropdown
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
                    isOpen={openDropdowns.preferred_home_age || false}
                    onToggle={() => toggleDropdown("preferred_home_age")}
                    dropdownRef={getDropdownRef("preferred_home_age")}
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
                  <CustomDropdown
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
                    isOpen={
                      openDropdowns.preferred_architectural_style || false
                    }
                    onToggle={() =>
                      toggleDropdown("preferred_architectural_style")
                    }
                    dropdownRef={getDropdownRef(
                      "preferred_architectural_style"
                    )}
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
                  <CustomDropdown
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
                    isOpen={openDropdowns.renovation_preference || false}
                    onToggle={() => toggleDropdown("renovation_preference")}
                    dropdownRef={getDropdownRef("renovation_preference")}
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
                  <CustomDropdown
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
                    isOpen={openDropdowns.intended_property_use || false}
                    onToggle={() => toggleDropdown("intended_property_use")}
                    dropdownRef={getDropdownRef("intended_property_use")}
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
                  <TagInput
                    key="preferred_home_features"
                    field="preferred_home_features"
                    label="Preferred Home Features"
                    placeholder="Enter feature and click + to add (e.g., garage, pool, fireplace)"
                  />
                </div>
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

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Walkability Importance
                </label>
                {isEditMode ? (
                  <CustomDropdown
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
                    isOpen={openDropdowns.walkability_importance || false}
                    onToggle={() => toggleDropdown("walkability_importance")}
                    dropdownRef={getDropdownRef("walkability_importance")}
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
                  Add relevant locations to your commute (e.g., workplace,
                  family home)
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
              <div className="flex-1">
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Regions
                </label>
                <p className="text-xs text-gray-500 mb-4">
                  Add regions where you'd like to live (e.g. Midtown Atlanta,
                  L.A, etc.)
                </p>
                <PreferredRegionsInput
                  regions={formData.preferred_regions || []}
                  onChange={(regions) =>
                    updateFormData("preferred_regions", regions)
                  }
                  scriptsReady={scriptsReady}
                  isEditMode={isEditMode}
                />
              </div>
            </div>
          </div>
        );

      case "communication":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Communication Preferences
            </h2>

            {/* Communication Preference */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Communication Frequency
              </label>
              {isEditMode ? (
                <CustomDropdown
                  value={formData.communication_frequency || ""}
                  onChange={(value) =>
                    updateFormData("communication_frequency", value)
                  }
                  options={[
                    { value: "frequent", label: "Frequent updates" },
                    { value: "milestone", label: "Milestone updates" },
                    { value: "minimal", label: "Minimal contact" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.communication_frequency || false}
                  onToggle={() => toggleDropdown("communication_frequency")}
                  dropdownRef={getDropdownRef("communication_frequency")}
                />
              ) : (
                <div className="mobile-input bg-gray-50">
                  {formData.communication_frequency
                    ? [
                        { value: "frequent", label: "Frequent updates" },
                        { value: "milestone", label: "Milestone updates" },
                        { value: "minimal", label: "Minimal contact" },
                      ].find(
                        (opt) => opt.value === formData.communication_frequency
                      )?.label
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
                <CustomDropdown
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
                  isOpen={openDropdowns.information_detail_level || false}
                  onToggle={() => toggleDropdown("information_detail_level")}
                  dropdownRef={getDropdownRef("information_detail_level")}
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
                  <CustomDropdown
                    value={formData.has_buyers_agent ?? ""}
                    onChange={(value) =>
                      updateFormData("has_buyers_agent", value)
                    }
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                    placeholder="Select..."
                    isOpen={openDropdowns.has_buyers_agent || false}
                    onToggle={() => toggleDropdown("has_buyers_agent")}
                    dropdownRef={getDropdownRef("has_buyers_agent")}
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
          </div>
        );

      case "reportcustomization":
        if (isLoading) {
          return (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
                Report Customization
              </h2>
              <Loading message="Loading report customization options..." />
            </div>
          );
        }

        const orderedSections = getOrderedReportSections();

        if (!orderedSections || orderedSections.length === 0) {
          return (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
                Report Customization
              </h2>
              <Loading message="Loading report customization options..." />
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Report Customization
            </h2>
            <p className="text-gray-600 mb-4">
              {isEditMode
                ? "Customize your report sections below:"
                : "Choose which sections to include in your property reports. All sections are enabled by default, but you can customize them to focus on what matters most to you."}
            </p>

            {isEditMode ? (
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {orderedSections?.map((section) => {
                  if (!section || !section.key || !section.label) return null;

                  const priorities = formData.report_section_priorities || [];
                  const priorityIndex = priorities.indexOf(section.key);
                  const isChecked = priorityIndex !== -1;
                  const priority = isChecked ? priorityIndex + 1 : undefined;

                  return (
                    <div
                      key={section.key}
                      className={`flex items-center space-x-3 p-3 bg-gray-50 border border-gray-300 rounded-lg ${
                        !isChecked ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {priority && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {priority}
                          </span>
                        )}

                        <div className="relative">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              isChecked
                                ? "bg-brown border-brown text-white shadow-sm"
                                : "border-gray-300 bg-gray-100"
                            }`}
                          >
                            {isChecked && (
                              <svg
                                className="w-3 h-3"
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
                        <span className="text-sm font-medium text-gray-700 flex-1">
                          {section.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-7xl mx-auto mobile-padding">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-black flex items-center gap-2">
              <MiniLogo size="md" />
              Personalization
            </h1>
            <p className="text-gray-600 mt-2">
              Review and update your preferences
            </p>
          </div>

          <div className="flex gap-3">
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-olive text-white rounded-lg hover:bg-olive/80 transition-colors touch-friendly"
              >
                <Edit size={16} />
                Edit Preferences
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors touch-friendly"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="flex-1 flex items-center gap-2 px-4 py-2 bg-olive text-white rounded-lg hover:bg-olive/80 transition-colors disabled:opacity-50 touch-friendly"
                >
                  <Save size={16} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar and Content Layout */}
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="mobile-card sticky top-4">
              <h3 className="text-lg font-semibold text-black mb-4">
                Sections
              </h3>

              {/* Action Buttons */}
              <div className="mb-6 space-y-2">
                {!isEditMode ? (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-olive text-white rounded-lg hover:bg-olive/80 transition-colors touch-friendly"
                  >
                    <Edit size={16} />
                    Edit Preferences
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="w-full flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors touch-friendly"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="w-full flex items-center gap-2 px-4 py-2 bg-olive text-white rounded-lg hover:bg-olive/80 transition-colors disabled:opacity-50 touch-friendly"
                    >
                      <Save size={16} />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                )}
              </div>

              {/* Section Navigation */}
              <div className="space-y-1">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.id}
                      onClick={() => scrollToSection(step.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                        activeSection === step.id
                          ? "bg-brown text-white"
                          : "text-gray-700 hover:bg-beige/50"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-sm">{step.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="space-y-8">
              {STEPS.map((step) => (
                <div key={step.id} id={step.id} className="mobile-card">
                  {renderSectionContent(step.id)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      {showSuccessDialog &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto"
            style={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <div
              className="flex min-h-screen items-center justify-center p-4 sm:p-6"
              style={{ width: "100vw", height: "100vh" }}
            >
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={() => setShowSuccessDialog(false)}
                style={{ left: 0, right: 0, top: 0, bottom: 0 }}
              />

              {/* Dialog */}
              <div
                className="relative z-[10000] w-full max-w-sm mx-auto transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all"
                style={{ maxWidth: "320px" }}
              >
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setShowSuccessDialog(false)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-500 touch-friendly"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Content */}
                <div className="flex items-start justify-center">
                  <div className="mt-3 text-center w-full">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Success!
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Preferences updated successfully!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="mt-5 sm:mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowSuccessDialog(false)}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-gold px-6 py-2 text-sm font-medium text-black shadow-sm hover:bg-gold/90 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 sm:w-auto touch-friendly min-w-[100px]"
                  >
                    Okay
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
