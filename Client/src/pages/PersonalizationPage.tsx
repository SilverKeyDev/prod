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
  communication_preference?: string;
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
  const [draftTextInputs, setDraftTextInputs] = useState<
    Record<string, string>
  >({});
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

      if (response.preferences) {
        setFormData(response.preferences);
        setOriginalData(response.preferences);
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
    setDraftTextInputs({});
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
    const inputValue =
      value !== undefined ? value : draftTextInputs[field] || "";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (onChange) {
        onChange(newValue);
      } else {
        setDraftTextInputs((prev) => ({ ...prev, [field]: newValue }));
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        const currentArray = (formData[field] as string[]) || [];
        const newArray = [...currentArray, inputValue.trim()];
        updateFormData(field, newArray);

        if (onChange) {
          onChange("");
        } else {
          setDraftTextInputs((prev) => ({ ...prev, [field]: "" }));
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
            <div className="flex flex-wrap gap-2 mb-2">
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
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="mobile-input"
            />
          </>
        ) : (
          <div className="p-3 bg-gray-50 rounded-md border border-gray-200 min-h-[48px]">
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
            <div className="flex flex-wrap gap-2 mb-2">
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
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="mobile-input"
            />
          </>
        ) : (
          <div className="p-3 bg-gray-50 rounded-md border border-gray-200 min-h-[48px]">
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.age || <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.gender || <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.marital_status || <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.household_size || <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.children_count || <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.education_level || <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.occupation || <span className="text-gray-500">Not specified</span>}
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
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  {formData.industry || <span className="text-gray-500">Not specified</span>}
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
                    <option value="">Select income range</option>
                    <option value="poor">Poor (300-579)</option>
                    <option value="fair">Fair (580-669)</option>
                    <option value="good">Good (670-739)</option>
                    <option value="very_good">Very Good (740-799)</option>
                    <option value="excellent">Excellent (800+)</option>
                  </select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.credit_score_range || <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.savings_amount_range || <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.desired_housing_type || <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.preferred_bedrooms || <span className="text-gray-500">Not specified</span>}
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
                  </select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.marital_status || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Children Ages
                </label>
                {isEditMode ? (
                  <NumberTagInput
                    field="children_ages"
                    label=""
                    placeholder="Enter child age and press Enter"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.children_ages?.length
                      ? formData.children_ages.join(", ")
                      : <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.decision_making_style || <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.communication_preference || <span className="text-gray-500">Not specified</span>}
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
                  First Time Buyer
                </label>
                {isEditMode ? (
                  <select
                    value={formData.first_time_buyer || ""}
                    onChange={(e) =>
                      updateFormData("first_time_buyer", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.first_time_buyer || <span className="text-gray-500">Not specified</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Previous Home Experience
                </label>
                {isEditMode ? (
                  <select
                    value={formData.previous_home_experience || ""}
                    onChange={(e) =>
                      updateFormData("previous_home_experience", e.target.value)
                    }
                    className="mobile-input"
                  >
                    <option value="">Select experience</option>
                    <option value="none">No experience</option>
                    <option value="some">Some experience</option>
                    <option value="extensive">Extensive experience</option>
                  </select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.previous_home_experience || <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.meeting_availability || <span className="text-gray-500">Not specified</span>}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {formData.response_time_expectation || <span className="text-gray-500">Not specified</span>}
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
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 min-h-[100px]">
                  {formData.additional_context || <span className="text-gray-500">Not specified</span>}
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
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-gold px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-gold/90 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 sm:w-auto touch-friendly min-w-[100px]"
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
