import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  User,
  Home,
  MapPin,
  Heart,
  Brain,
  Building,
  MessageSquare,
  Lightbulb,
  Plus,
  X,
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface OnboardingData {
  age?: number;
  gender?: string;
  marital_status?: string;
  household_size?: number;
  children_count?: number;
  children_ages?: number[];
  education_level?: string;
  occupation?: string;
  industry?: string;
  employment_status?: string;
  income_range?: string;
  preferred_home_price_range?: string;
  credit_score_range?: string;
  savings_amount_range?: string;
  investment_experience?: string;
  risk_tolerance?: string;
  desired_housing_type?: string;
  preferred_bathrooms?: number;
  preferred_bedrooms?: number;
  preferred_lot_size?: string;
  preferred_home_age?: string;
  preferred_architectural_style?: string;
  preferred_home_features?: string[];
  preferred_regions?: string[];
  preferred_climate?: string;
  urban_rural_preference?: string;
  commute_tolerance?: number;
  proximity_to_family?: string;
  walkability_importance?: string;
  lifestyle_type?: string;
  hobbies_interests?: string[];
  dining_preferences?: string[];
  fitness_activities?: string[];
  decision_making_style?: string;
  research_behavior?: string;
  favored_information_style?: string;
  political_leaning?: string;
  community_involvement?: string;
  property_search_stage?: string;
  home_buying_experience?: string;
  financing_preference?: string;
  property_features_priority?: string[];
  deal_breakers?: string[];
  renovation_willingness?: string;
  intended_property_use?: string;
  timeline_to_purchase?: string;
  current_home_ownership_status?: string;
  moving_reason?: string;
  agent_experience_preference?: string;
  preferred_support_channel?: string;
  communication_preference?: string;
  communication_frequency?: string;
  information_detail_level?: string;
  meeting_preference?: string;
  meeting_availability?: string;
  response_time_expectation?: string;
  quote_bubbles?: string[];
  deal_makers?: string[];
  concerns_or_fears?: string[];
  additional_context?: string;
  // Report Customization
  report_section_priorities?: string[];
}

const STEPS = [
  { id: "demographics", title: "About You", icon: User },
  { id: "financial", title: "Financial Profile", icon: Building },
  { id: "housing", title: "Housing Preferences", icon: Home },
  { id: "location", title: "Location Preferences", icon: MapPin },
  { id: "lifestyle", title: "Lifestyle", icon: Heart },
  { id: "behavior", title: "Preferences", icon: Brain },
  { id: "realestate", title: "Real Estate Goals", icon: Building },
  { id: "communication", title: "Communication", icon: MessageSquare },
  { id: "insights", title: "Personal Insights", icon: Lightbulb },
  { id: "reportcustomization", title: "Report Customization", icon: Check },
];

// Valid report sections that exactly match backend models
const VALID_REPORT_SECTIONS = [
  "neighborhood_overview",
  "safety",
  "culture_and_events",
  "social_character",
  "local_amenities",
  "commute",
  "family_friendly",
  "nightlife_and_dating",
  "development",
  "environment_utilities",
  "financial_information",
  "schools",
  "extra_tips",
];

