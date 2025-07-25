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
  Heart,
  Brain,
  MessageSquare,
  Lightbulb,
  ChevronDown,
  Plus,
} from "lucide-react";
import { apiRequest } from "../lib/api";

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
  social_preferences?: string;
  entertainment_preferences?: string;
  shopping_preferences?: string;
  outdoor_activity_level?: string;
  travel_frequency?: string;
  pet_ownership?: string;
  health_wellness_priorities?: string;
  technology_adoption?: string;
  environmental_consciousness?: string;
  community_involvement?: string;
  work_life_balance?: string;
  future_family_plans?: string;
  retirement_timeline?: string;
  relocation_flexibility?: string;
  decision_making_style?: string;
  information_sources?: string;
  deal_breakers?: string[];
  must_have_features?: string;
  renovation_willingness?: string;
  move_in_timeline?: string;
  selling_current_home?: string;
  first_time_buyer?: string;
  previous_home_experience?: string;
  property_search_stage?: string;
  home_buying_experience?: string;
  financing_preference?: string;
  communication_preference?: string;
  preferred_support_channel?: string;
  information_detail_level?: string;
  meeting_preference?: string;
  meeting_availability?: string;
  response_time_expectation?: string;
  agent_experience_preference?: string;
  quote_bubbles?: string[];
  deal_makers?: string[];
  concerns_or_fears?: string[];
  additional_context?: string;
}

