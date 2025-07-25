import React, { useState, useEffect } from "react";
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
  social_preferences?: string;
  entertainment_preferences?: string;
  dining_preferences?: string;
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

export default function PersonalizationPage() {
  const [activeSection, setActiveSection] = useState("demographics");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

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
          communication_preference: response.preferences.agent_preferences?.communication_preference || response.preferences.communication_preference,
          previous_home_experience: response.preferences.real_estate?.previous_home_experience || response.preferences.previous_home_experience,
          first_time_buyer: response.preferences.real_estate?.first_time_buyer || response.preferences.first_time_buyer,
          response_time_expectation: response.preferences.agent_preferences?.response_time_expectation || response.preferences.response_time_expectation,
          meeting_availability: response.preferences.agent_preferences?.meeting_availability || response.preferences.meeting_availability,
          additional_context: response.preferences.personalization_insights?.additional_context || response.preferences.additional_context,
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
    if (/\d+[kK]?[-–]\d+[kK]?/.test(formatted) || /\d+[-–]\d+/.test(formatted)) {
      // This is a range, keep the hyphen but ensure proper formatting
      formatted = formatted.replace(/[-–]/g, "-");
    } else {
      // Replace underscores and hyphens with spaces
      formatted = formatted.replace(/[_-]/g, " ");
    }
    
    // Capitalize each word
    formatted = formatted.split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const currentInputValue = onChange && value !== undefined ? value : inputValue;
      if (e.key === "Enter" && currentInputValue.trim()) {
        e.preventDefault();
        const currentArray = (formData[field] as string[]) || [];
        const newArray = [...currentArray, currentInputValue.trim()];
        updateFormData(field, newArray);

        if (onChange) {
          onChange("");
        } else {
          setInputValue("");
        }
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
        <label className="block text-black font-medium">{label}</label>
        {isEditMode ? (
          <>
            <input
              type="text"
              value={onChange && value !== undefined ? value : inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="mobile-input mb-3"
            />
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
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
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
    const [inputValue, setInputValue] = useState("");

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        const num = parseInt(inputValue.trim());
        if (!isNaN(num)) {
          const currentArray = (formData[field] as number[]) || [];
          const newArray = [...currentArray, num];
          updateFormData(field, newArray);
          setInputValue("");
        }
      }
    };

    const removeTag = (indexToRemove: number) => {
      const currentArray = (formData[field] as number[]) || [];
      const newArray = currentArray.filter(
        (_, index) => index !== indexToRemove
      );
      updateFormData(field, newArray);
    };

    const currentTags = (formData[field] as number[]) || [];

    return (
      <div className="space-y-2">
        <label className="block text-black font-medium">{label}</label>
        {isEditMode ? (
          <>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="mobile-input mb-3"
            />
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
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
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
                    className="mobile-input"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.age) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Gender
                </label>
                {isEditMode ? (
                  <select
                    value={formData.gender || ""}
                    onChange={(e) => updateFormData("gender", e.target.value)}
                    className="mobile-input"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.gender) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Marital Status
                </label>
                {isEditMode ? (
                  <select
                    value={formData.marital_status || ""}
                    onChange={(e) =>
                      updateFormData("marital_status", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="domestic-partnership">
                      Domestic Partnership
                    </option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.marital_status) || <span className="text-gray-500">Not specified</span>}
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
                    className="mobile-input"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.household_size) || <span className="text-gray-500">Not specified</span>}
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
                    className="mobile-input"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.children_count) || <span className="text-gray-500">Not specified</span>}
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
                  <select
                    value={formData.education_level || ""}
                    onChange={(e) =>
                      updateFormData("education_level", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select education level</option>
                    <option value="high-school">High School</option>
                    <option value="some-college">Some College</option>
                    <option value="bachelors">Bachelor's Degree</option>
                    <option value="masters">Master's Degree</option>
                    <option value="doctorate">Doctorate</option>
                    <option value="trade-school">Trade School</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.education_level) || <span className="text-gray-500">Not specified</span>}
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
                    placeholder="Your occupation"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.occupation) || <span className="text-gray-500">Not specified</span>}
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
                  className="mobile-input"
                  placeholder="Your industry"
                />
              ) : (
                <div className="p-3 bg-white rounded-md border border-gray-300">
                  {formatDisplayValue(formData.industry) || <span className="text-gray-500">Not specified</span>}
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
                  <select
                    value={formData.employment_status || ""}
                    onChange={(e) =>
                      updateFormData("employment_status", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select employment status</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="self-employed">Self-employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="retired">Retired</option>
                    <option value="student">Student</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.employment_status) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Income Range
                </label>
                {isEditMode ? (
                  <select
                    value={formData.income_range || ""}
                    onChange={(e) =>
                      updateFormData("income_range", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select income range</option>
                    <option value="under_50k">Under $50,000</option>
                    <option value="50k_100k">$50,000 - $100,000</option>
                    <option value="100k_150k">$100,000 - $150,000</option>
                    <option value="150k_250k">$150,000 - $250,000</option>
                    <option value="250k_plus">$250,000+</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.income_range) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Home Price Range
                </label>
                {isEditMode ? (
                  <select
                    value={formData.preferred_home_price_range || ""}
                    onChange={(e) =>
                      updateFormData("preferred_home_price_range", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select price range</option>
                    <option value="under_200k">Under $200,000</option>
                    <option value="200k_400k">$200,000 - $400,000</option>
                    <option value="400k_600k">$400,000 - $600,000</option>
                    <option value="600k_800k">$600,000 - $800,000</option>
                    <option value="800k_1m">$800,000 - $1,000,000</option>
                    <option value="1m_plus">$1,000,000+</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_home_price_range) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Credit Score Range
                </label>
                {isEditMode ? (
                  <select
                    value={formData.credit_score_range || ""}
                    onChange={(e) =>
                      updateFormData("credit_score_range", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select credit score range</option>
                    <option value="poor">Poor (300-579)</option>
                    <option value="fair">Fair (580-669)</option>
                    <option value="good">Good (670-739)</option>
                    <option value="very_good">Very Good (740-799)</option>
                    <option value="excellent">Excellent (800+)</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.credit_score_range) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Savings Amount Range
                </label>
                {isEditMode ? (
                  <select
                    value={formData.savings_amount_range || ""}
                    onChange={(e) =>
                      updateFormData("savings_amount_range", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select savings range</option>
                    <option value="under_10k">Under $10,000</option>
                    <option value="10k_50k">$10,000 - $50,000</option>
                    <option value="50k_100k">$50,000 - $100,000</option>
                    <option value="100k_plus">$100,000+</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.savings_amount_range) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Investment Experience
                </label>
                {isEditMode ? (
                  <select
                    value={formData.investment_experience || ""}
                    onChange={(e) =>
                      updateFormData("investment_experience", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select experience level</option>
                    <option value="none">No experience</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.investment_experience) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Risk Tolerance
                </label>
                {isEditMode ? (
                  <select
                    value={formData.risk_tolerance || ""}
                    onChange={(e) =>
                      updateFormData("risk_tolerance", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select risk tolerance</option>
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.risk_tolerance) || <span className="text-gray-500">Not specified</span>}
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
                  <select
                    value={formData.desired_housing_type || ""}
                    onChange={(e) =>
                      updateFormData("desired_housing_type", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select property type</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="apartment">Apartment</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.desired_housing_type) || <span className="text-gray-500">Not specified</span>}
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
                    className="mobile-input"
                    min="1"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_bedrooms) || <span className="text-gray-500">Not specified</span>}
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
                    className="mobile-input"
                    min="1"
                    step="0.5"
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_bathrooms) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Lot Size
                </label>
                {isEditMode ? (
                  <select
                    value={formData.preferred_lot_size || ""}
                    onChange={(e) =>
                      updateFormData("preferred_lot_size", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select lot size</option>
                    <option value="small">Small (under 0.25 acres)</option>
                    <option value="medium">Medium (0.25 - 0.5 acres)</option>
                    <option value="large">Large (0.5 - 1 acre)</option>
                    <option value="extra_large">Extra Large (1+ acres)</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_lot_size) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Home Age
                </label>
                {isEditMode ? (
                  <select
                    value={formData.preferred_home_age || ""}
                    onChange={(e) =>
                      updateFormData("preferred_home_age", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select home age preference</option>
                    <option value="new">New Construction (0-5 years)</option>
                    <option value="recent">Recent (5-15 years)</option>
                    <option value="established">Established (15-30 years)</option>
                    <option value="mature">Mature (30+ years)</option>
                    <option value="historic">Historic (50+ years)</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_home_age) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Architectural Style
                </label>
                {isEditMode ? (
                  <select
                    value={formData.preferred_architectural_style || ""}
                    onChange={(e) =>
                      updateFormData("preferred_architectural_style", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select architectural style</option>
                    <option value="modern">Modern</option>
                    <option value="traditional">Traditional</option>
                    <option value="colonial">Colonial</option>
                    <option value="ranch">Ranch</option>
                    <option value="craftsman">Craftsman</option>
                    <option value="victorian">Victorian</option>
                    <option value="mediterranean">Mediterranean</option>
                    <option value="contemporary">Contemporary</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_architectural_style) || <span className="text-gray-500">Not specified</span>}
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
                  <select
                    value={formData.preferred_climate || ""}
                    onChange={(e) =>
                      updateFormData("preferred_climate", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select climate preference</option>
                    <option value="tropical">Tropical</option>
                    <option value="subtropical">Subtropical</option>
                    <option value="temperate">Temperate</option>
                    <option value="continental">Continental</option>
                    <option value="arid">Arid/Desert</option>
                    <option value="mediterranean">Mediterranean</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_climate) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Urban/Rural Preference
                </label>
                {isEditMode ? (
                  <select
                    value={formData.urban_rural_preference || ""}
                    onChange={(e) =>
                      updateFormData("urban_rural_preference", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select preference</option>
                    <option value="urban">Urban</option>
                    <option value="suburban">Suburban</option>
                    <option value="rural">Rural</option>
                    <option value="mixed">Mixed/Flexible</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.urban_rural_preference) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Commute Tolerance
                </label>
                {isEditMode ? (
                  <select
                    value={formData.commute_tolerance || ""}
                    onChange={(e) =>
                      updateFormData("commute_tolerance", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select commute tolerance</option>
                    <option value="under_15">Under 15 minutes</option>
                    <option value="15_30">15-30 minutes</option>
                    <option value="30_45">30-45 minutes</option>
                    <option value="45_60">45-60 minutes</option>
                    <option value="over_60">Over 60 minutes</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.commute_tolerance) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Proximity to Family
                </label>
                {isEditMode ? (
                  <select
                    value={formData.proximity_to_family || ""}
                    onChange={(e) =>
                      updateFormData("proximity_to_family", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select importance</option>
                    <option value="very_important">Very Important</option>
                    <option value="somewhat_important">Somewhat Important</option>
                    <option value="not_important">Not Important</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.proximity_to_family) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Walkability Importance
                </label>
                {isEditMode ? (
                  <select
                    value={formData.walkability_importance || ""}
                    onChange={(e) =>
                      updateFormData("walkability_importance", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select importance</option>
                    <option value="very_important">Very Important</option>
                    <option value="somewhat_important">Somewhat Important</option>
                    <option value="not_important">Not Important</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.walkability_importance) || <span className="text-gray-500">Not specified</span>}
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
                  <select
                    value={formData.lifestyle_type || ""}
                    onChange={(e) =>
                      updateFormData("lifestyle_type", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select lifestyle type</option>
                    <option value="active">Active/Outdoorsy</option>
                    <option value="social">Social/Entertaining</option>
                    <option value="quiet">Quiet/Private</option>
                    <option value="family_oriented">Family-Oriented</option>
                    <option value="career_focused">Career-Focused</option>
                    <option value="creative">Creative/Artistic</option>
                    <option value="minimalist">Minimalist</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.lifestyle_type) || <span className="text-gray-500">Not specified</span>}
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
                  <select
                    value={formData.decision_making_style || ""}
                    onChange={(e) =>
                      updateFormData("decision_making_style", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select style</option>
                    <option value="quick">Quick decision maker</option>
                    <option value="thorough">Thorough researcher</option>
                    <option value="collaborative">Collaborative</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.decision_making_style) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Communication Preference
                </label>
                {isEditMode ? (
                  <select
                    value={formData.communication_preference || ""}
                    onChange={(e) =>
                      updateFormData("communication_preference", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select style</option>
                    <option value="frequent">Frequent updates</option>
                    <option value="milestone">Milestone updates</option>
                    <option value="minimal">Minimal contact</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.communication_preference) || <span className="text-gray-500">Not specified</span>}
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
                  <select
                    value={formData.property_search_stage || ""}
                    onChange={(e) =>
                      updateFormData("property_search_stage", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select stage</option>
                    <option value="just_looking">Just Looking</option>
                    <option value="actively_searching">Actively Searching</option>
                    <option value="ready_to_buy">Ready to Buy</option>
                    <option value="under_contract">Under Contract</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.property_search_stage) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Home Buying Experience
                </label>
                {isEditMode ? (
                  <select
                    value={formData.home_buying_experience || ""}
                    onChange={(e) =>
                      updateFormData("home_buying_experience", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select experience</option>
                    <option value="first_time">First Time Buyer</option>
                    <option value="experienced">Experienced Buyer</option>
                    <option value="investor">Real Estate Investor</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.home_buying_experience) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Financing Preference
                </label>
                {isEditMode ? (
                  <select
                    value={formData.financing_preference || ""}
                    onChange={(e) =>
                      updateFormData("financing_preference", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select financing</option>
                    <option value="cash">Cash</option>
                    <option value="conventional">Conventional Loan</option>
                    <option value="fha">FHA Loan</option>
                    <option value="va">VA Loan</option>
                    <option value="usda">USDA Loan</option>
                    <option value="jumbo">Jumbo Loan</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.financing_preference) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Renovation Willingness
                </label>
                {isEditMode ? (
                  <select
                    value={formData.renovation_willingness || ""}
                    onChange={(e) =>
                      updateFormData("renovation_willingness", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select willingness</option>
                    <option value="none">None - Move-in Ready</option>
                    <option value="minor">Minor Cosmetic Updates</option>
                    <option value="major">Major Renovations</option>
                    <option value="complete">Complete Renovation</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.renovation_willingness) || <span className="text-gray-500">Not specified</span>}
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
                  <select
                    value={formData.meeting_availability || ""}
                    onChange={(e) =>
                      updateFormData("meeting_availability", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select method</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekends">Weekends</option>
                    <option value="evenings">Evenings</option>
                    <option value="flexible">Flexible</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.meeting_availability) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Response Time Expectation
                </label>
                {isEditMode ? (
                  <select
                    value={formData.response_time_expectation || ""}
                    onChange={(e) =>
                      updateFormData(
                        "response_time_expectation",
                        e.target.value
                      )
                    }
                    className="mobile-input"
                  >
                    <option value="">Select expectation</option>
                    <option value="immediate">Immediate (within hours)</option>
                    <option value="same_day">Same day</option>
                    <option value="next_day">Next business day</option>
                    <option value="flexible">Flexible</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.response_time_expectation) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Support Channel
                </label>
                {isEditMode ? (
                  <select
                    value={formData.preferred_support_channel || ""}
                    onChange={(e) =>
                      updateFormData("preferred_support_channel", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select channel</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="text">Text/SMS</option>
                    <option value="app">Mobile App</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.preferred_support_channel) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Information Detail Level
                </label>
                {isEditMode ? (
                  <select
                    value={formData.information_detail_level || ""}
                    onChange={(e) =>
                      updateFormData("information_detail_level", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select detail level</option>
                    <option value="brief">Brief</option>
                    <option value="moderate">Moderate</option>
                    <option value="detailed">Detailed</option>
                    <option value="comprehensive">Comprehensive</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.information_detail_level) || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Meeting Preference
                </label>
                {isEditMode ? (
                  <select
                    value={formData.meeting_preference || ""}
                    onChange={(e) =>
                      updateFormData("meeting_preference", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select preference</option>
                    <option value="in_person">In Person</option>
                    <option value="virtual">Virtual</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                  </select>
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-300">
                    {formatDisplayValue(formData.meeting_preference) || <span className="text-gray-500">Not specified</span>}
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
                  className="mobile-input"
                  rows={4}
                  placeholder="Any additional information you'd like to share..."
                />
              ) : (
                <div className="p-3 bg-white rounded-md border border-gray-300 min-h-[100px]">
                  {formatDisplayValue(formData.additional_context) || <span className="text-gray-500">Not specified</span>}
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
      {showSuccessDialog && createPortal(
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
                    <p className="text-sm text-gray-500">Preferences updated successfully!</p>
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