const REPORT_SECTIONS = [
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
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-3 p-3 bg-white border border-beige rounded-lg hover:border-brown/30 transition-all duration-200 ${
        !checked ? "opacity-60" : ""
      } ${isDragging ? "shadow-lg bg-white border-brown/50" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-brown/10 rounded transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-brown/60" />
      </div>

      {checked && priority && (
        <div className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex items-center justify-center border border-gray-200 decoration-gray-400 decoration-1">
          {priority}
        </div>
      )}

      <label className="flex items-center space-x-3 flex-1 cursor-pointer">
        <input
          type="checkbox"
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
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <span className="text-sm font-medium text-gray-700 flex-1">
          {label}
        </span>
      </label>
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
        className="mobile-input text-sm flex items-center justify-between cursor-pointer hover:border-brown focus:border-brown focus:ring-brown/20 w-full"
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

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-beige rounded-lg shadow-lg z-50">
          {options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                onToggle();
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-brown/5 transition-colors duration-150 ${
                index === 0 ? "first:rounded-t-lg" : ""
              } ${index === options.length - 1 ? "last:rounded-b-lg" : ""} ${
                value === option.value
                  ? "bg-brown/10 text-brown font-medium"
                  : "text-black"
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
    // Initialize report customization with all valid sections included by default
    report_section_priorities: [...VALID_REPORT_SECTIONS],
  });
  const [loading, setLoading] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {}
  );
  const dropdownRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>(
    {}
  );
  const navigate = useNavigate();

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

      const reorderedSections = arrayMove(sections, oldIndex, newIndex);
      const newPriorities = reorderedSections.map((section) => section.key);

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
      // Add to priorities when checked (if not already there)
      if (!currentPriorities.includes(sectionKey)) {
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

  // Validation method for children count
  const validateAllowZero = (value: string): number | undefined => {
    // Allow empty string (not specified)
    if (value === "") {
      return undefined;
    }

    const numValue = parseInt(value, 10);

    // Check if it's a valid number
    if (isNaN(numValue)) {
      return undefined;
    }

    // Must be non-negative integer (0 or greater)
    if (numValue < 0) {
      return undefined;
    }

    return numValue;
  };

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
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      // Enhanced logging for debugging
      console.log("[OnboardingPage] Starting preferences submission...");
      console.log("[OnboardingPage] API Base URL:", apiBaseUrl);
      console.log("[OnboardingPage] ID Token exists:", !!idToken);
      console.log("[OnboardingPage] ID Token length:", idToken?.length || 0);
      console.log(
        "[OnboardingPage] Form data payload:",
        JSON.stringify(formData, null, 2)
      );

      const requestUrl = `${apiBaseUrl}/api/v1/preferences`;
      console.log("[OnboardingPage] Request URL:", requestUrl);

      const requestHeaders = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${idToken}`,
      };
      console.log("[OnboardingPage] Request headers:", requestHeaders);

      const response = await fetch(requestUrl, {
        method: "POST",
        mode: "cors",
        headers: requestHeaders,
        body: JSON.stringify(formData),
      });

      console.log("[OnboardingPage] Response status:", response.status);
      console.log(
        "[OnboardingPage] Response status text:",
        response.statusText
      );
      console.log(
        "[OnboardingPage] Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        // Try to get error details from response body
        let errorDetails = "No additional error details";
        try {
          const errorText = await response.text();
          console.log("[OnboardingPage] Error response body:", errorText);
          errorDetails = errorText;
        } catch (e) {
          console.log(
            "[OnboardingPage] Could not read error response body:",
            e
          );
        }

        const errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}. Details: ${errorDetails}`;
        console.error("[OnboardingPage] Request failed:", errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("[OnboardingPage] Success response:", result);

      if (result.success || result.document_id) {
        console.log(
          "[OnboardingPage] Preferences submitted successfully, navigating to dashboard"
        );
        localStorage.removeItem("onboardingDraft");
        // Navigate to dashboard after successful onboarding completion
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

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
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
                <input
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) =>
                    updateFormData("age", parseInt(e.target.value) || undefined)
                  }
                  className="mobile-input"
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Gender
                </label>
                <CustomDropdown
                  value={formData.gender || ""}
                  onChange={(value) => updateFormData("gender", value)}
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "non-binary", label: "Non-binary" },
                    { value: "prefer_not_to_say", label: "Prefer not to say" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.gender || false}
                  onToggle={() => toggleDropdown("gender")}
                  dropdownRef={getDropdownRef("gender")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Marital Status
                </label>
                <CustomDropdown
                  value={formData.marital_status || ""}
                  onChange={(value) => updateFormData("marital_status", value)}
                  options={[
                    { value: "single", label: "Single" },
                    { value: "married", label: "Married" },
                    { value: "divorced", label: "Divorced" },
                    { value: "widowed", label: "Widowed" },
                    { value: "partnered", label: "Partnered" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.marital_status || false}
                  onToggle={() => toggleDropdown("marital_status")}
                  dropdownRef={getDropdownRef("marital_status")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Household Size
                </label>
                <input
                  type="number"
                  value={formData.household_size || ""}
                  onChange={(e) =>
                    updateFormData(
                      "household_size",
                      parseInt(e.target.value) || undefined
                    )
                  }
                  className="mobile-input"
                  placeholder="Number of people in household"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Number of Children
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={
                    formData.children_count !== undefined
                      ? formData.children_count
                      : ""
                  }
                  onChange={(e) =>
                    updateFormData(
                      "children_count",
                      validateAllowZero(e.target.value)
                    )
                  }
                  className="mobile-input"
                  placeholder="Number of children"
                />
              </div>

              <div>
                <NumberTagInput
                  field="children_ages"
                  label="Children's Ages"
                  placeholder="Enter age and click + to add"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Education Level
                </label>
                <CustomDropdown
                  value={formData.education_level || ""}
                  onChange={(value) => updateFormData("education_level", value)}
                  options={[
                    { value: "high_school", label: "High School" },
                    { value: "some_college", label: "Some College" },
                    { value: "bachelors", label: "Bachelor's Degree" },
                    { value: "masters", label: "Master's Degree" },
                    { value: "doctorate", label: "Doctorate" },
                    { value: "other", label: "Other" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.education_level || false}
                  onToggle={() => toggleDropdown("education_level")}
                  dropdownRef={getDropdownRef("education_level")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation || ""}
                  onChange={(e) => updateFormData("occupation", e.target.value)}
                  className="mobile-input"
                  placeholder="Your job title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Employment Status
                </label>
                <CustomDropdown
                  value={formData.employment_status || ""}
                  onChange={(value) =>
                    updateFormData("employment_status", value)
                  }
                  options={[
                    { value: "employed", label: "Employed" },
                    { value: "unemployed", label: "Unemployed" },
                    { value: "retired", label: "Retired" },
                    { value: "student", label: "Student" },
                    { value: "freelance", label: "Freelance" },
                    { value: "other", label: "Other" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.employment_status || false}
                  onToggle={() => toggleDropdown("employment_status")}
                  dropdownRef={getDropdownRef("employment_status")}
                />
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
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry || ""}
                  onChange={(e) => updateFormData("industry", e.target.value)}
                  className="mobile-input"
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Income Range
                </label>
                <CustomDropdown
                  value={formData.income_range || ""}
                  onChange={(value) => updateFormData("income_range", value)}
                  options={[
                    { value: "under_30k", label: "Under $30,000" },
                    { value: "30k_50k", label: "$30,000 - $50,000" },
                    { value: "50k_75k", label: "$50,000 - $75,000" },
                    { value: "75k_100k", label: "$75,000 - $100,000" },
                    { value: "100k_150k", label: "$100,000 - $150,000" },
                    { value: "150k_plus", label: "$150,000+" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.income_range || false}
                  onToggle={() => toggleDropdown("income_range")}
                  dropdownRef={getDropdownRef("income_range")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Home Price Range
                </label>
                <CustomDropdown
                  value={formData.preferred_home_price_range || ""}
                  onChange={(value) =>
                    updateFormData("preferred_home_price_range", value)
                  }
                  options={[
                    { value: "under_200k", label: "Under $200,000" },
                    { value: "200k_400k", label: "$200,000 - $400,000" },
                    { value: "400k_600k", label: "$400,000 - $600,000" },
                    { value: "600k_800k", label: "$600,000 - $800,000" },
                    { value: "800k_1m", label: "$800,000 - $1,000,000" },
                    { value: "1m_plus", label: "$1,000,000+" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.preferred_home_price_range || false}
                  onToggle={() => toggleDropdown("preferred_home_price_range")}
                  dropdownRef={getDropdownRef("preferred_home_price_range")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Credit Score Range
                </label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Savings Amount Range
                </label>
                <CustomDropdown
                  value={formData.savings_amount_range || ""}
                  onChange={(value) =>
                    updateFormData("savings_amount_range", value)
                  }
                  options={[
                    { value: "under_10k", label: "Under $10,000" },
                    { value: "10k_25k", label: "$10,000 - $25,000" },
                    { value: "25k_50k", label: "$25,000 - $50,000" },
                    { value: "50k_100k", label: "$50,000 - $100,000" },
                    { value: "100k_plus", label: "$100,000+" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.savings_amount_range || false}
                  onToggle={() => toggleDropdown("savings_amount_range")}
                  dropdownRef={getDropdownRef("savings_amount_range")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Investment Experience
                </label>
                <CustomDropdown
                  value={formData.investment_experience || ""}
                  onChange={(value) =>
                    updateFormData("investment_experience", value)
                  }
                  options={[
                    { value: "none", label: "None" },
                    { value: "beginner", label: "Beginner" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "advanced", label: "Advanced" },
                    { value: "expert", label: "Expert" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.investment_experience || false}
                  onToggle={() => toggleDropdown("investment_experience")}
                  dropdownRef={getDropdownRef("investment_experience")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Risk Tolerance
                </label>
                <CustomDropdown
                  value={formData.risk_tolerance || ""}
                  onChange={(value) => updateFormData("risk_tolerance", value)}
                  options={[
                    { value: "very_low", label: "Very Low" },
                    { value: "low", label: "Low" },
                    { value: "moderate", label: "Moderate" },
                    { value: "high", label: "High" },
                    { value: "very_high", label: "Very High" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.risk_tolerance || false}
                  onToggle={() => toggleDropdown("risk_tolerance")}
                  dropdownRef={getDropdownRef("risk_tolerance")}
                />
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
                <CustomDropdown
                  value={formData.desired_housing_type || ""}
                  onChange={(value) =>
                    updateFormData("desired_housing_type", value)
                  }
                  options={[
                    { value: "single_family", label: "Single Family Home" },
                    { value: "condo", label: "Condominium" },
                    { value: "townhouse", label: "Townhouse" },
                    { value: "apartment", label: "Apartment" },
                    { value: "duplex", label: "Duplex" },
                    { value: "mobile_home", label: "Mobile Home" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.desired_housing_type || false}
                  onToggle={() => toggleDropdown("desired_housing_type")}
                  dropdownRef={getDropdownRef("desired_housing_type")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Bedrooms
                </label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Bathrooms
                </label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Lot Size
                </label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Home Age
                </label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Architectural Style
                </label>
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
                  isOpen={openDropdowns.preferred_architectural_style || false}
                  onToggle={() =>
                    toggleDropdown("preferred_architectural_style")
                  }
                  dropdownRef={getDropdownRef("preferred_architectural_style")}
                />
              </div>

              <div className="md:col-span-2">
                <TagInput
                  key="preferred_home_features"
                  field="preferred_home_features"
                  label="Preferred Home Features"
                  placeholder="Enter feature and click + to add (e.g., garage, pool, fireplace)"
                />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <TagInput
                  key="preferred_regions"
                  field="preferred_regions"
                  label="Preferred Regions"
                  placeholder="Enter state or region and click + to add (e.g., California, Texas, Florida)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Urban/Rural Preference
                </label>
                <CustomDropdown
                  value={formData.urban_rural_preference || ""}
                  onChange={(value) =>
                    updateFormData("urban_rural_preference", value)
                  }
                  options={[
                    { value: "urban", label: "Urban" },
                    { value: "suburban", label: "Suburban" },
                    { value: "rural", label: "Rural" },
                    { value: "mixed", label: "Mixed" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.urban_rural_preference || false}
                  onToggle={() => toggleDropdown("urban_rural_preference")}
                  dropdownRef={getDropdownRef("urban_rural_preference")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Commute Tolerance (minutes)
                </label>
                <input
                  type="number"
                  value={formData.commute_tolerance || ""}
                  onChange={(e) =>
                    updateFormData(
                      "commute_tolerance",
                      parseInt(e.target.value) || undefined
                    )
                  }
                  className="mobile-input"
                  min="0"
                  max="180"
                  placeholder="Maximum commute time"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Climate
                </label>
                <CustomDropdown
                  value={formData.preferred_climate || ""}
                  onChange={(value) =>
                    updateFormData("preferred_climate", value)
                  }
                  options={[
                    { value: "tropical", label: "Tropical" },
                    { value: "subtropical", label: "Subtropical" },
                    { value: "temperate", label: "Temperate" },
                    { value: "continental", label: "Continental" },
                    { value: "arid", label: "Arid" },
                    { value: "mediterranean", label: "Mediterranean" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.preferred_climate || false}
                  onToggle={() => toggleDropdown("preferred_climate")}
                  dropdownRef={getDropdownRef("preferred_climate")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Proximity to Family
                </label>
                <CustomDropdown
                  value={formData.proximity_to_family || ""}
                  onChange={(value) =>
                    updateFormData("proximity_to_family", value)
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
                  isOpen={openDropdowns.proximity_to_family || false}
                  onToggle={() => toggleDropdown("proximity_to_family")}
                  dropdownRef={getDropdownRef("proximity_to_family")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Walkability Importance
                </label>
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
              </div>
            </div>
          </div>
        );

      case "lifestyle":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Lifestyle Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Lifestyle Type
                </label>
                <CustomDropdown
                  value={formData.lifestyle_type || ""}
                  onChange={(value) => updateFormData("lifestyle_type", value)}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "quiet", label: "Quiet" },
                    { value: "social", label: "Social" },
                    { value: "family_oriented", label: "Family Oriented" },
                    { value: "career_focused", label: "Career Focused" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.lifestyle_type || false}
                  onToggle={() => toggleDropdown("lifestyle_type")}
                  dropdownRef={getDropdownRef("lifestyle_type")}
                />
              </div>

              <div className="md:col-span-2">
                <TagInput
                  key="hobbies_interests"
                  field="hobbies_interests"
                  label="Hobbies & Interests"
                  placeholder="Enter hobby or interest and click + to add (e.g., hiking, cooking, reading)"
                />
              </div>

              <div className="md:col-span-2">
                <TagInput
                  key="dining_preferences"
                  field="dining_preferences"
                  label="Dining Preferences"
                  placeholder="Enter dining preference and click + to add (e.g., Italian, Vegetarian, Fine dining)"
                />
              </div>

              <div className="md:col-span-2">
                <TagInput
                  key="fitness_activities"
                  field="fitness_activities"
                  label="Fitness Activities"
                  placeholder="Enter fitness activity and click + to add (e.g., Running, Yoga, Swimming)"
                />
              </div>
            </div>
          </div>
        );

      case "behavior":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Your Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Decision Making Style
                </label>
                <CustomDropdown
                  value={formData.decision_making_style || ""}
                  onChange={(value) =>
                    updateFormData("decision_making_style", value)
                  }
                  options={[
                    { value: "analytical", label: "Analytical" },
                    { value: "intuitive", label: "Intuitive" },
                    { value: "collaborative", label: "Collaborative" },
                    { value: "quick", label: "Quick" },
                    { value: "deliberate", label: "Deliberate" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.decision_making_style || false}
                  onToggle={() => toggleDropdown("decision_making_style")}
                  dropdownRef={getDropdownRef("decision_making_style")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Research Behavior
                </label>
                <CustomDropdown
                  value={formData.research_behavior || ""}
                  onChange={(value) =>
                    updateFormData("research_behavior", value)
                  }
                  options={[
                    { value: "minimal", label: "Minimal" },
                    { value: "moderate", label: "Moderate" },
                    { value: "extensive", label: "Extensive" },
                    { value: "obsessive", label: "Obsessive" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.research_behavior || false}
                  onToggle={() => toggleDropdown("research_behavior")}
                  dropdownRef={getDropdownRef("research_behavior")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Favored Information Style
                </label>
                <CustomDropdown
                  value={formData.favored_information_style || ""}
                  onChange={(value) =>
                    updateFormData("favored_information_style", value)
                  }
                  options={[
                    { value: "visual", label: "Visual" },
                    { value: "textual", label: "Textual" },
                    { value: "detailed", label: "Detailed" },
                    { value: "summary", label: "Summary" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.favored_information_style || false}
                  onToggle={() => toggleDropdown("favored_information_style")}
                  dropdownRef={getDropdownRef("favored_information_style")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Political Leaning
                </label>
                <CustomDropdown
                  value={formData.political_leaning || ""}
                  onChange={(value) =>
                    updateFormData("political_leaning", value)
                  }
                  options={[
                    { value: "conservative", label: "Conservative" },
                    { value: "liberal", label: "Liberal" },
                    { value: "moderate", label: "Moderate" },
                    { value: "independent", label: "Independent" },
                    { value: "prefer_not_to_say", label: "Prefer not to say" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.political_leaning || false}
                  onToggle={() => toggleDropdown("political_leaning")}
                  dropdownRef={getDropdownRef("political_leaning")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Community Involvement
                </label>
                <CustomDropdown
                  value={formData.community_involvement || ""}
                  onChange={(value) =>
                    updateFormData("community_involvement", value)
                  }
                  options={[
                    { value: "high", label: "High" },
                    { value: "moderate", label: "Moderate" },
                    { value: "low", label: "Low" },
                    { value: "none", label: "None" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.community_involvement || false}
                  onToggle={() => toggleDropdown("community_involvement")}
                  dropdownRef={getDropdownRef("community_involvement")}
                />
              </div>
            </div>
          </div>
        );

      case "realestate":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Real Estate Goals
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Property Search Stage
                </label>
                <CustomDropdown
                  value={formData.property_search_stage || ""}
                  onChange={(value) =>
                    updateFormData("property_search_stage", value)
                  }
                  options={[
                    { value: "not_looking", label: "Not Looking" },
                    { value: "browsing", label: "Browsing" },
                    {
                      value: "actively_searching",
                      label: "Actively Searching",
                    },
                    { value: "ready_to_buy", label: "Ready to Buy" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.property_search_stage || false}
                  onToggle={() => toggleDropdown("property_search_stage")}
                  dropdownRef={getDropdownRef("property_search_stage")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Home Buying Experience
                </label>
                <CustomDropdown
                  value={formData.home_buying_experience || ""}
                  onChange={(value) =>
                    updateFormData("home_buying_experience", value)
                  }
                  options={[
                    { value: "first_time", label: "First Time" },
                    { value: "experienced", label: "Experienced" },
                    { value: "investor", label: "Investor" },
                    {
                      value: "multiple_properties",
                      label: "Multiple Properties",
                    },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.home_buying_experience || false}
                  onToggle={() => toggleDropdown("home_buying_experience")}
                  dropdownRef={getDropdownRef("home_buying_experience")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Timeline to Purchase
                </label>
                <CustomDropdown
                  value={formData.timeline_to_purchase || ""}
                  onChange={(value) =>
                    updateFormData("timeline_to_purchase", value)
                  }
                  options={[
                    { value: "<3_months", label: "Less than 3 months" },
                    { value: "3-6_months", label: "3-6 months" },
                    { value: "6-12_months", label: "6-12 months" },
                    { value: ">1_year", label: "More than 1 year" },
                    { value: "not_sure", label: "Not sure" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.timeline_to_purchase || false}
                  onToggle={() => toggleDropdown("timeline_to_purchase")}
                  dropdownRef={getDropdownRef("timeline_to_purchase")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Financing Preference
                </label>
                <CustomDropdown
                  value={formData.financing_preference || ""}
                  onChange={(value) =>
                    updateFormData("financing_preference", value)
                  }
                  options={[
                    { value: "cash", label: "Cash" },
                    { value: "conventional", label: "Conventional Loan" },
                    { value: "fha", label: "FHA Loan" },
                    { value: "va", label: "VA Loan" },
                    { value: "usda", label: "USDA Loan" },
                    { value: "jumbo", label: "Jumbo Loan" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.financing_preference || false}
                  onToggle={() => toggleDropdown("financing_preference")}
                  dropdownRef={getDropdownRef("financing_preference")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Renovation Willingness
                </label>
                <CustomDropdown
                  value={formData.renovation_willingness || ""}
                  onChange={(value) =>
                    updateFormData("renovation_willingness", value)
                  }
                  options={[
                    { value: "none", label: "None - Move-in Ready" },
                    { value: "minor", label: "Minor Cosmetic Updates" },
                    { value: "major", label: "Major Renovations" },
                    { value: "complete", label: "Complete Renovation" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.renovation_willingness || false}
                  onToggle={() => toggleDropdown("renovation_willingness")}
                  dropdownRef={getDropdownRef("renovation_willingness")}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Current Home Ownership Status
                </label>
                <CustomDropdown
                  value={formData.current_home_ownership_status || ""}
                  onChange={(value) =>
                    updateFormData("current_home_ownership_status", value)
                  }
                  options={[
                    { value: "own", label: "Own Current Home" },
                    { value: "rent", label: "Rent Current Home" },
                    {
                      value: "living_with_family",
                      label: "Living with Family",
                    },
                    { value: "other", label: "Other" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.current_home_ownership_status || false}
                  onToggle={() =>
                    toggleDropdown("current_home_ownership_status")
                  }
                  dropdownRef={getDropdownRef("current_home_ownership_status")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Moving Reason
                </label>
                <CustomDropdown
                  value={formData.moving_reason || ""}
                  onChange={(value) => updateFormData("moving_reason", value)}
                  options={[
                    { value: "job", label: "Job/Career Change" },
                    { value: "family", label: "Family Changes" },
                    { value: "upgrade", label: "Upgrade Home" },
                    { value: "downsize", label: "Downsize" },
                    { value: "investment", label: "Investment Opportunity" },
                    { value: "lifestyle", label: "Lifestyle Change" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.moving_reason || false}
                  onToggle={() => toggleDropdown("moving_reason")}
                  dropdownRef={getDropdownRef("moving_reason")}
                />
              </div>

              <div className="md:col-span-2">
                <TagInput
                  key="property_features_priority"
                  field="property_features_priority"
                  label="Property Features Priority"
                  placeholder="Enter prioritized feature and click + to add (e.g., Updated kitchen, Large yard, Good schools)"
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
        );

      case "communication":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Communication Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Support Channel
                </label>
                <CustomDropdown
                  value={formData.preferred_support_channel || ""}
                  onChange={(value) =>
                    updateFormData("preferred_support_channel", value)
                  }
                  options={[
                    { value: "phone", label: "Phone" },
                    { value: "email", label: "Email" },
                    { value: "chat", label: "Chat" },
                    { value: "self_service", label: "Self Service" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.preferred_support_channel || false}
                  onToggle={() => toggleDropdown("preferred_support_channel")}
                  dropdownRef={getDropdownRef("preferred_support_channel")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Communication Preference
                </label>
                <CustomDropdown
                  value={formData.communication_preference || ""}
                  onChange={(value) =>
                    updateFormData("communication_preference", value)
                  }
                  options={[
                    { value: "frequent", label: "Frequent updates" },
                    { value: "milestone", label: "Milestone updates" },
                    { value: "minimal", label: "Minimal contact" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.communication_preference || false}
                  onToggle={() => toggleDropdown("communication_preference")}
                  dropdownRef={getDropdownRef("communication_preference")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Information Detail Level
                </label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Meeting Preference
                </label>
                <CustomDropdown
                  value={formData.meeting_preference || ""}
                  onChange={(value) =>
                    updateFormData("meeting_preference", value)
                  }
                  options={[
                    { value: "in_person", label: "In Person" },
                    { value: "virtual", label: "Virtual" },
                    { value: "phone", label: "Phone" },
                    { value: "email", label: "Email" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.meeting_preference || false}
                  onToggle={() => toggleDropdown("meeting_preference")}
                  dropdownRef={getDropdownRef("meeting_preference")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Meeting Availability
                </label>
                <CustomDropdown
                  value={formData.meeting_availability || ""}
                  onChange={(value) =>
                    updateFormData("meeting_availability", value)
                  }
                  options={[
                    { value: "weekdays", label: "Weekdays" },
                    { value: "evenings", label: "Evenings" },
                    { value: "weekends", label: "Weekends" },
                    { value: "flexible", label: "Flexible" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.meeting_availability || false}
                  onToggle={() => toggleDropdown("meeting_availability")}
                  dropdownRef={getDropdownRef("meeting_availability")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Response Time Expectation
                </label>
                <CustomDropdown
                  value={formData.response_time_expectation || ""}
                  onChange={(value) =>
                    updateFormData("response_time_expectation", value)
                  }
                  options={[
                    { value: "immediate", label: "Immediate" },
                    { value: "same_day", label: "Same Day" },
                    { value: "24_hours", label: "Within 24 Hours" },
                    { value: "flexible", label: "Flexible" },
                  ]}
                  placeholder="Select..."
                  isOpen={openDropdowns.response_time_expectation || false}
                  onToggle={() => toggleDropdown("response_time_expectation")}
                  dropdownRef={getDropdownRef("response_time_expectation")}
                />
              </div>
            </div>
          </div>
        );

      case "insights":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Personal Insights
            </h2>

            <div className="space-y-6">
              <TagInput
                key="quote_bubbles"
                field="quote_bubbles"
                label="What matters most to you in a home?"
                placeholder="Add important features (e.g., Natural light, Quiet neighborhood, Good schools)"
              />

              <TagInput
                key="deal_makers"
                field="deal_makers"
                label="What would seal the deal for you?"
                placeholder="Add deal makers (e.g., Perfect kitchen, Amazing view, Great price)"
              />

              <TagInput
                key="concerns_or_fears"
                field="concerns_or_fears"
                label="Any concerns or fears about buying?"
                placeholder="Add concerns (e.g., Hidden problems, Bad neighbors, Market crash)"
              />

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Additional Context
                </label>
                <textarea
                  value={formData.additional_context || ""}
                  onChange={(e) =>
                    updateFormData("additional_context", e.target.value)
                  }
                  className="mobile-input"
                  rows={4}
                  placeholder="Share any additional context, special requirements, or important details about your home buying journey..."
                />
              </div>
            </div>
          </div>
        );

      case "reportcustomization":
        if (loading) {
          return (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
                Report Customization
              </h2>
              <p className="text-gray-600">
                Loading report customization options...
              </p>
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
              <p className="text-gray-600">
                Loading report customization options...
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Report Customization
            </h2>
            <p className="text-gray-600 mb-6">
              Choose which sections to include in your property reports and drag
              to reorder them by priority. All sections are enabled by default,
              but you can customize them to focus on what matters most to you.
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
                    if (!section || !section.key || !section.label) return null;

                    const priorities = formData.report_section_priorities || [];
                    const priorityIndex = priorities.indexOf(section.key);
                    // Section is checked if it's in the priorities array
                    const isChecked = priorityIndex !== -1;
                    const priority = isChecked ? priorityIndex + 1 : undefined;

                    return (
                      <SortableReportSection
                        key={section.key}
                        id={section.key}
                        label={section.label}
                        checked={isChecked}
                        priority={priority}
                        onToggle={(checked) => {
                          // Only update priorities array (no boolean fields)
                          handleReportSectionToggle(section.key, checked);
                        }}
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

  // Self-contained NumberTagInput component
  const NumberTagInput = ({
    field,
    label,
    placeholder,
  }: {
    field: keyof OnboardingData;
    label: string;
    placeholder: string;
  }) => {
    const [draftValue, setDraftValue] = useState("");
    const currentTags = (formData[field] as number[]) || [];

    const handleAddNumberTag = (value: string) => {
      const numValue = parseInt(value.trim());
      if (isNaN(numValue)) return;
      const currentArray = (formData[field] as number[]) || [];
      if (!currentArray.includes(numValue)) {
        updateFormData(field, [...currentArray, numValue]);
      }
      setDraftValue("");
    };

    const handleRemoveNumberTag = (valueToRemove: number) => {
      const currentArray = (formData[field] as number[]) || [];
      updateFormData(
        field,
        currentArray.filter((item) => item !== valueToRemove)
      );
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddNumberTag(draftValue);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraftValue(e.target.value);
    };

    return (
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          {label}
        </label>
        <div className="flex space-x-2 mb-3">
          <input
            type="number"
            value={draftValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="mobile-input flex-1"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => handleAddNumberTag(draftValue)}
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
                  onClick={() => handleRemoveNumberTag(tag)}
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
  };

  return (
    <div className="max-w-7xl mx-auto mobile-padding">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-black mb-2">
            Welcome to SilverKey
          </h1>
          <p className="text-sm sm:text-base text-black/60">
            Information you give helps your agent and SilverKey serve you, but
            all fields are optional!
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="text-sm text-black/60">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mobile-card mb-6">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-hide">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center min-w-0">
                <button
                  onClick={() => goToStep(index)}
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 transition-colors hover:scale-105 transform transition-transform ${
                    isCompleted
                      ? "bg-olive text-white hover:bg-olive/80"
                      : isActive
                      ? "bg-brown text-white hover:bg-brown/80"
                      : "bg-beige text-black/60 hover:bg-beige/80"
                  }`}
                  title={step.title}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`ml-4 w-8 sm:w-16 h-1 flex-shrink-0 ${
                      isCompleted ? "bg-olive" : "bg-beige"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="mobile-card">
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0 mt-8 pt-6 border-t border-beige/30">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 touch-friendly ${
              currentStep === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-white border border-brown text-black hover:bg-brown hover:text-white"
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Previous
          </button>

          {currentStep === STEPS.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center justify-center px-6 py-3 bg-olive text-white rounded-lg hover:bg-olive/80 disabled:opacity-50 font-medium transition-all duration-200 touch-friendly"
            >
              {loading ? "Saving..." : "Complete Setup"}
              {!loading && <Check className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />}
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center justify-center px-6 py-3 bg-brown text-white rounded-lg hover:bg-brown/80 font-medium transition-all duration-200 touch-friendly"
            >
              Next
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