const STEPS = [
  { id: "demographics", title: "About You", icon: User },
  { id: "financial", title: "Financial Profile", icon: Building },
  { id: "housing", title: "Housing Preferences", icon: Home },
  { id: "location", title: "Location Preferences", icon: MapPin },
  { id: "lifestyle", title: "Lifestyle", icon: Heart },
  { id: "behavior", title: "Behavior & Preferences", icon: Brain },
  { id: "realestate", title: "Real Estate Experience", icon: Building },
  { id: "communication", title: "Communication", icon: MessageSquare },
  { id: "insights", title: "Personal Insights", icon: Lightbulb },
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

export default function PersonalizationPage() {
  const [activeSection, setActiveSection] = useState("demographics");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: boolean;
  }>({});

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

  useEffect(() => {
    loadUserPreferences();
  }, []);

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

  const loadUserPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("/api/v1/preferences", {
        method: "GET",
      });

      console.log("🔍 API Response:", response);
      console.log("🔍 Response.preferences:", response.preferences);

      if (response.preferences) {
        // Flatten the nested structure to match OnboardingData interface
        const flattenedData: OnboardingData = {
          // Demographics
          ...response.preferences.demographics,

          // Financial Profile
          ...response.preferences.financial_profile,

          // Housing Preferences
          ...response.preferences.housing_preferences,

          // Location Preferences
          ...response.preferences.location_preferences,

          // Lifestyle Preferences
          ...response.preferences.lifestyle_preferences,

          // Behavioral Patterns
          ...response.preferences.behavioral_patterns,

          // Real Estate
          ...response.preferences.real_estate,

          // Agent Preferences (Communication)
          ...response.preferences.agent_preferences,

          // Values
          ...response.preferences.values,

          // Emotional Signals
          ...response.preferences.emotional_signals,

          // Ensure specific fields are mapped correctly
          communication_preference:
            response.preferences.agent_preferences?.communication_preference ||
            response.preferences.communication_preference,
          previous_home_experience:
            response.preferences.real_estate?.previous_home_experience ||
            response.preferences.previous_home_experience,
          first_time_buyer:
            response.preferences.real_estate?.first_time_buyer ||
            response.preferences.first_time_buyer,
          response_time_expectation:
            response.preferences.agent_preferences?.response_time_expectation ||
            response.preferences.response_time_expectation,
          meeting_availability:
            response.preferences.agent_preferences?.meeting_availability ||
            response.preferences.meeting_availability,
          additional_context:
            response.preferences.personalization_insights?.additional_context ||
            response.preferences.additional_context,
        };

        console.log("✅ Flattened data:", flattenedData);
        setFormData(flattenedData);
        setOriginalData(flattenedData);
      } else {
        console.log("❌ No preferences found in response");
      }
    } catch (error) {
      console.error("Failed to load user preferences:", error);
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
      console.log("💾 Specific fields being saved:", {
        communication_preference: formData.communication_preference,
        previous_home_experience: formData.previous_home_experience,
        first_time_buyer: formData.first_time_buyer,
        response_time_expectation: formData.response_time_expectation,
        meeting_availability: formData.meeting_availability,
        additional_context: formData.additional_context,
      });

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

  // Utility function to format display values
  const formatDisplayValue = (value: string | number | undefined): string => {
    if (!value) return "";

    let formatted = String(value);

    // Handle ranges (keep hyphens for ranges like "100k-150k", "30-45")
    if (
      /\d+[kK]?[-–]\d+[kK]?/.test(formatted) ||
      /\d+[-–]\d+/.test(formatted)
    ) {
      // This is a range, keep the hyphen but ensure proper formatting
      formatted = formatted.replace(/[-–]/g, "-");
    } else {
      // Replace underscores and hyphens with spaces
      formatted = formatted.replace(/[_-]/g, " ");
    }

    // Capitalize each word
    formatted = formatted
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    return formatted;
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
        <label className="block text-sm font-medium text-black mb-2">{label}</label>
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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-black mb-2">
          {label}
        </label>
        {isEditMode ? (
          <>
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your preferences...</p>
        </div>
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
              Personal Information
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
                    className="mobile-input hover:border-brown focus:border-brown focus:ring-brown/20 cursor-pointer"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.age) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
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
                        value: "prefer-not-to-say",
                        label: "Prefer not to say",
                      },
                    ]}
                    placeholder="Select gender"
                    isOpen={openDropdowns.gender || false}
                    onToggle={() => toggleDropdown("gender")}
                    dropdownRef={getDropdownRef("gender")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.gender) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Marital Status
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.marital_status || ""}
                    onChange={(value) =>
                      updateFormData("marital_status", value)
                    }
                    options={[
                      { value: "single", label: "Single" },
                      { value: "married", label: "Married" },
                      { value: "divorced", label: "Divorced" },
                      { value: "widowed", label: "Widowed" },
                      {
                        value: "domestic-partnership",
                        label: "Domestic Partnership",
                      },
                    ]}
                    placeholder="Select status"
                    isOpen={openDropdowns.marital_status || false}
                    onToggle={() => toggleDropdown("marital_status")}
                    dropdownRef={getDropdownRef("marital_status")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.marital_status) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Household Size
                </label>
                {isEditMode ? (
                  <input
                    type="number"
                    value={formData.household_size || ""}
                    onChange={(e) =>
                      updateFormData(
                        "household_size",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    className="mobile-input hover:border-brown focus:border-brown focus:ring-brown/20 cursor-pointer"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.household_size) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Number of Children
                </label>
                {isEditMode ? (
                  <input
                    type="number"
                    value={formData.children_count || ""}
                    onChange={(e) =>
                      updateFormData(
                        "children_count",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    className="mobile-input hover:border-brown focus:border-brown focus:ring-brown/20 cursor-pointer"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.children_count) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              <NumberTagInput
                field="children_ages"
                label="Children's Ages"
                placeholder="Enter age and press Enter"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Education Level
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.education_level || ""}
                    onChange={(value) =>
                      updateFormData("education_level", value)
                    }
                    options={[
                      { value: "high-school", label: "High School" },
                      { value: "some-college", label: "Some College" },
                      { value: "bachelors", label: "Bachelor's Degree" },
                      { value: "masters", label: "Master's Degree" },
                      { value: "doctorate", label: "Doctorate" },
                      { value: "trade-school", label: "Trade School" },
                    ]}
                    placeholder="Select education level"
                    isOpen={openDropdowns.education_level || false}
                    onToggle={() => toggleDropdown("education_level")}
                    dropdownRef={getDropdownRef("education_level")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.education_level) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
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
                    className="mobile-input hover:border-brown focus:border-brown focus:ring-brown/20 cursor-pointer"
                    placeholder="Your occupation"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.occupation) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Industry
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={formData.industry || ""}
                  onChange={(e) => updateFormData("industry", e.target.value)}
                  className="mobile-input hover:border-brown focus:border-brown focus:ring-brown/20"
                  placeholder="Your industry"
                />
              ) : (
                <div className="p-3 bg-white rounded-md border border-gray-300">
                  {formatDisplayValue(formData.industry) || (
                    <span className="text-gray-500">Not specified</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case "financial":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Financial Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Employment Status
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.employment_status || ""}
                    onChange={(value) =>
                      updateFormData("employment_status", value)
                    }
                    options={[
                      { value: "full-time", label: "Full-time" },
                      { value: "part-time", label: "Part-time" },
                      { value: "self-employed", label: "Self-employed" },
                      { value: "unemployed", label: "Unemployed" },
                      { value: "retired", label: "Retired" },
                      { value: "student", label: "Student" },
                    ]}
                    placeholder="Select employment status"
                    isOpen={openDropdowns.employment_status || false}
                    onToggle={() => toggleDropdown("employment_status")}
                    dropdownRef={getDropdownRef("employment_status")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.employment_status) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Income Range
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.income_range || ""}
                    onChange={(value) => updateFormData("income_range", value)}
                    options={[
                      { value: "under_50k", label: "Under $50,000" },
                      { value: "50k_100k", label: "$50,000 - $100,000" },
                      { value: "100k_150k", label: "$100,000 - $150,000" },
                      { value: "150k_250k", label: "$150,000 - $250,000" },
                      { value: "250k_plus", label: "$250,000+" },
                    ]}
                    placeholder="Select income range"
                    isOpen={openDropdowns.income_range || false}
                    onToggle={() => toggleDropdown("income_range")}
                    dropdownRef={getDropdownRef("income_range")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.income_range) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Home Price Range
                </label>
                {isEditMode ? (
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
                    placeholder="Select price range"
                    isOpen={openDropdowns.preferred_home_price_range || false}
                    onToggle={() =>
                      toggleDropdown("preferred_home_price_range")
                    }
                    dropdownRef={getDropdownRef("preferred_home_price_range")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(
                      formData.preferred_home_price_range
                    ) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
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
                      { value: "excellent", label: "Excellent (800+)" },
                    ]}
                    placeholder="Select credit score range"
                    isOpen={openDropdowns.credit_score_range || false}
                    onToggle={() => toggleDropdown("credit_score_range")}
                    dropdownRef={getDropdownRef("credit_score_range")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.credit_score_range) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Savings Amount Range
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.savings_amount_range || ""}
                    onChange={(value) =>
                      updateFormData("savings_amount_range", value)
                    }
                    options={[
                      { value: "under_10k", label: "Under $10,000" },
                      { value: "10k_50k", label: "$10,000 - $50,000" },
                      { value: "50k_100k", label: "$50,000 - $100,000" },
                      { value: "100k_plus", label: "$100,000+" },
                    ]}
                    placeholder="Select savings range"
                    isOpen={openDropdowns.savings_amount_range || false}
                    onToggle={() => toggleDropdown("savings_amount_range")}
                    dropdownRef={getDropdownRef("savings_amount_range")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.savings_amount_range) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Investment Experience
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.investment_experience || ""}
                    onChange={(value) =>
                      updateFormData("investment_experience", value)
                    }
                    options={[
                      { value: "none", label: "No experience" },
                      { value: "beginner", label: "Beginner" },
                      { value: "intermediate", label: "Intermediate" },
                      { value: "advanced", label: "Advanced" },
                    ]}
                    placeholder="Select experience level"
                    isOpen={openDropdowns.investment_experience || false}
                    onToggle={() => toggleDropdown("investment_experience")}
                    dropdownRef={getDropdownRef("investment_experience")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.investment_experience) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Risk Tolerance
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.risk_tolerance || ""}
                    onChange={(value) =>
                      updateFormData("risk_tolerance", value)
                    }
                    options={[
                      { value: "conservative", label: "Conservative" },
                      { value: "moderate", label: "Moderate" },
                      { value: "aggressive", label: "Aggressive" },
                    ]}
                    placeholder="Select risk tolerance"
                    isOpen={openDropdowns.risk_tolerance || false}
                    onToggle={() => toggleDropdown("risk_tolerance")}
                    dropdownRef={getDropdownRef("risk_tolerance")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.risk_tolerance) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
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
                    value={formData.desired_housing_type || ""}
                    onChange={(value) =>
                      updateFormData("desired_housing_type", value)
                    }
                    options={[
                      { value: "house", label: "House" },
                      { value: "condo", label: "Condo" },
                      { value: "townhouse", label: "Townhouse" },
                      { value: "apartment", label: "Apartment" },
                    ]}
                    placeholder="Select property type"
                    isOpen={openDropdowns.desired_housing_type || false}
                    onToggle={() => toggleDropdown("desired_housing_type")}
                    dropdownRef={getDropdownRef("desired_housing_type")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.desired_housing_type) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
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
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="mobile-input hover:border-brown focus:border-brown focus:ring-brown/20 cursor-pointer"
                    min="1"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_bedrooms) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
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
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="mobile-input hover:border-brown focus:border-brown focus:ring-brown/20 cursor-pointer"
                    min="1"
                    step="0.5"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_bathrooms) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
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
                      { value: "extra_large", label: "Extra Large (1+ acres)" },
                    ]}
                    placeholder="Select lot size"
                    isOpen={openDropdowns.preferred_lot_size || false}
                    onToggle={() => toggleDropdown("preferred_lot_size")}
                    dropdownRef={getDropdownRef("preferred_lot_size")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_lot_size) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
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
                      { value: "new", label: "New Construction (0-5 years)" },
                      { value: "recent", label: "Recent (5-15 years)" },
                      {
                        value: "established",
                        label: "Established (15-30 years)",
                      },
                      { value: "mature", label: "Mature (30+ years)" },
                      { value: "historic", label: "Historic (50+ years)" },
                    ]}
                    placeholder="Select home age preference"
                    isOpen={openDropdowns.preferred_home_age || false}
                    onToggle={() => toggleDropdown("preferred_home_age")}
                    dropdownRef={getDropdownRef("preferred_home_age")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_home_age) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
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
                    placeholder="Select architectural style"
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
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(
                      formData.preferred_architectural_style
                    ) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Preferred Home Features
              </label>
              <TagInput
                field="preferred_home_features"
                label=""
                placeholder="Add features like 'garage', 'pool', 'garden'..."
              />
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
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Climate
                </label>
                {isEditMode ? (
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
                      { value: "arid", label: "Arid/Desert" },
                      { value: "mediterranean", label: "Mediterranean" },
                    ]}
                    placeholder="Select climate preference"
                    isOpen={openDropdowns.preferred_climate || false}
                    onToggle={() => toggleDropdown("preferred_climate")}
                    dropdownRef={getDropdownRef("preferred_climate")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_climate) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Urban/Rural Preference
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.urban_rural_preference || ""}
                    onChange={(value) =>
                      updateFormData("urban_rural_preference", value)
                    }
                    options={[
                      { value: "urban", label: "Urban" },
                      { value: "suburban", label: "Suburban" },
                      { value: "rural", label: "Rural" },
                      { value: "mixed", label: "Mixed/Flexible" },
                    ]}
                    placeholder="Select preference"
                    isOpen={openDropdowns.urban_rural_preference || false}
                    onToggle={() => toggleDropdown("urban_rural_preference")}
                    dropdownRef={getDropdownRef("urban_rural_preference")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.urban_rural_preference) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Commute Tolerance
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.commute_tolerance?.toString() || ""}
                    onChange={(value) =>
                      updateFormData("commute_tolerance", value)
                    }
                    options={[
                      { value: "under_15", label: "Under 15 minutes" },
                      { value: "15_30", label: "15-30 minutes" },
                      { value: "30_45", label: "30-45 minutes" },
                      { value: "45_60", label: "45-60 minutes" },
                      { value: "over_60", label: "Over 60 minutes" },
                    ]}
                    placeholder="Select commute tolerance"
                    isOpen={openDropdowns.commute_tolerance || false}
                    onToggle={() => toggleDropdown("commute_tolerance")}
                    dropdownRef={getDropdownRef("commute_tolerance")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.commute_tolerance) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Proximity to Family
                </label>
                {isEditMode ? (
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
                    placeholder="Select importance"
                    isOpen={openDropdowns.proximity_to_family || false}
                    onToggle={() => toggleDropdown("proximity_to_family")}
                    dropdownRef={getDropdownRef("proximity_to_family")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.proximity_to_family) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
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
                    placeholder="Select importance"
                    isOpen={openDropdowns.walkability_importance || false}
                    onToggle={() => toggleDropdown("walkability_importance")}
                    dropdownRef={getDropdownRef("walkability_importance")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.walkability_importance) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Preferred Regions
              </label>
              <TagInput
                field="preferred_regions"
                label=""
                placeholder="Add regions or neighborhoods..."
              />
            </div>
          </div>
        );

      case "lifestyle":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Lifestyle
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Lifestyle Type
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.lifestyle_type || ""}
                    onChange={(value) =>
                      updateFormData("lifestyle_type", value)
                    }
                    options={[
                      { value: "active", label: "Active/Outdoorsy" },
                      { value: "social", label: "Social/Entertaining" },
                      { value: "quiet", label: "Quiet/Private" },
                      { value: "family_oriented", label: "Family-Oriented" },
                      { value: "career_focused", label: "Career-Focused" },
                      { value: "creative", label: "Creative/Artistic" },
                      { value: "minimalist", label: "Minimalist" },
                    ]}
                    placeholder="Select lifestyle type"
                    isOpen={openDropdowns.lifestyle_type || false}
                    onToggle={() => toggleDropdown("lifestyle_type")}
                    dropdownRef={getDropdownRef("lifestyle_type")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.lifestyle_type) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Hobbies & Interests
              </label>
              <TagInput
                field="hobbies_interests"
                label=""
                placeholder="Add hobbies and interests..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Dining Preferences
              </label>
              <TagInput
                field="dining_preferences"
                label=""
                placeholder="Add cuisine types, dietary restrictions..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Fitness Activities
              </label>
              <TagInput
                field="fitness_activities"
                label=""
                placeholder="Add fitness activities and sports..."
              />
            </div>
          </div>
        );

      case "behavior":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Behavior & Preferences
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Decision Making Style
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.decision_making_style || ""}
                    onChange={(value) =>
                      updateFormData("decision_making_style", value)
                    }
                    options={[
                      { value: "quick", label: "Quick decision maker" },
                      { value: "thorough", label: "Thorough researcher" },
                      { value: "collaborative", label: "Collaborative" },
                    ]}
                    placeholder="Select style"
                    isOpen={openDropdowns.decision_making_style || false}
                    onToggle={() => toggleDropdown("decision_making_style")}
                    dropdownRef={getDropdownRef("decision_making_style")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.decision_making_style) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Communication Preference
                </label>
                {isEditMode ? (
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
                    placeholder="Select style"
                    isOpen={openDropdowns.communication_preference || false}
                    onToggle={() => toggleDropdown("communication_preference")}
                    dropdownRef={getDropdownRef("communication_preference")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.communication_preference) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "realestate":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Real Estate Experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Property Search Stage
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.property_search_stage || ""}
                    onChange={(value) =>
                      updateFormData("property_search_stage", value)
                    }
                    options={[
                      { value: "just_looking", label: "Just Looking" },
                      {
                        value: "actively_searching",
                        label: "Actively Searching",
                      },
                      { value: "ready_to_buy", label: "Ready to Buy" },
                      { value: "under_contract", label: "Under Contract" },
                    ]}
                    placeholder="Select stage"
                    isOpen={openDropdowns.property_search_stage || false}
                    onToggle={() => toggleDropdown("property_search_stage")}
                    dropdownRef={getDropdownRef("property_search_stage")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.property_search_stage) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Home Buying Experience
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.home_buying_experience || ""}
                    onChange={(value) =>
                      updateFormData("home_buying_experience", value)
                    }
                    options={[
                      { value: "first_time", label: "First Time Buyer" },
                      { value: "experienced", label: "Experienced Buyer" },
                      { value: "investor", label: "Real Estate Investor" },
                    ]}
                    placeholder="Select experience"
                    isOpen={openDropdowns.home_buying_experience || false}
                    onToggle={() => toggleDropdown("home_buying_experience")}
                    dropdownRef={getDropdownRef("home_buying_experience")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.home_buying_experience) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Financing Preference
                </label>
                {isEditMode ? (
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
                    placeholder="Select financing"
                    isOpen={openDropdowns.financing_preference || false}
                    onToggle={() => toggleDropdown("financing_preference")}
                    dropdownRef={getDropdownRef("financing_preference")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.financing_preference) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Renovation Willingness
                </label>
                {isEditMode ? (
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
                    placeholder="Select willingness"
                    isOpen={openDropdowns.renovation_willingness || false}
                    onToggle={() => toggleDropdown("renovation_willingness")}
                    dropdownRef={getDropdownRef("renovation_willingness")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.renovation_willingness) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Deal Breakers
              </label>
              <TagInput
                field="deal_breakers"
                label=""
                placeholder="Add deal breakers..."
              />
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
                  Meeting Availability
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.meeting_availability || ""}
                    onChange={(value) =>
                      updateFormData("meeting_availability", value)
                    }
                    options={[
                      { value: "weekdays", label: "Weekdays" },
                      { value: "weekends", label: "Weekends" },
                      { value: "evenings", label: "Evenings" },
                      { value: "flexible", label: "Flexible" },
                    ]}
                    placeholder="Select method"
                    isOpen={openDropdowns.meeting_availability || false}
                    onToggle={() => toggleDropdown("meeting_availability")}
                    dropdownRef={getDropdownRef("meeting_availability")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.meeting_availability) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Response Time Expectation
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.response_time_expectation || ""}
                    onChange={(value) =>
                      updateFormData("response_time_expectation", value)
                    }
                    options={[
                      { value: "immediate", label: "Immediate (within hours)" },
                      { value: "same_day", label: "Same day" },
                      { value: "next_day", label: "Next business day" },
                      { value: "flexible", label: "Flexible" },
                    ]}
                    placeholder="Select expectation"
                    isOpen={openDropdowns.response_time_expectation || false}
                    onToggle={() => toggleDropdown("response_time_expectation")}
                    dropdownRef={getDropdownRef("response_time_expectation")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.response_time_expectation) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Support Channel
                </label>
                {isEditMode ? (
                  <CustomDropdown
                    value={formData.preferred_support_channel || ""}
                    onChange={(value) =>
                      updateFormData("preferred_support_channel", value)
                    }
                    options={[
                      { value: "phone", label: "Phone" },
                      { value: "email", label: "Email" },
                      { value: "text", label: "Text/SMS" },
                      { value: "app", label: "Mobile App" },
                    ]}
                    placeholder="Select channel"
                    isOpen={openDropdowns.preferred_support_channel || false}
                    onToggle={() => toggleDropdown("preferred_support_channel")}
                    dropdownRef={getDropdownRef("preferred_support_channel")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_support_channel) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

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
                    placeholder="Select detail level"
                    isOpen={openDropdowns.information_detail_level || false}
                    onToggle={() => toggleDropdown("information_detail_level")}
                    dropdownRef={getDropdownRef("information_detail_level")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.information_detail_level) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Meeting Preference
                </label>
                {isEditMode ? (
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
                    placeholder="Select preference"
                    isOpen={openDropdowns.meeting_preference || false}
                    onToggle={() => toggleDropdown("meeting_preference")}
                    dropdownRef={getDropdownRef("meeting_preference")}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.meeting_preference) || (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                )}
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
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Quote Bubbles
              </label>
              <TagInput
                field="quote_bubbles"
                label=""
                placeholder="Add meaningful quotes or phrases..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Deal Makers
              </label>
              <TagInput
                field="deal_makers"
                label=""
                placeholder="Add what would make a deal perfect..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Concerns or Fears
              </label>
              <TagInput
                field="concerns_or_fears"
                label=""
                placeholder="Add any concerns about the process..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Additional Context
              </label>
              {isEditMode ? (
                <textarea
                  value={formData.additional_context || ""}
                  onChange={(e) =>
                    updateFormData("additional_context", e.target.value)
                  }
                  className="mobile-input hover:border-brown focus:border-brown focus:ring-brown/20"
                  rows={4}
                  placeholder="Any additional information you'd like to share..."
                />
              ) : (
                <div className="p-3 bg-white rounded-md border border-gray-300 min-h-[100px]">
                  {formatDisplayValue(formData.additional_context) || (
                    <span className="text-gray-500">Not specified</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">This section is under development.</p>
            <p className="text-sm text-gray-500 mt-2">
              Please check back later or contact support.
            </p>
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
            <h1 className="text-2xl sm:text-3xl font-serif text-black">
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
